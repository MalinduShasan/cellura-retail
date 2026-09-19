'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  RefreshCw,
  Loader2
} from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration flash before localStorage loads
  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const conditionColors: Record<string, string> = {
    new: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    refurbished: 'bg-blue-50 text-blue-700 border-blue-200',
    'pre-owned': 'bg-amber-50 text-amber-700 border-amber-200',
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-slate-50/50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Your shopping cart is empty
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Browse our smartphone catalog and add certified flagship devices or verified refurbished models to your bag.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-teal-700 active:scale-98 shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              Explore Devices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Catalog
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Shopping Cart
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{totalItemCount} {totalItemCount === 1 ? 'device' : 'devices'} selected</span>
            <span>·</span>
            <button
              type="button"
              onClick={clearCart}
              className="font-medium text-rose-600 hover:text-rose-700 transition"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.variantId} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  {/* Product Image */}
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-xl bg-slate-100 overflow-hidden border border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  {/* Device Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
                        {item.brand}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.2 text-[10px] font-semibold uppercase tracking-wide capitalize ${
                          conditionColors[item.condition] || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.condition}
                      </span>
                    </div>

                    <h3 className="mt-1 text-base font-bold text-slate-900 truncate">
                      {item.name}
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Config: <span className="font-semibold text-slate-700">{item.storage}</span> · Color: <span className="font-semibold text-slate-700">{item.color}</span>
                    </p>

                    <div className="mt-3 text-sm font-bold text-slate-900 sm:hidden">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  {/* Quantity Stepper & Price */}
                  <div className="flex sm:flex-col sm:items-end justify-between items-center gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="hidden sm:block text-base font-extrabold text-slate-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 shadow-2xs transition active:scale-95"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 shadow-2xs transition active:scale-95"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shopping Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs font-semibold text-slate-700 shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
                <span>1-Year Hardware Warranty</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs font-semibold text-slate-700 shadow-2xs">
                <Truck className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Tracked Express Shipping</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3.5 text-xs font-semibold text-slate-700 shadow-2xs">
                <RefreshCw className="h-4 w-4 text-teal-600 shrink-0" />
                <span>14-Day Free Returns</span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
                Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Express Courier</span>
                  <span className="font-semibold text-teal-600">FREE</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Diagnostics Certification</span>
                  <span className="font-semibold text-teal-600">INCLUDED</span>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between text-base font-extrabold text-slate-900">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 px-4 text-sm font-bold text-white shadow-xs transition hover:bg-teal-700 active:scale-98"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="mt-3 text-center text-[11px] text-slate-400">
                Taxes calculated during checkout. Supports guest checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}