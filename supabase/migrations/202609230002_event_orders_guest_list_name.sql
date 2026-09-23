alter table public.event_orders
  add column guest_list_name text;

alter table public.event_orders
  add constraint event_orders_guest_list_name_shape check (
    guest_list_name is null
    or (
      guest_list_name = btrim(guest_list_name)
      and char_length(guest_list_name) between 1 and 120
    )
  );

alter table public.event_orders
  add constraint event_orders_guest_list_opt_in_requires_name check (
    not guest_list_opt_in or guest_list_name is not null
  );

comment on column public.event_orders.guest_list_name is
  'Name the buyer chose to show on the reunion guest list. Null until they save one. The purchaser name is not displayed.';
