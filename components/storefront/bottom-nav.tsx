'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Layers, User } from 'lucide-react';
import { useCart } from '@/context/cart-context';

export function BottomNav() {
  const pathname = usePathname();
  const { totalCount, setIsOpen } = useCart();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur-lg md:hidden"
    >
      <div className="grid h-16 grid-cols-4 items-center px-2">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 transition ${
            pathname === '/' ? 'text-teal-600' : 'text-slate-500'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="mt-1 text-[11px] font-medium leading-none">Store</span>
        </Link>

        <Link
          href="/#catalog"
          className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-slate-900 transition"
        >
          <Layers className="h-5 w-5" />
          <span className="mt-1 text-[11px] font-medium leading-none">Catalog</span>
        </Link>

        {/* Bottom Bar Cart Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative flex flex-col items-center justify-center py-1 text-slate-500"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                {totalCount}
              </span>
            )}
          </div>
          <span className="mt-1 text-[11px] font-medium leading-none">Cart</span>
        </button>

        <Link
          href="/login"
          className="flex flex-col items-center justify-center py-1 text-slate-500"
        >
          <User className="h-5 w-5" />
          <span className="mt-1 text-[11px] font-medium leading-none">Account</span>
        </Link>
      </div>
    </nav>
  );
}