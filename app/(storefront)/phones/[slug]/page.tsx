import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/storefront/product-card';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

export default async function PhoneDetailPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const product = MOCK_PRODUCTS.find((item) => item.slug === slug);
	if (!product) notFound();
	return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">{product.brand}</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">{product.name}</h1><p className="mt-4 text-slate-600">{product.description}</p></div><div className="mt-10 max-w-xl"><ProductCard product={product} /></div></main>;
}
