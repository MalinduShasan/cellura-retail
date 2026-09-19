'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface CatalogFiltersProps {
  currentBrand?: string;
  currentCondition?: string;
  currentSort?: string;
  brands: string[];
}

export function CatalogFilters({
  currentBrand,
  currentCondition,
  currentSort = 'newest',
  brands,
}: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === '' || value === 'all') {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string | null) => {
    const query = createQueryString(name, value);
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleReset = () => {
    router.push(pathname, { scroll: false });
  };

  const hasActiveFilters = Boolean(currentBrand || currentCondition || (currentSort && currentSort !== 'newest'));

  const conditions = [
    { label: 'All Conditions', value: 'all' },
    { label: 'Brand New', value: 'new' },
    { label: 'Refurbished', value: 'refurbished' },
    { label: 'Pre-Owned', value: 'pre-owned' },
  ];

  const sortOptions = [
    { label: 'Newest Arrivals', value: 'newest' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      {/* Brand Filters */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          Brand
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => handleFilterChange('brand', null)}
            className={`min-h-[44px] shrink-0 rounded-xl px-4 text-xs font-bold transition active:scale-95 ${
              !currentBrand || currentBrand.toLowerCase() === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
            }`}
          >
            All Brands
          </button>
          {brands.map((b) => {
            const isSelected = currentBrand?.toLowerCase() === b.toLowerCase();
            return (
              <button
                key={b}
                type="button"
                onClick={() => handleFilterChange('brand', isSelected ? null : b.toLowerCase())}
                className={`min-h-[44px] shrink-0 rounded-xl px-4 text-xs font-bold transition active:scale-95 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      {/* Condition & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-3">
        {/* Condition Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">
            Condition:
          </span>
          {conditions.map((c) => {
            const isSelected =
              (!currentCondition && c.value === 'all') ||
              currentCondition?.toLowerCase() === c.value.toLowerCase();
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => handleFilterChange('condition', c.value === 'all' ? null : c.value)}
                className={`min-h-[44px] sm:min-h-[36px] rounded-lg px-3 text-xs font-semibold transition active:scale-95 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Sort Selector & Reset */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
              Sort:
            </label>
            <select
              id="sort-select"
              value={currentSort || 'newest'}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="min-h-[44px] sm:min-h-[36px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] sm:min-h-[36px] text-xs font-bold text-teal-600 hover:text-teal-700 underline underline-offset-2 px-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

