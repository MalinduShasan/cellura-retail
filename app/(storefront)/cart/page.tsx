import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-teal-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Shopping Cart</h1>
            <p className="text-xs text-slate-500">Review selected hardware variants before checkout.</p>
          </div>
        </div>

        {/* Empty State Display */}
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-slate-600">Your cart is currently empty.</p>
          <p className="mt-1 text-xs text-slate-400">
            Browse our smartphone catalog and add devices to configure an order.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-block rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Explore Devices
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}