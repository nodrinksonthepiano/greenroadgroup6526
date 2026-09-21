begin;

do $$
declare
  v_event_id uuid;
  v_batch_id uuid;
  v_order_id uuid;
  v_provisional_order_id uuid;
  v_expires_at timestamptz;
  v_session_expires_at timestamptz;
  v_duplicate_order_id uuid;
  v_reserved integer;
  v_sold integer;
  v_order_status text;
  v_batch_status text;
  v_iteration integer;
  v_rls_table_count integer;
  v_cleanup_count integer;
begin
  select e.id
    into v_event_id
  from public.events e
  where e.slug = 'scotia-2006'
    and e.event_date = date '2026-10-31'
    and e.time_zone = 'America/New_York'
    and e.status = 'draft'
    and e.unit_amount_cents = 2006
    and e.tax_behavior = 'inclusive'
    and e.stripe_tax_code is null
    and e.checkout_return_path = '/events/scotia-2006';

  if v_event_id is null then
    raise exception 'reunion event seed does not match locked facts';
  end if;

  select b.id
    into v_batch_id
  from public.event_ticket_batches b
  where b.event_id = v_event_id
    and b.batch_number = 1
    and b.status = 'draft'
    and b.capacity = 80
    and b.max_per_order = 8
    and b.reservation_minutes = 30;

  if v_batch_id is null then
    raise exception 'Batch 1 seed does not match locked inventory configuration';
  end if;

  select count(*)::integer
    into v_rls_table_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (
      'profiles',
      'events',
      'event_ticket_batches',
      'event_orders',
      'event_tickets',
      'stripe_webhook_events'
    );

  if v_rls_table_count <> 6 or exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'profiles',
        'events',
        'event_ticket_batches',
        'event_orders',
        'event_tickets',
        'stripe_webhook_events'
      )
      and (not c.relrowsecurity or not c.relforcerowsecurity)
  ) then
    raise exception 'all reunion tables must have RLS enabled and forced';
  end if;

  update public.events
  set status = 'open'
  where id = v_event_id;

  update public.event_ticket_batches
  set status = 'open'
  where id = v_batch_id;

  select r.reserved_order_id, r.reservation_expires_at
    into v_order_id, v_expires_at
  from public.reserve_event_order(
    'scotia-2006',
    '00000000-0000-4000-8000-000000000001'::uuid,
    8,
    'Test Purchaser',
    'purchaser@example.com',
    2006::smallint,
    'Test connection',
    false
  ) r;

  if v_order_id is null
    or v_expires_at < now() + interval '34 minutes'
    or v_expires_at > now() + interval '36 minutes'
  then
    raise exception 'reservation did not create the expected 35-minute provisional hold';
  end if;

  select r.reserved_order_id
    into v_duplicate_order_id
  from public.reserve_event_order(
    'scotia-2006',
    '00000000-0000-4000-8000-000000000001'::uuid,
    8,
    'Test Purchaser',
    'purchaser@example.com',
    2006::smallint,
    'Test connection',
    false
  ) r;

  if v_duplicate_order_id <> v_order_id then
    raise exception 'reusing a checkout request id created a different order';
  end if;

  select reserved_count, sold_count
    into v_reserved, v_sold
  from public.event_ticket_batches
  where id = v_batch_id;

  if v_reserved <> 8 or v_sold <> 0 then
    raise exception 'idempotent reservation changed inventory more than once';
  end if;

  begin
    perform *
    from public.reserve_event_order(
      'scotia-2006',
      extensions.gen_random_uuid(),
      9,
      'Over Limit',
      'over-limit@example.com'
    );
    raise exception 'quantity above max_per_order was accepted';
  exception
    when sqlstate '22023' then
      null;
  end;

  begin
    perform public.release_event_order_reservation(v_order_id, 'expired');
    raise exception using
      errcode = 'XX000',
      message = 'unexpired unattached provisional reservation was released';
  exception
    when sqlstate '22023' then
      null;
  end;

  begin
    perform public.attach_stripe_checkout_session(
      v_order_id,
      'cs_test_reunion_too_long',
      v_expires_at + interval '1 second'
    );
    raise exception using
      errcode = 'XX000',
      message = 'Checkout Session was allowed to outlive its inventory hold';
  exception
    when sqlstate '22023' then
      null;
  end;

  v_session_expires_at := now() + interval '30 minutes';

  perform public.attach_stripe_checkout_session(
    v_order_id,
    'cs_test_reunion_reservation',
    v_session_expires_at
  );

  if not exists (
    select 1
    from public.event_orders
    where id = v_order_id
      and stripe_checkout_session_id = 'cs_test_reunion_reservation'
      and reservation_expires_at = v_session_expires_at
      and status = 'reserved'
  ) then
    raise exception 'Stripe Checkout Session did not attach and shorten the provisional hold';
  end if;

  begin
    perform public.release_event_order_reservation(v_order_id, 'cancelled');
    raise exception using
      errcode = 'XX000',
      message = 'attached reservation was released without Stripe lifecycle processing';
  exception
    when sqlstate '22023' then
      null;
  end;

  select r.reserved_order_id
    into v_provisional_order_id
  from public.reserve_event_order(
    'scotia-2006',
    '00000000-0000-4000-8000-000000000002'::uuid,
    2,
    'Provisional Purchaser',
    'provisional@example.com'
  ) r;

  v_cleanup_count :=
    public.release_expired_unattached_event_order_reservations(100);

  if v_cleanup_count <> 0 then
    raise exception 'unexpired provisional cleanup released inventory early';
  end if;

  update public.event_orders
  set reservation_expires_at = now() - interval '1 second'
  where id = v_provisional_order_id;

  v_cleanup_count :=
    public.release_expired_unattached_event_order_reservations(100);

  if v_cleanup_count <> 1 then
    raise exception 'expired provisional cleanup did not release exactly one order';
  end if;

  v_cleanup_count :=
    public.release_expired_unattached_event_order_reservations(100);

  if v_cleanup_count <> 0 then
    raise exception 'expired provisional cleanup released the same order twice';
  end if;

  select o.status, b.reserved_count, b.sold_count
    into v_order_status, v_reserved, v_sold
  from public.event_orders o
  join public.event_ticket_batches b on b.id = o.batch_id
  where o.id = v_provisional_order_id;

  if v_order_status <> 'expired' or v_reserved <> 8 or v_sold <> 0 then
    raise exception 'provisional cleanup did not idempotently restore inventory';
  end if;

  -- This is a sequential capacity test. A real two-session transaction test is
  -- required against the sandbox database before ticket sales open.
  for v_iteration in 1..9 loop
    perform *
    from public.reserve_event_order(
      'scotia-2006',
      extensions.gen_random_uuid(),
      8,
      format('Capacity Purchaser %s', v_iteration),
      format('capacity-%s@example.com', v_iteration)
    );
  end loop;

  select reserved_count, sold_count, status
    into v_reserved, v_sold, v_batch_status
  from public.event_ticket_batches
  where id = v_batch_id;

  if v_reserved <> 80 or v_sold <> 0 or v_batch_status <> 'open' then
    raise exception 'capacity setup did not consume all Batch 1 inventory';
  end if;

  begin
    perform *
    from public.reserve_event_order(
      'scotia-2006',
      extensions.gen_random_uuid(),
      1,
      'No Inventory',
      'no-inventory@example.com'
    );
    raise exception using
      errcode = 'XX000',
      message = 'reservation exceeded Batch 1 capacity';
  exception
    when sqlstate 'P0001' then
      null;
  end;
end;
$$;

rollback;
