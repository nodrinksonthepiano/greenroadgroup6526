-- Optional same-visit campaign labels. Does not change price, quantity,
-- hold time, or payment fulfillment.

alter table public.event_orders
  add column utm_source text,
  add column utm_medium text,
  add column utm_campaign text;

alter table public.event_orders
  add constraint event_orders_utm_source_shape check (
    utm_source is null
    or utm_source ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$'
  ),
  add constraint event_orders_utm_medium_shape check (
    utm_medium is null
    or utm_medium ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$'
  ),
  add constraint event_orders_utm_campaign_shape check (
    utm_campaign is null
    or utm_campaign ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$'
  );

comment on column public.event_orders.utm_source is
  'Whitelisted visit label. Null when absent or rejected. Not a purchaser identifier.';
comment on column public.event_orders.utm_medium is
  'Whitelisted visit label. Null when absent or rejected. Not a purchaser identifier.';
comment on column public.event_orders.utm_campaign is
  'Whitelisted visit label. Null when absent or rejected. Not a purchaser identifier.';

drop function public.reserve_event_order(
  text, uuid, integer, text, text, smallint, text, boolean
);

create function public.reserve_event_order(
  p_event_slug text,
  p_request_id uuid,
  p_quantity integer,
  p_purchaser_name text,
  p_purchaser_email text,
  p_graduation_year smallint default null,
  p_connection_note text default null,
  p_marketing_opt_in boolean default false,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
)
returns table (
  reserved_order_id uuid,
  reserved_batch_id uuid,
  reservation_expires_at timestamptz,
  unit_amount_cents integer,
  total_amount_cents integer
)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_event public.events%rowtype;
  v_batch public.event_ticket_batches%rowtype;
  v_existing public.event_orders%rowtype;
  v_existing_event_slug text;
  v_profile_id uuid;
  v_order public.event_orders%rowtype;
  v_email text := lower(btrim(p_purchaser_email));
  v_name text := btrim(p_purchaser_name);
  v_connection_note text := nullif(btrim(p_connection_note), '');
  v_utm_source text := case
    when p_utm_source is null then null
    when btrim(p_utm_source) ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$' then btrim(p_utm_source)
    else null
  end;
  v_utm_medium text := case
    when p_utm_medium is null then null
    when btrim(p_utm_medium) ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$' then btrim(p_utm_medium)
    else null
  end;
  v_utm_campaign text := case
    when p_utm_campaign is null then null
    when btrim(p_utm_campaign) ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$' then btrim(p_utm_campaign)
    else null
  end;
