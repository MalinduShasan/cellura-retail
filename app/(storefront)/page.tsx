import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, Wrench } from 'lucide-react';
import { ProductCard } from '@/components/storefront/product-card';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/server';
import type { ProductWithVariants } from '@/types/store.types';

interface LiveProductRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  featured: boolean;
  created_at: string;
  brand: { name: string } | { name: string }[] | null;
  variants: ProductWithVariants['variants'];
}

async function getCatalogProducts(): Promise<ProductWithVariants[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, brand:brands(name), variants:product_variants(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[storefront] Catalog query failed; using mock products.', error.message);
      return MOCK_PRODUCTS;
    }

    const products = ((data || []) as unknown as LiveProductRow[])
      .map((product) => ({
        id: product.id,
        name: product.name,
        brand: Array.isArray(product.brand) ? product.brand[0]?.name || 'Cellura' : product.brand?.name || 'Cellura',
        slug: product.slug,
        description: product.description,
        featured: product.featured,
        created_at: product.created_at,
        variants: product.variants || [],
      }))
      .filter((product) => product.variants.length > 0);

    if (products.length === 0) {
      console.warn('[storefront] Catalog is empty; using mock products.');
      return MOCK_PRODUCTS;
    }

    return products;
  } catch (error) {
    console.warn(
      '[storefront] Catalog is unavailable; using mock products.',
      error instanceof Error ? error.message : error,
    );
    return MOCK_PRODUCTS;
  }
}

export default async function StorefrontHomePage() {
  const products = await getCatalogProducts();
  const featuredProduct = products[0];
  const featuredImage = featuredProduct?.variants[0]?.images[0] || '/placeholder-phone.svg';

  return (
    <main>
      <section className="border-b border-slate-200 bg-[#102a2b] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">Curated devices. Clear choices.</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">Your next phone, properly chosen.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-teal-50/75">Shop verified new, refurbished, and pre-owned smartphones with transparent condition grades and hardware variants.</p>
            <Link href="#catalog" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-[#102a2b] transition hover:bg-teal-300">Browse the collection <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={featuredImage} alt={featuredProduct?.name || 'Featured phone'} className="aspect-[4/3] w-full object-cover" />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-[#102a2b]/90 p-4 backdrop-blur-sm"><p className="text-xs font-semibold uppercase tracking-widest text-teal-300">Featured now</p><p className="mt-1 text-lg font-bold">iPhone 16 Pro Max</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-3 border-b border-slate-200 pb-8 sm:grid-cols-3">
          {[['Verified stock', ShieldCheck], ['Fast delivery', Truck], ['Grade transparency', Wrench]].map(([label, Icon]) => {
            const FeatureIcon = Icon as typeof ShieldCheck;
            return <div key={label as string} className="flex items-center gap-3 rounded-xl bg-white py-3 text-sm font-semibold text-slate-700"><FeatureIcon className="h-5 w-5 text-teal-600" />{label as string}</div>;
          })}
        </div>
        <div id="catalog" className="flex items-end justify-between gap-4 py-10"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">The collection</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Find your fit</h2></div><Link href="/phones" className="hidden items-center gap-1 text-sm font-bold text-teal-700 sm:flex">View all <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>
    </main>
  );
}