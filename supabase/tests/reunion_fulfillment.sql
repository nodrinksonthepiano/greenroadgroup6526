begin;

do $$
declare
  v_event_id uuid;
  v_batch_id uuid;
  v_paid_order_id uuid;
  v_released_order_id uuid;
  v_reserved_before integer;
  v_sold_before integer;
  v_reserved integer;
  v_sold integer;
  v_ticket_count integer;
  v_email_status text;
  v_order_status text;
  v_newly_changed boolean;
begin
  select e.id, b.id, b.reserved_count, b.sold_count
    into v_event_id, v_batch_id, v_reserved_before, v_sold_before
  from public.events e
  join public.event_ticket_batches b on b.event_id = e.id
  where e.slug = 'scotia-2006'
    and b.batch_number = 1;

  if v_event_id is null or v_batch_id is null then
    raise exception 'reunion event and Batch 1 are required';
  end if;

  update public.events
  set status = 'open'
  where id = v_event_id;

  update public.event_ticket_batches
  set status = 'open'
  where id = v_batch_id;

  select reserved_order_id
    into v_paid_order_id
  from public.reserve_event_order(
    'scotia-2006',
    '00000000-0000-4000-8000-000000000101'::uuid,
    3,
    'Paid Test Purchaser',
    'paid-test@example.com',
    2006::smallint,
    null,
    false
  );

  perform public.attach_stripe_checkout_session(
    v_paid_order_id,
    'cs_test_reunion_paid_004',
    now() + interval '30 minutes'
  );

  select fulfilled_order_id, newly_paid
    into v_paid_order_id, v_newly_changed
  from public.fulfill_paid_event_order(
    'evt_test_reunion_paid_004',
    'checkout.session.completed',
    false,
    'cs_test_reunion_paid_004',
    'pi_test_reunion_paid_004',
    'cus_test_reunion_paid_004',
    'paid',
    6018,
    'usd'
  );

  if not v_newly_changed then
    raise exception 'first paid event did not fulfill the order';
  end if;

  select o.status, o.confirmation_email_status, b.reserved_count, b.sold_count
    into v_order_status, v_email_status, v_reserved, v_sold
  from public.event_orders o
  join public.event_ticket_batches b on b.id = o.batch_id
  where o.id = v_paid_order_id;

  select count(*)::integer
    into v_ticket_count
  from public.event_tickets
  where order_id = v_paid_order_id;

  if v_order_status <> 'paid'
    or v_email_status <> 'pending'
    or v_reserved <> v_reserved_before
    or v_sold <> v_sold_before + 3
    or v_ticket_count <> 3
  then
    raise exception 'paid fulfillment state is incorrect';
  end if;

  select fulfilled_order_id, newly_paid
    into v_paid_order_id, v_newly_changed
  from public.fulfill_paid_event_order(
    'evt_test_reunion_paid_004',
    'checkout.session.completed',
    false,
    'cs_test_reunion_paid_004',
    'pi_test_reunion_paid_004',
    'cus_test_reunion_paid_004',
    'paid',
    6018,
    'usd'
  );

  if v_newly_changed then
    raise exception 'replayed paid event fulfilled twice';
  end if;

  if (
    select count(*)
    from public.event_tickets
    where order_id = v_paid_order_id
  ) <> 3 then
    raise exception 'replayed paid event duplicated tickets';
  end if;

  select reserved_order_id
    into v_released_order_id
  from public.reserve_event_order(
    'scotia-2006',
    '00000000-0000-4000-8000-000000000102'::uuid,
    2,
    'Expired Test Purchaser',
    'expired-test@example.com'
  );

  perform public.attach_stripe_checkout_session(
    v_released_order_id,
    'cs_test_reunion_expired_004',
    now() + interval '30 minutes'
  );

  select released_order_id, newly_released
    into v_released_order_id, v_newly_changed
  from public.release_attached_event_order_reservation(
    'evt_test_reunion_expired_004',
    'checkout.session.expired',
    false,
    'cs_test_reunion_expired_004',
    'unpaid'
  );

  if not v_newly_changed then
    raise exception 'first expiration event did not release the order';
  end if;

  select o.status, b.reserved_count, b.sold_count
    into v_order_status, v_reserved, v_sold
  from public.event_orders o
  join public.event_ticket_batches b on b.id = o.batch_id
  where o.id = v_released_order_id;

  if v_order_status <> 'expired'
    or v_reserved <> v_reserved_before
    or v_sold <> v_sold_before + 3
  then
    raise exception 'expiration did not restore reserved inventory';
  end if;

  select released_order_id, newly_released
    into v_released_order_id, v_newly_changed
  from public.release_attached_event_order_reservation(
    'evt_test_reunion_expired_004',
    'checkout.session.expired',
    false,
    'cs_test_reunion_expired_004',
    'unpaid'
  );

  if v_newly_changed then
    raise exception 'replayed expiration released inventory twice';
  end if;

  if (
    select count(*)
    from public.stripe_webhook_events
    where stripe_event_id in (
      'evt_test_reunion_paid_004',
      'evt_test_reunion_expired_004'
    )
      and status = 'processed'
      and processed_at is not null
  ) <> 2 then
    raise exception 'both Stripe events must be marked processed';
  end if;
end;
$$;

rollback;
