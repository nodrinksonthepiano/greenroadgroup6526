begin;

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create table public.profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  full_name text not null,
  graduation_year smallint,
  marketing_opt_in boolean not null default false,
  marketing_opted_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_trimmed check (email = btrim(email)),
  constraint profiles_email_shape check (position('@' in email) > 1),
  constraint profiles_full_name_present check (char_length(btrim(full_name)) between 1 and 120),
  constraint profiles_graduation_year_range check (
    graduation_year is null or graduation_year between 1900 and 2100
  ),
  constraint profiles_marketing_consent_time check (
    not marketing_opt_in or marketing_opted_in_at is not null
  )
);

create unique index profiles_email_normalized_key
  on public.profiles (lower(email));

create table public.events (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  event_date date not null,
  time_zone text not null,
  status text not null default 'draft',
  ticket_label text not null,
  unit_amount_cents integer not null,
  currency text not null default 'usd',
  tax_behavior text not null default 'inclusive',
  stripe_tax_code text,
  merchant_legal_name text not null,
  checkout_return_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint events_name_present check (char_length(btrim(name)) between 1 and 160),
  constraint events_status_valid check (status in ('draft', 'open', 'closed', 'cancelled')),
  constraint events_ticket_label_present check (char_length(btrim(ticket_label)) between 1 and 160),
  constraint events_unit_amount_positive check (unit_amount_cents > 0),
  constraint events_currency_format check (currency ~ '^[a-z]{3}$'),
  constraint events_tax_behavior_valid check (tax_behavior in ('inclusive', 'exclusive', 'unspecified')),
  constraint events_return_path_local check (checkout_return_path ~ '^/')
);

create table public.event_ticket_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  batch_number integer not null,
  label text not null,
  status text not null default 'draft',
  capacity integer not null,
  max_per_order integer not null,
  reservation_minutes integer not null default 30,
  reserved_count integer not null default 0,
  sold_count integer not null default 0,
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_ticket_batches_event_batch_key unique (event_id, batch_number),
  constraint event_ticket_batches_id_event_key unique (id, event_id),
  constraint event_ticket_batches_number_positive check (batch_number > 0),
  constraint event_ticket_batches_label_present check (char_length(btrim(label)) between 1 and 80),
  constraint event_ticket_batches_status_valid check (
    status in ('draft', 'open', 'closed', 'sold_out')
  ),
  constraint event_ticket_batches_capacity_positive check (capacity > 0),
  constraint event_ticket_batches_max_per_order_valid check (
    max_per_order > 0 and max_per_order <= capacity
  ),
  constraint event_ticket_batches_reservation_window_valid check (
    reservation_minutes = 30
  ),
  constraint event_ticket_batches_counts_nonnegative check (
    reserved_count >= 0 and sold_count >= 0
  ),
  constraint event_ticket_batches_capacity_not_exceeded check (
    reserved_count + sold_count <= capacity
  ),
  constraint event_ticket_batches_window_valid check (
    closes_at is null or opens_at is null or closes_at > opens_at
  )
);

create unique index event_ticket_batches_one_open_per_event
  on public.event_ticket_batches (event_id)
  where status = 'open';

create table public.event_orders (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  batch_id uuid not null,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  checkout_request_id uuid not null unique,
  status text not null default 'reserved',
  quantity integer not null,
  max_per_order_snapshot integer not null,
  unit_amount_cents integer not null,
  total_amount_cents integer generated always as (quantity * unit_amount_cents) stored,
  currency text not null,
  purchaser_name text not null,
  purchaser_email text not null,
  graduation_year smallint,
  connection_note text,
  marketing_opt_in boolean not null default false,
  reservation_expires_at timestamptz not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  stripe_payment_status text,
  paid_at timestamptz,
  released_at timestamptz,
  confirmation_email_status text not null default 'not_ready',
  confirmation_email_id text,
  confirmation_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_orders_batch_event_fk
    foreign key (batch_id, event_id)
    references public.event_ticket_batches(id, event_id)
    on delete restrict,
  constraint event_orders_id_event_batch_key unique (id, event_id, batch_id),
  constraint event_orders_status_valid check (
    status in (
      'reserved',
      'paid',
      'expired',
      'cancelled',
      'payment_failed',
      'refunded',
      'partially_refunded'
    )
  ),
  constraint event_orders_quantity_within_snapshot check (
    quantity > 0 and quantity <= max_per_order_snapshot
  ),
  constraint event_orders_amount_positive check (unit_amount_cents > 0),
  constraint event_orders_currency_format check (currency ~ '^[a-z]{3}$'),
  constraint event_orders_purchaser_name_present check (
    char_length(btrim(purchaser_name)) between 1 and 120
  ),
  constraint event_orders_purchaser_email_shape check (
    purchaser_email = btrim(purchaser_email)
    and position('@' in purchaser_email) > 1
  ),
  constraint event_orders_graduation_year_range check (
    graduation_year is null or graduation_year between 1900 and 2100
  ),
  constraint event_orders_connection_note_length check (
    connection_note is null or char_length(connection_note) <= 1000
  ),
  constraint event_orders_paid_time check (
    status <> 'paid' or paid_at is not null
  ),
  constraint event_orders_release_time check (
    status not in ('expired', 'cancelled', 'payment_failed') or released_at is not null
  ),
  constraint event_orders_confirmation_status_valid check (
    confirmation_email_status in ('not_ready', 'pending', 'sent', 'failed')
  ),
  constraint event_orders_confirmation_sent_time check (
    confirmation_email_status <> 'sent' or confirmation_email_sent_at is not null
  )
);

