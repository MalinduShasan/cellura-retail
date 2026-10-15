'use client';

import React from 'react';
import Link from 'next/link';
import { useWishlist } from '@/context/wishlist-context';
import { 
  X, 
  Heart, 
  Trash2, 
  ArrowRight, 
  ExternalLink, 
  Smartphone 
} from 'lucide-react';

export function WishlistDrawer() {
  const { 
    items, 
    removeFromWishlist, 
    clearWishlist, 
    isWishlistDrawerOpen, 
    setIsWishlistDrawerOpen 
  } = useWishlist();

  if (!isWishlistDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsWishlistDrawerOpen(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart className="h-4 w-4 fill-rose-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Saved Devices</h2>
                <p className="text-xs text-slate-400">
                  {items.length} {items.length === 1 ? 'phone' : 'phones'} saved in your wishlist
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="text-xs text-slate-400 hover:text-rose-600 transition px-2 py-1"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsWishlistDrawerOpen(false)}
                className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List or Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="h-16 w-16 rounded-full bg-rose-50 text-rose-300 flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Your wishlist is empty</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1 mb-6">
                  Save your favorite smartphones while browsing to compare specs and track prices.
                </p>
                <button
                  type="button"
                  onClick={() => setIsWishlistDrawerOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition"
                >
                  <Smartphone className="h-4 w-4" />
                  Explore Catalog
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item.productId} className="py-4 flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-2xl bg-slate-100 object-cover shrink-0 border border-slate-100"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
                        {item.brand}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </h4>
                      {item.storage && (
                        <p className="text-[11px] text-slate-400">{item.storage}</p>
                      )}
                      <div className="text-xs font-extrabold text-slate-900 mt-1">
                        ${Number(item.price).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.productId)}
                        className="text-slate-300 hover:text-rose-500 transition p-1"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <Link
                        href={`/phones/${item.slug}`}
                        onClick={() => setIsWishlistDrawerOpen(false)}
                        className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 transition"
                      >
                        <span>View</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50">
              <Link
                href="/phones"
                onClick={() => setIsWishlistDrawerOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
