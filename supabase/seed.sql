-- Seed catalog data from lib/mock-data.ts.
-- Run after migrations with: supabase db reset

insert into public.brands (name, slug)
values
  ('Apple', 'apple'),
  ('Samsung', 'samsung'),
  ('Google', 'google')
on conflict (slug) do nothing;

insert into public.categories (name, slug, description)
values ('Smartphones', 'smartphones', 'New, refurbished, and pre-owned smartphones.')
on conflict (slug) do nothing;

insert into public.products (brand_id, category_id, name, slug, description, featured)
select brands.id, categories.id, seed.name, seed.slug, seed.description, seed.featured
from (values
  ('Apple', 'iPhone 16 Pro Max', 'iphone-16-pro-max', 'Grade 5 titanium design with the A18 Pro chip and 48MP Fusion camera system.', true),
  ('Samsung', 'Galaxy S25 Ultra', 'galaxy-s25-ultra', 'Galaxy AI integration, Snapdragon 8 Elite, and built-in S-Pen productivity.', true),
  ('Google', 'Pixel 9 Pro', 'pixel-9-pro', 'Tensor G4 processor with advanced Gemini Nano multi-modal photography features.', false)
) as seed(brand_name, name, slug, description, featured)
join public.brands on brands.name = seed.brand_name
join public.categories on categories.slug = 'smartphones'
on conflict (slug) do nothing;

insert into public.product_variants (
  product_id, sku, storage, ram, color, condition, price, compare_at_price, stock_quantity, images
)
select products.id, seed.sku, seed.storage, seed.ram, seed.color, seed.condition::device_condition,
  seed.price, seed.compare_at_price, seed.stock_quantity, array[seed.image]
from (values
  ('iphone-16-pro-max', 'IP16PM-256-NAT-NEW', '256GB', '8GB', 'Natural Titanium', 'new', 1199.00, 1299.00, 14, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'),
  ('iphone-16-pro-max', 'IP16PM-512-BLK-REF', '512GB', '8GB', 'Black Titanium', 'refurbished', 1049.00, 1399.00, 5, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'),
  ('galaxy-s25-ultra', 'S25U-512-TIT-NEW', '512GB', '12GB', 'Titanium Gray', 'new', 1299.99, 1419.99, 8, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80'),
  ('galaxy-s25-ultra', 'S25U-256-BLK-PO', '256GB', '12GB', 'Phantom Black', 'pre-owned', 899.00, 1199.00, 3, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80'),
  ('pixel-9-pro', 'PX9P-128-POR-NEW', '128GB', '16GB', 'Porcelain', 'new', 999.00, 1099.00, 12, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80'),
  ('pixel-9-pro', 'PX9P-256-OBS-REF', '256GB', '16GB', 'Obsidian', 'refurbished', 799.00, 999.00, 6, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80')
) as seed(slug, sku, storage, ram, color, condition, price, compare_at_price, stock_quantity, image)
join public.products on products.slug = seed.slug
on conflict (sku) do nothing;
