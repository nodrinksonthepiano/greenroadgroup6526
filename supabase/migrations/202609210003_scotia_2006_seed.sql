begin;

with reunion_event as (
  insert into public.events (
    slug,
    name,
    event_date,
    time_zone,
    status,
    ticket_label,
    unit_amount_cents,
    currency,
    tax_behavior,
    stripe_tax_code,
    merchant_legal_name,
    checkout_return_path
  )
  values (
    'scotia-2006',
    'SGHS Class of 2006 Reunion',
    date '2026-10-31',
    'America/New_York',
    'draft',
    'Reunion dinner ticket',
    2006,
    'usd',
    'inclusive',
    null,
    'Greenroad Group Holdings LLC',
    '/events/scotia-2006'
  )
  returning id
)
insert into public.event_ticket_batches (
  event_id,
  batch_number,
  label,
  status,
  capacity,
  max_per_order,
  reservation_minutes
)
select
  id,
  1,
  'Batch 1',
  'draft',
  80,
  8,
  30
from reunion_event;

commit;
