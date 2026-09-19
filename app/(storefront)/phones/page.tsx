import { createClient } from '@/lib/supabase/server';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { CatalogFilters } from '@/components/storefront/catalog-filters';
import { ProductCard } from '@/components/storefront/product-card';
import type { ProductWithVariants } from '@/types/store.types';
import Link from 'next/link';

interface PhonesPageProps {
  searchParams: Promise<{
    brand?: string;
    condition?: string;
    sort?: string;
  }>;
}

export const metadata = {
  title: 'Smartphones & Flagship Devices | Cellura Retail',
  description: 'Browse new, certified refurbished, and pre-owned smartphones with multi-point diagnostic guarantees.',
};

export default async function PhonesPage({ searchParams }: PhonesPageProps) {
  const { brand, condition, sort } = await searchParams;

  let products: ProductWithVariants[] = [];
  let brands: string[] = ['Apple', 'Samsung', 'Google'];

  try {
    const supabase = await createClient();

    // Query brands
    const { data: brandData } = await supabase.from('brands').select('name');
    if (brandData && brandData.length > 0) {
      brands = (brandData as any[]).map((b) => b.name);
    }

    // Query active products with joined variants and brand
    const { data: dbProductsData, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        featured,
        created_at,
        brand:brands(name),
        variants:product_variants(*)
      `)
      .eq('is_active', true);

    const dbProducts = dbProductsData as any[];

    if (!error && dbProducts && dbProducts.length > 0) {
      products = dbProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand?.name || 'Device',
        slug: p.slug,
        description: p.description,
        featured: p.featured,
        created_at: p.created_at,
        variants: (p.variants || []).map((v: any) => ({
          id: v.id,
          sku: v.sku,
          storage: v.storage,
          ram: v.ram,
          color: v.color,
          condition: v.condition,
          price: Number(v.price),
          compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
          stock_quantity: v.stock_quantity,
          images: v.images && v.images.length > 0 ? v.images : ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'],
        })),
      }));
    }
  } catch {
    // Fallback gracefully on query error
  }

  // Fallback to MOCK_PRODUCTS if database is empty/unseeded
  if (products.length === 0) {
    products = MOCK_PRODUCTS;
  }

  // Filter by Brand
  if (brand && brand.toLowerCase() !== 'all') {
    products = products.filter(
      (p) => p.brand.toLowerCase() === brand.toLowerCase()
    );
  }

  // Filter by Condition
  if (condition && condition.toLowerCase() !== 'all') {
    products = products
      .map((p) => {
        const matchingVariants = p.variants.filter(
          (v) => v.condition.toLowerCase() === condition.toLowerCase()
        );
        if (matchingVariants.length === 0) return null;
        return {
          ...p,
          variants: matchingVariants,
        };
      })
      .filter((p): p is ProductWithVariants => p !== null);
  }

  // Sort Products
  const sortKey = sort || 'newest';
  products = [...products].sort((a, b) => {
    const minPriceA = Math.min(...a.variants.map((v) => v.price));
    const minPriceB = Math.min(...b.variants.map((v) => v.price));

    if (sortKey === 'price-asc') {
      return minPriceA - minPriceB;
    }
    if (sortKey === 'price-desc') {
      return minPriceB - minPriceA;
    }
    // Default: newest
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
          <Link href="/" className="hover:text-teal-600 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Smartphones</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Flagship Smartphones & Certified Devices
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Compare specifications, storage options, and verified hardware conditions with 1-Year Warranty protection.
        </p>
      </div>

      {/* Filter Component */}
      <div className="mb-8">
        <CatalogFilters
          currentBrand={brand}
          currentCondition={condition}
          currentSort={sort}
          brands={brands}
        />
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-4">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No Matching Smartphone Catalog Found
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            We couldn't find any devices matching your selected brand, condition, or sort criteria.
          </p>
          <div className="mt-6">
            <Link
              href="/phones"
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-95"
            >
              Reset All Filters
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
