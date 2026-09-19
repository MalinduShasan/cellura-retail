import { createClient } from '@/lib/supabase/server';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { ProductView } from '@/components/storefront/product-view';
import { notFound } from 'next/navigation';
import type { ProductWithVariants } from '@/types/store.types';
import type { Metadata } from 'next';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
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
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    const p = data as any;

    if (!error && p) {
      return {
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
      };
    }
  } catch {
    // Fallback gracefully on query error
  }

  // Fallback to MOCK_PRODUCTS
  const mockMatch = MOCK_PRODUCTS.find((p) => p.slug === slug);
  return mockMatch || null;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Device Not Found | Cellura Retail',
      description: 'The requested smartphone catalog item could not be found.',
    };
  }

  const primaryVariant = product.variants[0];
  const primaryImage = primaryVariant?.images[0] || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80';

  return {
    title: `${product.name} (${primaryVariant?.storage || 'Unlocked'}) | Cellura Retail`,
    description: product.description || `Buy the ${product.name} with 1-Year Warranty & fast shipping.`,
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: [
        {
          url: primaryImage,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <ProductView product={product} />
    </main>
  );
}
