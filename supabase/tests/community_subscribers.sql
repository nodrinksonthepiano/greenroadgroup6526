-- Rolls back. Confirms the list is private and that only explicit
-- reunion marketing consent is imported.
begin;

do $$
declare
  v_enabled boolean;
  v_forced boolean;
  v_anon_select boolean;
  v_anon_insert boolean;
  v_service_insert boolean;
  v_opt_in_count integer;
  v_declined_count integer;
begin
  select c.relrowsecurity, c.relforcerowsecurity
    into v_enabled, v_forced
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'community_subscribers';

  if v_enabled is not true or v_forced is not true then
    raise exception 'community_subscribers must force row level security';
  end if;

  select
    has_table_privilege('anon', 'public.community_subscribers', 'select'),
    has_table_privilege('anon', 'public.community_subscribers', 'insert'),
    has_table_privilege('service_role', 'public.community_subscribers', 'insert')
  into v_anon_select, v_anon_insert, v_service_insert;

  if v_anon_select or v_anon_insert or not v_service_insert then
    raise exception 'community_subscribers privileges are incorrect';
  end if;

  insert into public.profiles (
    email,
    full_name,
    marketing_opt_in,
    marketing_opted_in_at
  )
  values (
    'community-audit-opt-in@example.com',
    'Opt In',
    true,
    timestamptz '2026-09-21 12:00:00+00'
  );

  insert into public.profiles (email, full_name, marketing_opt_in)
  values (
    'community-audit-declined@example.com',
    'Declined',
    false
  );

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
    and p.email in (
      'community-audit-opt-in@example.com',
      'community-audit-declined@example.com'
    )
  on conflict (email) do nothing;

  select count(*)::integer
    into v_opt_in_count
  from public.community_subscribers
  where email = 'community-audit-opt-in@example.com'
    and source = 'reunion_checkout'
    and subscribed
    and welcome_email_status = 'skipped'
    and first_name is null
    and consented_at = timestamptz '2026-09-21 12:00:00+00';

  if v_opt_in_count <> 1 then
    raise exception 'explicit reunion opt-in was not imported';
  end if;

  select count(*)::integer
    into v_declined_count
  from public.community_subscribers
  where email = 'community-audit-declined@example.com';

  if v_declined_count <> 0 then
    raise exception 'a profile without marketing consent was imported';
  end if;

  begin
    insert into public.community_subscribers (
      email,
      subscribed,
      consented_at,
      source,
      welcome_email_status,
      unsubscribe_token_hash
    )
    values (
      'community-audit-bad-source@example.com',
      true,
      now(),
      'ticket_purchase',
      'pending',
      encode(extensions.digest('token', 'sha256'), 'hex')
    );
    raise exception 'ticket_purchase must not be a subscriber source';
  exception
    when check_violation then
      null;
  end;
end;
$$;

rollback;