begin
  if p_request_id is null then
    raise exception using
      errcode = '22023',
      message = 'checkout request id is required';
  end if;

  if p_quantity is null or p_quantity < 1 then
    raise exception using
      errcode = '22023',
      message = 'ticket quantity must be positive';
  end if;

  if v_name is null or char_length(v_name) not between 1 and 120 then
    raise exception using
      errcode = '22023',
      message = 'purchaser name is required';
  end if;

  if v_email is null or position('@' in v_email) <= 1 then
    raise exception using
      errcode = '22023',
      message = 'valid purchaser email is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));

  select o.*
    into v_existing
  from public.event_orders o
  where o.checkout_request_id = p_request_id;

  if found then
    select e.slug
      into v_existing_event_slug
    from public.events e
    where e.id = v_existing.event_id;

    if v_existing_event_slug <> p_event_slug
      or v_existing.quantity <> p_quantity
      or lower(v_existing.purchaser_email) <> v_email
      or v_existing.purchaser_name <> v_name
      or v_existing.graduation_year is distinct from p_graduation_year
      or v_existing.connection_note is distinct from v_connection_note
      or v_existing.marketing_opt_in <> p_marketing_opt_in
    then
      raise exception using
        errcode = '22023',
        message = 'checkout request id was already used with different order details';
    end if;

    return query
    select
      v_existing.id,
      v_existing.batch_id,
      v_existing.reservation_expires_at,
      v_existing.unit_amount_cents,
      v_existing.total_amount_cents;
    return;
  end if;

  select e.*
    into v_event
  from public.events e
  where e.slug = p_event_slug
    and e.status = 'open';

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'event is not open for ticket reservations';
  end if;

  select b.*
    into v_batch
  from public.event_ticket_batches b
  where b.event_id = v_event.id
    and b.status = 'open'
  order by b.batch_number
  limit 1
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'no ticket batch is currently open';
  end if;

  if p_quantity > v_batch.max_per_order then
    raise exception using
      errcode = '22023',
      message = format(
        'ticket quantity exceeds this batch maximum of %s',
        v_batch.max_per_order
      );
  end if;

  if v_batch.reserved_count + v_batch.sold_count + p_quantity > v_batch.capacity then
    raise exception using
      errcode = 'P0001',
      message = 'not enough tickets remain in the open batch';
  end if;

  insert into public.profiles as existing_profile (
    email,
    full_name,
    graduation_year,
    marketing_opt_in,
    marketing_opted_in_at
  )
  values (
    v_email,
    v_name,
    p_graduation_year,
    p_marketing_opt_in,
    case when p_marketing_opt_in then now() else null end
  )
  on conflict ((lower(email))) do update
  set
    full_name = excluded.full_name,
    graduation_year = coalesce(excluded.graduation_year, existing_profile.graduation_year),
    marketing_opt_in = existing_profile.marketing_opt_in or excluded.marketing_opt_in,
    marketing_opted_in_at = case
      when existing_profile.marketing_opt_in then existing_profile.marketing_opted_in_at
      when excluded.marketing_opt_in then excluded.marketing_opted_in_at
      else null
    end
  returning id into v_profile_id;

  insert into public.event_orders (
    event_id,
    batch_id,
    profile_id,
    checkout_request_id,
    status,
    quantity,
    max_per_order_snapshot,
    unit_amount_cents,
    currency,
    purchaser_name,
    purchaser_email,
    graduation_year,
    connection_note,
    marketing_opt_in,
    utm_source,
    utm_medium,
    utm_campaign,
    reservation_expires_at
  )
  values (
    v_event.id,
    v_batch.id,
    v_profile_id,
    p_request_id,
    'reserved',
    p_quantity,
    v_batch.max_per_order,
    v_event.unit_amount_cents,
    v_event.currency,
    v_name,
    v_email,
    p_graduation_year,
    v_connection_note,
    p_marketing_opt_in,
    v_utm_source,
    v_utm_medium,
    v_utm_campaign,
    -- The buyer-facing Stripe window is reservation_minutes (30). The extra
    -- five minutes are an internal pre-Stripe creation/crash safety hold.
    now() + make_interval(mins => v_batch.reservation_minutes + 5)
  )
  returning * into v_order;

  update public.event_ticket_batches
  set reserved_count = reserved_count + p_quantity
  where id = v_batch.id;

  return query
  select
    v_order.id,
    v_order.batch_id,
    v_order.reservation_expires_at,
    v_order.unit_amount_cents,
    v_order.total_amount_cents;
end;
$$;

revoke all on function public.reserve_event_order(
  text, uuid, integer, text, text, smallint, text, boolean, text, text, text
) from public, anon, authenticated;

grant execute on function public.reserve_event_order(
  text, uuid, integer, text, text, smallint, text, boolean, text, text, text
) to service_role;

comment on function public.reserve_event_order(
  text, uuid, integer, text, text, smallint, text, boolean, text, text, text
) is
  'Atomically reserves quantity with a five-minute pre-Stripe safety cushion beyond the 30-minute buyer Checkout duration. Reusing a request UUID is idempotent. Optional utm labels are stored only when they match the whitelist; a retry does not treat a different label as a different order.';

notify pgrst, 'reload schema';
