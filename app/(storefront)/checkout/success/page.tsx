'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { 
  CheckCircle2, 
  Store, 
  Building2, 
  CreditCard, 
  ArrowRight, 
  ShoppingBag, 
  MapPin, 
  Clock 
} from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const clearedRef = useRef(false);

  const orderId = searchParams.get('orderId') || searchParams.get('order_id') || 'ord-pending';
  const paymentMethod = searchParams.get('paymentMethod') || (searchParams.get('session_id') ? 'stripe' : 'store_pickup');

  useEffect(() => {
    if (!clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            Order Confirmed & Secured
          </span>

          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Thank You for Your Order!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Order Reference ID: <span className="font-mono font-semibold text-slate-700">{orderId}</span>
          </p>

          <div className="mt-8 text-left">
            {paymentMethod === 'store_pickup' && (
              <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 space-y-4">
                <div className="flex items-center gap-2.5 text-teal-900 font-bold text-sm">
                  <Store className="h-5 w-5 text-teal-600" />
                  In-Store Pickup & Inspection
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your device is reserved and undergoing its 40-point diagnostics review. You can inspect the physical hardware, test battery diagnostics at our counter, and settle payment upon pickup.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-teal-100">
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">Flagship Retail Store:</span>
                      <p className="text-[11px] text-slate-500">100 Tech Promenade, Suite 400</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600">
                    <Clock className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">Pickup Window:</span>
                      <p className="text-[11px] text-slate-500">Mon–Sat: 10:00 AM – 7:00 PM</p>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  * Please present your Order Reference ID and a valid government ID at the counter.
                </p>
              </div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
                <div className="flex items-center gap-2.5 text-blue-900 font-bold text-sm">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Direct Wire Transfer Instructions
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your hardware has been reserved. Please initiate the bank transfer using the details below. Devices are dispatched within 24 hours of funds clearing.
                </p>
                <div className="bg-white rounded-xl p-3.5 border border-blue-100 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Bank:</span>
                    <span className="font-bold text-slate-800">Silicon Commercial Bank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Account Name:</span>
                    <span className="font-bold text-slate-800">Cellura Retail Inc.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Account / IBAN:</span>
                    <span className="font-bold text-slate-800">US12 9876 5432 1098 7654</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Reference:</span>
                    <span className="font-bold text-teal-700">{orderId}</span>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'stripe' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-sm">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  Stripe Card Payment Confirmed
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your transaction has been authorized and cleared. Our diagnostics team is preparing your hardware inspection certificate and packaging your shipment.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/track-order?orderId=${orderId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-teal-700"
            >
              Track Order Status
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ShoppingBag className="h-4 w-4 text-slate-400" />
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}