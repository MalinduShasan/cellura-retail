-- Migration: Create coupons table for promotional discount codes
-- File: supabase/migrations/20260104000000_coupons_table.sql

create table if not exists public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  min_spend numeric(10, 2) default 0 check (min_spend >= 0),
  description text,
  is_active boolean default true not null,
  expires_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for performance
create index if not exists idx_coupons_code on public.coupons(code);
create index if not exists idx_coupons_active on public.coupons(is_active);

-- Enable Row Level Security
alter table public.coupons enable row level security;

-- Policies: Staff can read and write; Public can read active coupons
create policy "Staff can manage coupons" on public.coupons
  for all using (public.is_staff());

create policy "Public can view active coupons" on public.coupons
  for select using (is_active = true);
