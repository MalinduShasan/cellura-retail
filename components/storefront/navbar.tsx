'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Smartphone, X } from 'lucide-react';

export function Navbar() {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white transition group-hover:bg-teal-600">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-none">
              Cellura
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium tracking-widest text-teal-600 uppercase">
              Retail
            </span>
          </div>
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search flagship models, storage, or brands..."
              aria-label="Search devices"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Toggle mobile search"
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200"
          >
            {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          {/* Cart Trigger */}
          <Link
            href="/cart"
            aria-label="Shopping cart with 0 items"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-semibold text-white">
              0
            </span>
          </Link>
        </div>
      </div>

      {/* Expandable Mobile Search Field */}
      {mobileSearchOpen && (
        <div className="border-t border-slate-200 bg-white p-3 md:hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              autoFocus
              placeholder="Search models, specs, brands..."
              aria-label="Search devices"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>
        </div>
      )}

      {/* Swipeable Brand Tags Strip */}
      <div className="border-t border-slate-100 bg-slate-50/90 px-4 py-2 text-xs">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
          <span className="shrink-0 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
            Explore:
          </span>
          {['All Devices', 'Apple', 'Samsung', 'Google', 'Refurbished', 'Pre-Owned'].map((tag, idx) => (
            <button
              key={tag}
              type="button"
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                idx === 0
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 active:bg-slate-100'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}