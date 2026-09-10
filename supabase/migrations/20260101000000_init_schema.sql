-- ==============================================================================
-- 1. EXTENSIONS & ENUMS
-- ==============================================================================
create extension if not exists "uuid-ossp";

-- User access roles
create type user_role as enum ('customer', 'staff', 'manager', 'admin');

-- Device hardware conditions
create type device_condition as enum ('new', 'refurbished', 'pre-owned');

-- Order and fulfillment lifecycle
create type order_status as enum ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
create type payment_status as enum ('unpaid', 'paid', 'refunded', 'failed');

-- ==============================================================================
-- 2. USER PROFILES (Synchronized with Supabase Auth)
-- ==============================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  role user_role default 'customer'::user_role not null,
  shipping_address jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Trigger: Automatically create a public profile when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- 3. BRANDS & CATEGORIES
-- ==============================================================================
create table public.brands (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  slug text not null unique,
  logo_url text,
  created_at timestamptz default now() not null
);

create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz default now() not null
);

-- ==============================================================================
-- 4. PRODUCTS & HARDWARE VARIANTS
-- ==============================================================================
create table public.products (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  featured boolean default false not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  sku text not null unique,
  storage text not null, -- e.g., '128GB', '256GB', '512GB', '1TB'
  ram text,              -- e.g., '8GB', '12GB', '16GB'
  color text not null,   -- e.g., 'Space Black', 'Titanium Natural'
  condition device_condition default 'new'::device_condition not null,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price >= price),
  stock_quantity integer default 0 not null check (stock_quantity >= 0),
  images text[] default '{}'::text[] not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ==============================================================================
-- 5. ORDERS & LINE ITEMS
-- ==============================================================================
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  guest_email text,
  status order_status default 'pending'::order_status not null,
  payment_status payment_status default 'unpaid'::payment_status not null,
  currency text default 'usd' not null,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  shipping_address jsonb not null,
  stripe_session_id text unique,
  stripe_payment_intent_id text unique,
  tracking_number text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_details jsonb not null, -- Snapshot of sku, color, storage, condition
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  total_price numeric(10, 2) not null check (total_price >= 0)
);

-- ==============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ==============================================================================
create index idx_products_brand on public.products(brand_id);
create index idx_products_category on public.products(category_id);
create index idx_products_slug on public.products(slug);
create index idx_variants_product on public.product_variants(product_id);
create index idx_variants_sku on public.product_variants(sku);
create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(status);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Helper function: Check if user is staff or admin
create or replace function public.is_staff()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('staff', 'manager', 'admin')
  );
end;
$$ language plpgsql security definer;

-- Profiles: Users manage their own; staff reads all
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id or public.is_staff());

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Public Catalog: Anyone can read active products and variants
create policy "Allow public read-only for brands" on public.brands
  for select using (true);

create policy "Allow public read-only for categories" on public.categories
  for select using (true);

create policy "Allow public read-only for active products" on public.products
  for select using (is_active = true or public.is_staff());

create policy "Allow public read-only for variants" on public.product_variants
  for select using (true);

-- Staff Management: Staff can insert/update/delete catalog items
create policy "Staff manage brands" on public.brands
  for all using (public.is_staff());

create policy "Staff manage categories" on public.categories
  for all using (public.is_staff());

create policy "Staff manage products" on public.products
  for all using (public.is_staff());

create policy "Staff manage variants" on public.product_variants
  for all using (public.is_staff());

-- Orders: Users can read their own; staff can view and manage all
create policy "Users can view their own orders" on public.orders
  for select using (auth.uid() = user_id or public.is_staff());

create policy "Users can insert orders" on public.orders
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "Staff manage all orders" on public.orders
  for all using (public.is_staff());

create policy "Users view their own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or public.is_staff())
    )
  );

create policy "Users can insert order items" on public.order_items
  for insert with check (true);