import type { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cellura.lk';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/phones`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  let productSlugs: { slug: string; created_at?: string }[] = [];

  try {
    const { data, error } = await (supabaseAdmin.from('products') as any)
      .select('slug, created_at')
      .eq('is_active', true);

    if (!error && data && data.length > 0) {
      productSlugs = data as any;
    } else {
      productSlugs = MOCK_PRODUCTS.map((p) => ({ slug: p.slug, created_at: p.created_at }));
    }
  } catch {
    productSlugs = MOCK_PRODUCTS.map((p) => ({ slug: p.slug, created_at: p.created_at }));
  }

  const productRoutes: MetadataRoute.Sitemap = productSlugs.map((p) => ({
    url: `${baseUrl}/phones/${p.slug}`,
    lastModified: p.created_at ? new Date(p.created_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
