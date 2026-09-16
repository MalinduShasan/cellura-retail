import { ProductCard } from '@/components/storefront/product-card';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

export default function PhonesPage() {
  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="border-b border-slate-200 pb-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">Catalog</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">All phones</h1><p className="mt-3 max-w-2xl text-slate-600">Compare current flagships, flexible storage, and condition grades in one place.</p></div><div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{MOCK_PRODUCTS.map((product) => <ProductCard key={product.id} product={product} />)}</div></main>;
}
