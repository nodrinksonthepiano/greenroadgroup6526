begin;

-- Phase 1 review boundary:
-- These functions reserve, attach, and release inventory only. Paid
-- fulfillment, Stripe webhook deduplication/processing, sold-count updates,
-- and ticket creation require a later reviewed migration and are not
-- application-ready in this phase.

create or replace function public.reserve_event_order(
  p_event_slug text,
  p_request_id uuid,
  p_quantity integer,
  p_purchaser_name text,
  p_purchaser_email text,
  p_graduation_year smallint default null,
  p_connection_note text default null,
  p_marketing_opt_in boolean default false
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

create or replace function public.attach_stripe_checkout_session(
  p_order_id uuid,
  p_stripe_checkout_session_id text,
  p_session_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.event_orders%rowtype;
begin
  if nullif(btrim(p_stripe_checkout_session_id), '') is null then
    raise exception using
      errcode = '22023',
      message = 'Stripe Checkout Session id is required';
  end if;

  select *
    into v_order
  from public.event_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'event order not found';
  end if;

  if v_order.status <> 'reserved' then
    raise exception using
      errcode = 'P0001',
      message = 'Stripe Checkout Session can only attach to a reserved order';
  end if;

  if v_order.stripe_checkout_session_id is not null
    and v_order.stripe_checkout_session_id <> p_stripe_checkout_session_id
  then
    raise exception using
      errcode = '23505',
      message = 'event order already has a different Stripe Checkout Session';
  end if;

  if v_order.stripe_checkout_session_id = p_stripe_checkout_session_id then
    if v_order.reservation_expires_at is distinct from p_session_expires_at then
      raise exception using
        errcode = '22023',
        message = 'attached Stripe Checkout Session expiration cannot change';
    end if;
    return;
  end if;

  if p_session_expires_at is null or p_session_expires_at <= now() then
    raise exception using
      errcode = '22023',
      message = 'Stripe Checkout Session expiration must be in the future';
  end if;

  if p_session_expires_at > v_order.reservation_expires_at then
    raise exception using
      errcode = '22023',
      message = 'Stripe Checkout Session expiration exceeds the inventory reservation';
  end if;

  update public.event_orders
  set
    stripe_checkout_session_id = p_stripe_checkout_session_id,
    reservation_expires_at = p_session_expires_at
  where id = p_order_id;
end;
$$;

create or replace function public.release_event_order_reservation(
  p_order_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.event_orders%rowtype;
  v_rows integer;
begin
  if p_reason not in ('expired', 'cancelled', 'payment_failed') then
    raise exception using
      errcode = '22023',
      message = 'invalid reservation release reason';
  end if;

  select *
    into v_order
  from public.event_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'event order not found';
  end if;

  if v_order.status <> 'reserved' then
    return false;
  end if;

  if v_order.stripe_checkout_session_id is not null then
    raise exception using
      errcode = '22023',
      message = 'attached Stripe reservations require verified lifecycle processing';
  end if;

  if p_reason = 'expired' and v_order.reservation_expires_at > now() then
    raise exception using
      errcode = '22023',
      message = 'inventory reservation has not expired';
  end if;

  update public.event_ticket_batches
  set reserved_count = reserved_count - v_order.quantity
  where id = v_order.batch_id
    and reserved_count >= v_order.quantity;

  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception using
      errcode = 'P0001',
      message = 'ticket batch reservation counter is inconsistent';
  end if;

  update public.event_orders
  set
    status = p_reason,
    released_at = now()
  where id = p_order_id;

  return true;
end;
$$;

create or replace function public.release_expired_unattached_event_order_reservations(
  p_limit integer default 100
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.event_orders%rowtype;
  v_rows integer;
  v_released integer := 0;
begin
  if p_limit is null or p_limit < 1 or p_limit > 1000 then
    raise exception using
      errcode = '22023',
      message = 'cleanup limit must be between 1 and 1000';
  end if;

  for v_order in
    select o.*
    from public.event_orders o
    where o.status = 'reserved'
      and o.stripe_checkout_session_id is null
      and o.reservation_expires_at <= now()
    order by o.reservation_expires_at, o.id
    limit p_limit
    for update skip locked
  loop
    update public.event_ticket_batches
    set reserved_count = reserved_count - v_order.quantity
    where id = v_order.batch_id
      and reserved_count >= v_order.quantity;

    get diagnostics v_rows = row_count;
    if v_rows <> 1 then
      raise exception using
        errcode = 'P0001',
        message = 'ticket batch reservation counter is inconsistent';
    end if;

    update public.event_orders
    set
      status = 'expired',
      released_at = now()
    where id = v_order.id;

    v_released := v_released + 1;
  end loop;

  return v_released;
end;
$$;

revoke all on function public.reserve_event_order(
  text, uuid, integer, text, text, smallint, text, boolean
) from public, anon, authenticated;
revoke all on function public.attach_stripe_checkout_session(
  uuid, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.release_event_order_reservation(
  uuid, text
) from public, anon, authenticated;
revoke all on function public.release_expired_unattached_event_order_reservations(
  integer
) from public, anon, authenticated;

grant execute on function public.reserve_event_order(
  text, uuid, integer, text, text, smallint, text, boolean
) to service_role;
grant execute on function public.attach_stripe_checkout_session(
  uuid, text, timestamptz
) to service_role;
grant execute on function public.release_event_order_reservation(
  uuid, text
) to service_role;
grant execute on function public.release_expired_unattached_event_order_reservations(
  integer
) to service_role;

comment on function public.reserve_event_order(
  text, uuid, integer, text, text, smallint, text, boolean
) is
  'Atomically reserves quantity with a five-minute pre-Stripe safety cushion beyond the 30-minute buyer Checkout duration. Reusing a request UUID is idempotent.';
comment on function public.attach_stripe_checkout_session(
  uuid, text, timestamptz
) is
  'Attaches one unique Stripe Checkout Session and shortens the provisional hold to Stripe expires_at; it never extends the hold.';
comment on function public.release_event_order_reservation(
  uuid, text
) is
  'Idempotently returns an unattached provisional reservation. Attached sessions require verified Stripe lifecycle handling in a later phase.';
comment on function public.release_expired_unattached_event_order_reservations(
  integer
) is
  'Safely releases expired provisional orders that never attached a Stripe Checkout Session. Uses row locks with SKIP LOCKED for concurrent cleanup callers.';

commit;
