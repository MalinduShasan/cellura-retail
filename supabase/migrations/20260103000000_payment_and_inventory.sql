-- ==============================================================================
-- Migration: Add bank_transfer to payment_method enum and atomic stock procedures
-- ==============================================================================

-- 1. Add bank_transfer to payment_method enum if not exists
do $$
begin
  alter type payment_method add value if not exists 'bank_transfer';
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- 2. Atomic Stock Decrement Procedure with Row Locking
create or replace function public.decrement_stock(
  p_variant_id uuid,
  p_quantity integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_stock integer;
begin
  if p_quantity <= 0 then
    return false;
  end if;

  select stock_quantity into v_current_stock
  from public.product_variants
  where id = p_variant_id
  for update;

  if not found or v_current_stock < p_quantity then
    return false;
  end if;

  update public.product_variants
  set stock_quantity = stock_quantity - p_quantity,
      updated_at = now()
  where id = p_variant_id;

  return true;
end;
$$;

-- 3. Atomic Stock Restore Procedure (for order cancellations and returns)
create or replace function public.restore_stock(
  p_variant_id uuid,
  p_quantity integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_quantity <= 0 then
    return;
  end if;

  update public.product_variants
  set stock_quantity = stock_quantity + p_quantity,
      updated_at = now()
  where id = p_variant_id;
end;
$$;
