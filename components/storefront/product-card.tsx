'use client';

import { useState } from 'react';
import { MockProduct } from '@/lib/mock-data';

interface ProductCardProps {
  product: MockProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const activeVariant = product.variants[selectedVariantIndex];

  const conditionColors: Record<string, string> = {
    new: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    refurbished: 'bg-blue-50 text-blue-700 border-blue-200',
    'pre-owned': 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition hover:shadow-md hover:border-slate-300">
      {/* Visual Canvas */}
      <div className="relative aspect-4/3 sm:aspect-16/10 w-full bg-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeVariant.image}
          alt={`${product.name} in ${activeVariant.color}`}
          className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <span
            className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide capitalize shadow-2xs ${
              conditionColors[activeVariant.condition]
            }`}
          >
            {activeVariant.condition}
          </span>
        </div>
      </div>

      {/* Product Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
          {product.brand}
        </div>
        <h3 className="mt-1 text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-600 transition">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Swipeable Variant Chips */}
        <div className="mt-4">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Config:</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {product.variants.map((variant, idx) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariantIndex(idx)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition active:scale-95 ${
                  selectedVariantIndex === idx
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                {variant.storage} · {variant.color}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing & Add-To-Cart Footer */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
              ${activeVariant.price.toFixed(2)}
            </span>
            {activeVariant.compareAtPrice && (
              <span className="ml-2 text-xs font-medium text-slate-400 line-through">
                ${activeVariant.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          <button
            type="button"
            className="w-full sm:w-auto h-11 sm:h-9 flex items-center justify-center rounded-xl bg-teal-600 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-98"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}