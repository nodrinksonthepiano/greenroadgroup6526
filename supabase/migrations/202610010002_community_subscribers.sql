-- Voluntary Greenroad updates. This is not a ticket list.
-- Ticket purchase does not insert a row. The import at the bottom copies
-- only purchaser profiles that already stored marketing_opt_in = true.

begin;

create table public.community_subscribers (
  id uuid primary key default extensions.gen_random_uuid(),
  email text not null,
  first_name text,
  subscribed boolean not null default true,
  consented_at timestamptz not null,
  source text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  welcome_email_status text not null default 'pending',
  welcome_email_id text,
  welcome_email_sent_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_subscribers_email_key unique (email),
  constraint community_subscribers_email_shape check (
    email = btrim(email)
    and email = lower(email)
    and char_length(email) <= 320
    and position('@' in email) > 1
  ),
  constraint community_subscribers_first_name_shape check (
    first_name is null or char_length(btrim(first_name)) between 1 and 80
  ),
  constraint community_subscribers_source_valid check (
    source in (
      'homepage_join',
      'reunion_checkout',
      'reunion_page',
      'community',
      'kitchen',
      'custom_goods'
    )
  ),
  constraint community_subscribers_utm_source_shape check (
    utm_source is null
    or utm_source ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$'
  ),
  constraint community_subscribers_utm_medium_shape check (
    utm_medium is null
    or utm_medium ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$'
  ),
  constraint community_subscribers_utm_campaign_shape check (
    utm_campaign is null
    or utm_campaign ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$'
  ),
  constraint community_subscribers_welcome_status_valid check (
    welcome_email_status in ('pending', 'sent', 'failed', 'skipped')
  ),
  constraint community_subscribers_welcome_sent_check check (
    welcome_email_status <> 'sent'
    or (
      welcome_email_id is not null
      and welcome_email_sent_at is not null
    )
  ),
  constraint community_subscribers_subscription_time check (
    (subscribed and unsubscribed_at is null)
    or (not subscribed and unsubscribed_at is not null)
  ),
  constraint community_subscribers_token_hash_shape check (
    unsubscribe_token_hash ~ '^[0-9a-f]{64}$'
  )
);

create unique index community_subscribers_email_normalized_key
  on public.community_subscribers (lower(email));

create index community_subscribers_unsubscribe_token_hash_key
  on public.community_subscribers (unsubscribe_token_hash);

create trigger community_subscribers_set_updated_at
before update on public.community_subscribers
for each row execute function public.set_updated_at();

alter table public.community_subscribers enable row level security;
alter table public.community_subscribers force row level security;

revoke all on table public.community_subscribers from anon, authenticated;
grant select, insert, update, delete on table public.community_subscribers to service_role;

comment on table public.community_subscribers is
  'Voluntary Greenroad updates list and source of truth for marketing email. Ticket purchase does not create a row. Imported reunion rows are only profiles with marketing_opt_in true.';

comment on column public.community_subscribers.welcome_email_status is
  'skipped means a historical reunion opt-in was imported and was not sent a welcome.';

insert into public.community_subscribers (
  email,
  first_name,
  subscribed,
  consented_at,
  source,
  welcome_email_status,
  unsubscribe_token_hash,
  created_at
)
select
  lower(btrim(p.email)),
  null,
  true,
  p.marketing_opted_in_at,
  'reunion_checkout',
  'skipped',
  encode(extensions.digest(extensions.gen_random_bytes(32), 'sha256'), 'hex'),
  p.created_at
from public.profiles p
where p.marketing_opt_in = true
  and p.marketing_opted_in_at is not null
  and char_length(lower(btrim(p.email))) <= 320
  and position('@' in lower(btrim(p.email))) > 1
on conflict (email) do nothing;

commit;
