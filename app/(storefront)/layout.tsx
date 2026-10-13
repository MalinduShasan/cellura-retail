import { Suspense } from 'react';
import { Navbar } from '@/components/storefront/navbar';
import { BottomNav } from '@/components/storefront/bottom-nav';
import { CartProvider } from '@/context/cart-context';
import { CartDrawer } from '@/components/storefront/cart-drawer';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col pb-20 md:pb-0">
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
          <Navbar />
        </Suspense>
        <div className="flex-1">{children}</div>
        <BottomNav />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}