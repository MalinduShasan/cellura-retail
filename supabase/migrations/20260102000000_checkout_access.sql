create extension if not exists pgcrypto;

do $$
begin
  create type payment_method as enum ('stripe', 'manual', 'store_pickup');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type fulfillment_type as enum ('home_delivery', 'store_pickup');
exception
  when duplicate_object then null;
end $$;

alter table public.orders
  add column if not exists payment_method payment_method default 'stripe'::payment_method not null,
  add column if not exists fulfillment_type fulfillment_type default 'home_delivery'::fulfillment_type not null,
  add column if not exists tracking_token text default encode(gen_random_bytes(16), 'hex');

create unique index if not exists idx_orders_tracking_token
  on public.orders(tracking_token)
  where tracking_token is not null;

alter function public.is_staff() set search_path = public;

drop policy if exists "Users can insert orders" on public.orders;
drop policy if exists "Users can insert order items" on public.order_items;
drop policy if exists "Staff manage brands" on public.brands;
drop policy if exists "Staff manage categories" on public.categories;
drop policy if exists "Staff manage products" on public.products;
drop policy if exists "Staff manage variants" on public.product_variants;
drop policy if exists "Staff manage all orders" on public.orders;

create or replace function public.is_manager_or_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('manager', 'admin')
  );
$$;

create policy "Managers manage brands" on public.brands
  for all using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());

create policy "Managers manage categories" on public.categories
  for all using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());

create policy "Managers manage products" on public.products
  for all using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());

create policy "Managers manage variants" on public.product_variants
  for all using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());

create policy "Staff update orders" on public.orders
  for update using (public.is_staff()) with check (public.is_staff());

create policy "Admins manage profiles" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  ) with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Orders and line items must be created by trusted server code after prices and stock are rechecked.
create or replace function public.create_manual_order(
  p_user_id uuid,
  p_guest_email text,
  p_payment_method payment_method,
  p_fulfillment_type fulfillment_type,
  p_shipping_address jsonb,
  p_items jsonb,
  p_stripe_session_id text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  order_record public.orders;
  item jsonb;
  variant_record public.product_variants;
  calculated_subtotal numeric(10, 2) := 0;
  item_quantity integer;
  item_total numeric(10, 2);
begin
  if p_user_id is not null and p_user_id <> auth.uid() then
    raise exception 'Invalid user';
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    item_quantity := (item->>'quantity')::integer;
    if item_quantity <= 0 then
      raise exception 'Invalid quantity';
    end if;

    select * into variant_record
    from public.product_variants
    where id = (item->>'variant_id')::uuid
    for update;

    if not found or variant_record.stock_quantity < item_quantity then
      raise exception 'Insufficient stock';
    end if;

    item_total := variant_record.price * item_quantity;
    calculated_subtotal := calculated_subtotal + item_total;
  end loop;

  insert into public.orders (
    user_id, guest_email, payment_method, fulfillment_type,
    shipping_address, subtotal, total_amount, stripe_session_id
  ) values (
    p_user_id, p_guest_email, p_payment_method, p_fulfillment_type,
    p_shipping_address, calculated_subtotal, calculated_subtotal, p_stripe_session_id
  ) returning * into order_record;

  for item in select * from jsonb_array_elements(p_items)
  loop
    select * into variant_record
    from public.product_variants
    where id = (item->>'variant_id')::uuid
    for update;

    item_quantity := (item->>'quantity')::integer;
    item_total := variant_record.price * item_quantity;

    update public.product_variants
    set stock_quantity = stock_quantity - item_quantity,
        updated_at = now()
    where id = variant_record.id;

    insert into public.order_items (
      order_id, variant_id, product_name, variant_details,
      quantity, unit_price, total_price
    ) values (
      order_record.id,
      variant_record.id,
      coalesce(item->>'product_name', variant_record.sku),
      jsonb_build_object(
        'sku', variant_record.sku,
        'storage', variant_record.storage,
        'ram', variant_record.ram,
        'color', variant_record.color,
        'condition', variant_record.condition
      ),
      item_quantity,
      variant_record.price,
      item_total
    );
  end loop;

  return order_record;
end;
$$;