create index event_orders_event_status_idx
  on public.event_orders (event_id, status);

create index event_orders_batch_status_idx
  on public.event_orders (batch_id, status);

create index event_orders_profile_created_idx
  on public.event_orders (profile_id, created_at desc);

create index event_orders_reservation_expiry_idx
  on public.event_orders (reservation_expires_at)
  where status = 'reserved';

create table public.event_tickets (
  id uuid primary key default extensions.gen_random_uuid(),
  ticket_number bigint generated always as identity unique,
  event_id uuid not null references public.events(id) on delete restrict,
  batch_id uuid not null,
  order_id uuid not null,
  sequence_in_order integer not null,
  status text not null default 'valid',
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_tickets_order_event_batch_fk
    foreign key (order_id, event_id, batch_id)
    references public.event_orders(id, event_id, batch_id)
    on delete restrict,
  constraint event_tickets_batch_event_fk
    foreign key (batch_id, event_id)
    references public.event_ticket_batches(id, event_id)
    on delete restrict,
  constraint event_tickets_order_sequence_key unique (order_id, sequence_in_order),
  constraint event_tickets_sequence_positive check (sequence_in_order > 0),
  constraint event_tickets_status_valid check (
    status in ('valid', 'checked_in', 'refunded', 'void', 'transferred')
  ),
  constraint event_tickets_checkin_state check (
    (status = 'checked_in' and checked_in_at is not null)
    or (status <> 'checked_in' and checked_in_at is null)
  )
);

create index event_tickets_event_status_idx
  on public.event_tickets (event_id, status);

create index event_tickets_order_idx
  on public.event_tickets (order_id);

create table public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  order_id uuid references public.event_orders(id) on delete set null,
  status text not null default 'received',
  attempt_count integer not null default 1,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  constraint stripe_webhook_events_id_present check (
    char_length(btrim(stripe_event_id)) > 0
  ),
  constraint stripe_webhook_events_type_present check (
    char_length(btrim(event_type)) > 0
  ),
  constraint stripe_webhook_events_status_valid check (
    status in ('received', 'processed', 'failed')
  ),
  constraint stripe_webhook_events_attempts_positive check (attempt_count > 0),
  constraint stripe_webhook_events_processed_time check (
    status <> 'processed' or processed_at is not null
  ),
  constraint stripe_webhook_events_error_state check (
    status <> 'failed' or last_error is not null
  )
);

create index stripe_webhook_events_order_idx
  on public.stripe_webhook_events (order_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger event_ticket_batches_set_updated_at
before update on public.event_ticket_batches
for each row execute function public.set_updated_at();

create trigger event_orders_set_updated_at
before update on public.event_orders
for each row execute function public.set_updated_at();

create trigger event_tickets_set_updated_at
before update on public.event_tickets
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_ticket_batches enable row level security;
alter table public.event_orders enable row level security;
alter table public.event_tickets enable row level security;
alter table public.stripe_webhook_events enable row level security;

alter table public.profiles force row level security;
alter table public.events force row level security;
alter table public.event_ticket_batches force row level security;
alter table public.event_orders force row level security;
alter table public.event_tickets force row level security;
alter table public.stripe_webhook_events force row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.events from anon, authenticated;
revoke all on table public.event_ticket_batches from anon, authenticated;
revoke all on table public.event_orders from anon, authenticated;
revoke all on table public.event_tickets from anon, authenticated;
revoke all on table public.stripe_webhook_events from anon, authenticated;

grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.events to service_role;
grant select, insert, update, delete on table public.event_ticket_batches to service_role;
grant select, insert, update, delete on table public.event_orders to service_role;
grant select, insert, update, delete on table public.event_tickets to service_role;
grant select, insert, update, delete on table public.stripe_webhook_events to service_role;
grant usage, select on sequence public.event_tickets_ticket_number_seq to service_role;

comment on table public.profiles is
  'Greenroad purchaser profiles keyed by normalized email; auth_user_id is reserved for future Supabase identity attachment.';
comment on table public.events is
  'Greenroad events. Event status must be opened manually before ticket reservations are accepted.';
comment on table public.event_ticket_batches is
  'Manually released ticket inventory. max_per_order is batch configuration; reservation_minutes is the 30-minute buyer-facing Stripe Checkout duration.';
comment on table public.event_orders is
  'Server-created event orders and immutable purchase snapshots. reservation_expires_at begins as a 35-minute provisional hold and is shortened to Stripe expires_at on attachment.';
comment on table public.event_tickets is
  'One internal ticket row and number per paid admission. V1 does not require attendee names or QR codes.';
comment on table public.stripe_webhook_events is
  'Stripe event deduplication ledger. processed_at is set only in the same transaction as required order writes.';

commit;
