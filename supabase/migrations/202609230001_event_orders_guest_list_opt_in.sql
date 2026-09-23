alter table public.event_orders
  add column guest_list_opt_in boolean not null default false;

comment on column public.event_orders.guest_list_opt_in is
  'When true, the purchaser name may appear once on the buyer-only reunion guest list. Default is off.';
