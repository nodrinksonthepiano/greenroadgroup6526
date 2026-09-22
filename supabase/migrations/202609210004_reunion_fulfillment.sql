begin;

create or replace function public.process_reunion_stripe_event(
  p_stripe_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_session_id text,
  p_payment_status text,
  p_payment_intent_id text default null,
  p_customer_id text default null,
  p_amount_total integer default null,
  p_currency text default null
)
returns table (
  processed_order_id uuid,
  processed_order_status text,
  payment_fulfilled boolean,
  reservation_released boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_webhook public.stripe_webhook_events%rowtype;
  v_order public.event_orders%rowtype;
  v_rows integer;
  v_ticket_count integer;
  v_fulfilled boolean := false;
  v_released boolean := false;
  v_release_status text;
begin
  if nullif(btrim(p_stripe_event_id), '') is null
    or nullif(btrim(p_session_id), '') is null
  then
    raise exception using
      errcode = '22023',
      message = 'Stripe event id and Checkout Session id are required';
  end if;

  if p_event_type not in (
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.expired'
  ) then
    raise exception using
      errcode = '22023',
      message = 'unsupported Stripe event type';
  end if;

  select *
    into v_webhook
  from public.stripe_webhook_events
  where stripe_event_id = p_stripe_event_id
  for update;

  if found then
    if v_webhook.event_type <> p_event_type
      or v_webhook.livemode <> p_livemode
    then
      raise exception using
        errcode = '22023',
        message = 'Stripe event id was reused with different event details';
    end if;

    update public.stripe_webhook_events
    set
      attempt_count = attempt_count + 1,
      last_error = null
    where stripe_event_id = p_stripe_event_id;

    if v_webhook.status = 'processed' then
      select *
        into v_order
      from public.event_orders
      where id = v_webhook.order_id;

      return query
      select
        v_order.id,
        v_order.status,
        false,
        false;
      return;
    end if;
  else
    insert into public.stripe_webhook_events (
      stripe_event_id,
      event_type,
      livemode,
      status
    )
    values (
      p_stripe_event_id,
      p_event_type,
      p_livemode,
      'received'
    );
  end if;

  select o.*
    into v_order
  from public.event_orders o
  join public.events e on e.id = o.event_id
  where o.stripe_checkout_session_id = p_session_id
    and e.slug = 'scotia-2006'
  for update of o;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'reunion order for Checkout Session was not found';
  end if;

  if p_amount_total is null
    or p_amount_total <> v_order.total_amount_cents
    or lower(coalesce(p_currency, '')) <> v_order.currency
  then
    raise exception using
      errcode = '22023',
      message = 'Stripe Checkout amount or currency does not match the order';
  end if;

  if p_event_type = 'checkout.session.async_payment_succeeded'
    or (
      p_event_type = 'checkout.session.completed'
      and p_payment_status = 'paid'
    )
  then
    if p_payment_status <> 'paid' then
      raise exception using
        errcode = '22023',
        message = 'paid fulfillment requires Stripe payment_status paid';
    end if;

    if v_order.status = 'reserved' then
      update public.event_ticket_batches
      set
        reserved_count = reserved_count - v_order.quantity,
        sold_count = sold_count + v_order.quantity
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
        status = 'paid',
        stripe_payment_intent_id = coalesce(
          p_payment_intent_id,
          stripe_payment_intent_id
        ),
        stripe_customer_id = coalesce(p_customer_id, stripe_customer_id),
        stripe_payment_status = p_payment_status,
        paid_at = coalesce(paid_at, now()),
        confirmation_email_status = case
          when confirmation_email_status = 'not_ready' then 'pending'
          else confirmation_email_status
        end
      where id = v_order.id
      returning * into v_order;

      insert into public.event_tickets (
        event_id,
        batch_id,
        order_id,
        sequence_in_order
      )
      select
        v_order.event_id,
        v_order.batch_id,
        v_order.id,
        sequence_number
      from generate_series(1, v_order.quantity) as generated(sequence_number)
      on conflict (order_id, sequence_in_order) do nothing;

      v_fulfilled := true;
    elsif v_order.status <> 'paid' then
      raise exception using
        errcode = 'P0001',
        message = 'only reserved orders can be fulfilled';
    end if;

    select count(*)::integer
      into v_ticket_count
    from public.event_tickets
    where order_id = v_order.id;

    if v_ticket_count <> v_order.quantity then
      raise exception using
        errcode = 'P0001',
        message = 'paid order ticket count is inconsistent';
    end if;
  elsif p_event_type in (
    'checkout.session.expired',
    'checkout.session.async_payment_failed'
  ) then
    v_release_status := case
      when p_event_type = 'checkout.session.expired' then 'expired'
      else 'payment_failed'
    end;

    if v_order.status = 'reserved' then
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
        status = v_release_status,
        stripe_payment_intent_id = coalesce(
          p_payment_intent_id,
          stripe_payment_intent_id
        ),
        stripe_customer_id = coalesce(p_customer_id, stripe_customer_id),
        stripe_payment_status = p_payment_status,
        released_at = coalesce(released_at, now())
      where id = v_order.id
      returning * into v_order;

      v_released := true;
    end if;
  elsif p_event_type = 'checkout.session.completed'
    and v_order.status = 'reserved'
  then
    update public.event_orders
    set
      stripe_payment_intent_id = coalesce(
        p_payment_intent_id,
        stripe_payment_intent_id
      ),
      stripe_customer_id = coalesce(p_customer_id, stripe_customer_id),
      stripe_payment_status = p_payment_status
    where id = v_order.id
    returning * into v_order;
  end if;

  update public.stripe_webhook_events
  set
    order_id = v_order.id,
    status = 'processed',
    processed_at = now(),
    last_error = null
  where stripe_event_id = p_stripe_event_id;

  return query
  select
    v_order.id,
    v_order.status,
    v_fulfilled,
    v_released;
end;
$$;

revoke all on function public.process_reunion_stripe_event(
  text, text, boolean, text, text, text, text, integer, text
) from public, anon, authenticated;

grant execute on function public.process_reunion_stripe_event(
  text, text, boolean, text, text, text, text, integer, text
) to service_role;

comment on function public.process_reunion_stripe_event(
  text, text, boolean, text, text, text, text, integer, text
) is
  'Idempotently applies verified reunion Checkout lifecycle events. Paid fulfillment, inventory conversion, ticket creation, and webhook completion occur in one transaction.';

commit;
begin;

create or replace function public.fulfill_paid_event_order(
  p_stripe_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id text,
  p_stripe_customer_id text,
  p_payment_status text,
  p_amount_total integer,
  p_currency text
)
returns table (
  fulfilled_order_id uuid,
  newly_paid boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.event_orders%rowtype;
  v_existing_event public.stripe_webhook_events%rowtype;
  v_ticket_count integer;
  v_rows integer;
begin
  if p_event_type not in (
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded'
  ) then
    raise exception using
      errcode = '22023',
      message = 'invalid paid Checkout event type';
  end if;

  if p_payment_status <> 'paid' then
    raise exception using
      errcode = '22023',
      message = 'Checkout Session is not paid';
  end if;

  if nullif(btrim(p_stripe_event_id), '') is null
    or nullif(btrim(p_stripe_checkout_session_id), '') is null
  then
    raise exception using
      errcode = '22023',
      message = 'Stripe event and Checkout Session ids are required';
  end if;

  select *
    into v_existing_event
  from public.stripe_webhook_events
  where stripe_event_id = p_stripe_event_id
  for update;

  if found and v_existing_event.status = 'processed' then
    update public.stripe_webhook_events
    set attempt_count = attempt_count + 1
    where stripe_event_id = p_stripe_event_id;

    return query
    select v_existing_event.order_id, false;
    return;
  end if;

  if found then
    update public.stripe_webhook_events
    set
      attempt_count = attempt_count + 1,
      status = 'received',
      last_error = null
    where stripe_event_id = p_stripe_event_id;
  else
    insert into public.stripe_webhook_events (
      stripe_event_id,
      event_type,
      livemode,
      status
    )
    values (
      p_stripe_event_id,
      p_event_type,
      p_livemode,
      'received'
    );
  end if;

  select *
    into v_order
  from public.event_orders
  where stripe_checkout_session_id = p_stripe_checkout_session_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'event order for Checkout Session not found';
  end if;

  if p_amount_total is distinct from v_order.total_amount_cents
    or lower(p_currency) is distinct from v_order.currency
  then
    raise exception using
      errcode = '22023',
      message = 'Checkout Session amount or currency does not match the order';
  end if;

  if v_order.status = 'paid' then
    if v_order.stripe_payment_intent_id is not null
      and v_order.stripe_payment_intent_id is distinct from p_stripe_payment_intent_id
    then
      raise exception using
        errcode = '22023',
        message = 'paid order has a different Stripe PaymentIntent';
    end if;

    select count(*)::integer
      into v_ticket_count
    from public.event_tickets
    where order_id = v_order.id;

    if v_ticket_count <> v_order.quantity then
      raise exception using
        errcode = 'P0001',
        message = 'paid order ticket count is inconsistent';
    end if;

    update public.stripe_webhook_events
    set
      order_id = v_order.id,
      status = 'processed',
      processed_at = now(),
      last_error = null
    where stripe_event_id = p_stripe_event_id;

    return query
    select v_order.id, false;
    return;
  end if;

  if v_order.status <> 'reserved' then
    raise exception using
      errcode = 'P0001',
      message = format('order cannot be paid from status %s', v_order.status);
  end if;

  update public.event_ticket_batches
  set
    reserved_count = reserved_count - v_order.quantity,
    sold_count = sold_count + v_order.quantity
  where id = v_order.batch_id
    and reserved_count >= v_order.quantity
    and sold_count + v_order.quantity <= capacity;

  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception using
      errcode = 'P0001',
      message = 'ticket batch counters are inconsistent';
  end if;

  update public.event_orders
  set
    status = 'paid',
    stripe_payment_intent_id = p_stripe_payment_intent_id,
    stripe_customer_id = p_stripe_customer_id,
    stripe_payment_status = p_payment_status,
    paid_at = now(),
    confirmation_email_status = case
      when confirmation_email_status = 'sent' then 'sent'
      else 'pending'
    end
  where id = v_order.id;

  insert into public.event_tickets (
    event_id,
    batch_id,
    order_id,
    sequence_in_order
  )
  select
    v_order.event_id,
    v_order.batch_id,
    v_order.id,
    sequence_number
  from generate_series(1, v_order.quantity) as sequence_number;

  update public.stripe_webhook_events
  set
    order_id = v_order.id,
    status = 'processed',
    processed_at = now(),
    last_error = null
  where stripe_event_id = p_stripe_event_id;

  return query
  select v_order.id, true;
end;
$$;

create or replace function public.release_attached_event_order_reservation(
  p_stripe_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_stripe_checkout_session_id text,
  p_payment_status text
)
returns table (
  released_order_id uuid,
  newly_released boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.event_orders%rowtype;
  v_existing_event public.stripe_webhook_events%rowtype;
  v_release_status text;
  v_rows integer;
begin
  if p_event_type = 'checkout.session.expired' then
    v_release_status := 'expired';
  elsif p_event_type = 'checkout.session.async_payment_failed' then
    v_release_status := 'payment_failed';
  else
    raise exception using
      errcode = '22023',
      message = 'invalid Checkout release event type';
  end if;

  if nullif(btrim(p_stripe_event_id), '') is null
    or nullif(btrim(p_stripe_checkout_session_id), '') is null
  then
    raise exception using
      errcode = '22023',
      message = 'Stripe event and Checkout Session ids are required';
  end if;

  select *
    into v_existing_event
  from public.stripe_webhook_events
  where stripe_event_id = p_stripe_event_id
  for update;

  if found and v_existing_event.status = 'processed' then
    update public.stripe_webhook_events
    set attempt_count = attempt_count + 1
    where stripe_event_id = p_stripe_event_id;

    return query
    select v_existing_event.order_id, false;
    return;
  end if;

  if found then
    update public.stripe_webhook_events
    set
      attempt_count = attempt_count + 1,
      status = 'received',
      last_error = null
    where stripe_event_id = p_stripe_event_id;
  else
    insert into public.stripe_webhook_events (
      stripe_event_id,
      event_type,
      livemode,
      status
    )
    values (
      p_stripe_event_id,
      p_event_type,
      p_livemode,
      'received'
    );
  end if;

  select *
    into v_order
  from public.event_orders
  where stripe_checkout_session_id = p_stripe_checkout_session_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'event order for Checkout Session not found';
  end if;

  if v_order.status = 'reserved' then
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
      status = v_release_status,
      stripe_payment_status = p_payment_status,
      released_at = now()
    where id = v_order.id;
  end if;

  update public.stripe_webhook_events
  set
    order_id = v_order.id,
    status = 'processed',
    processed_at = now(),
    last_error = null
  where stripe_event_id = p_stripe_event_id;

  return query
  select v_order.id, v_order.status = 'reserved';
end;
$$;

revoke all on function public.fulfill_paid_event_order(
  text, text, boolean, text, text, text, text, integer, text
) from public, anon, authenticated;
revoke all on function public.release_attached_event_order_reservation(
  text, text, boolean, text, text
) from public, anon, authenticated;

grant execute on function public.fulfill_paid_event_order(
  text, text, boolean, text, text, text, text, integer, text
) to service_role;
grant execute on function public.release_attached_event_order_reservation(
  text, text, boolean, text, text
) to service_role;

comment on function public.fulfill_paid_event_order(
  text, text, boolean, text, text, text, text, integer, text
) is
  'Idempotently converts reserved inventory to sold, marks the order paid, creates one ticket row per admission, and marks the Stripe event processed in one transaction.';
comment on function public.release_attached_event_order_reservation(
  text, text, boolean, text, text
) is
  'Idempotently releases an attached reservation after a verified Stripe expiration or asynchronous payment failure.';

commit;
