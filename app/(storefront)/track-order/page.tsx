'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MOCK_ORDERS } from '@/lib/mock-data';
import type { TrackedOrder } from '@/types/store.types';
import Link from 'next/link';

export default function TrackOrderPage() {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = orderIdInput.trim();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanId) {
      setErrorMessage('Please enter a valid Order ID.');
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    setSearched(true);

    try {
      const supabase = createClient();

      // Attempt Supabase query
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          payment_status,
          created_at,
          tracking_number,
          subtotal,
          total_amount,
          shipping_address,
          order_items (*)
        `)
        .eq('id', cleanId)
        .maybeSingle();

      const dbOrder = data as any;

      if (!error && dbOrder) {
        const mappedOrder: TrackedOrder = {
          id: dbOrder.id,
          email: cleanEmail || 'customer@cellura.com',
          status: dbOrder.status as any,
          payment_status: dbOrder.payment_status as any,
          created_at: dbOrder.created_at,
          tracking_number: dbOrder.tracking_number || undefined,
          carrier: 'FedEx Express 2-Day',
          subtotal: Number(dbOrder.subtotal),
          total_amount: Number(dbOrder.total_amount),
          shipping_address: dbOrder.shipping_address as any,
          items: (dbOrder.order_items || []).map((item: any) => ({
            name: item.product_name,
            variant: item.variant_details?.storage
              ? `${item.variant_details.storage} · ${item.variant_details.color}`
              : 'Smartphone Unit',
            quantity: item.quantity,
            price: Number(item.unit_price),
            image: item.variant_details?.image || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
          })),
        };
        setTrackedOrder(mappedOrder);
        setIsSearching(false);
        return;
      }
    } catch {
      // Fallback to mock data lookup
    }

    // Fallback to mock orders dictionary or fuzzy match
    const mockMatch =
      MOCK_ORDERS[cleanId] ||
      Object.values(MOCK_ORDERS).find(
        (o) => o.id.toLowerCase() === cleanId.toLowerCase()
      );

    if (mockMatch) {
      setTrackedOrder(mockMatch);
    } else {
      setTrackedOrder(null);
      setErrorMessage('No order found with the provided ID. Please verify your Order ID.');
    }

    setIsSearching(false);
  };

  const handleQuickSample = (sampleId: string) => {
    setOrderIdInput(sampleId);
    setEmailInput('customer@cellura.com');
  };

  // Stepper milestones helper
  const milestones = [
    { title: 'Order Placed', desc: 'Order details received' },
    { title: 'Payment Confirmed', desc: 'Verified & authorized' },
    { title: 'Diagnostics & Packaging', desc: '40-Point quality check' },
    { title: 'Dispatched / In Transit', desc: 'Carrier handed over' },
    { title: 'Delivered', desc: 'Package signed & completed' },
  ];

  const getStepIndex = (status: TrackedOrder['status']) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'processing':
        return 3;
      case 'shipped':
        return 4;
      case 'delivered':
        return 5;
      case 'cancelled':
        return 0;
      default:
        return 1;
    }
  };

  const currentStep = trackedOrder ? getStepIndex(trackedOrder.status) : 0;

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-slate-500 mb-2">
          <Link href="/" className="hover:text-teal-600 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Order Tracking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Your Cellura Order Status
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your Order Reference ID and email to view real-time diagnostic, packaging, and shipping milestones.
        </p>
      </div>

      {/* Lookup Card & Quick Samples */}
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="order-id" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Order ID / Reference
              </label>
              <input
                id="order-id"
                type="text"
                placeholder="e.g. ord-1001 or UUID"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div>
              <label htmlFor="email-address" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="email-address"
                type="email"
                placeholder="customer@cellura.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="submit"
              disabled={isSearching}
              className="w-full sm:w-auto min-h-[44px] flex items-center justify-center rounded-xl bg-teal-600 px-8 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-95 disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Track Order Progress'}
            </button>

            {/* Quick Demo Sample Buttons */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold">Try sample IDs:</span>
              <button
                type="button"
                onClick={() => handleQuickSample('ord-1001')}
                className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-slate-700 font-bold hover:bg-slate-200"
              >
                ord-1001
              </button>
              <button
                type="button"
                onClick={() => handleQuickSample('ord-1002')}
                className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-slate-700 font-bold hover:bg-slate-200"
              >
                ord-1002
              </button>
            </div>
          </div>
        </form>

        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
            ⚠️ {errorMessage}
          </div>
        )}
      </div>

      {/* Order Results & Stepper View */}
      {searched && trackedOrder && (
        <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          {/* Order Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-extrabold text-slate-900">
                  Order #{trackedOrder.id}
                </span>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 border border-teal-200">
                  {trackedOrder.status.toUpperCase()}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Placed on {new Date(trackedOrder.created_at).toLocaleDateString('en-US', { dateStyle: 'full' })}
              </p>
            </div>

            {trackedOrder.tracking_number && (
              <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-3 text-right sm:text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Carrier Tracking Number
                </div>
                <div className="text-sm font-black text-slate-900 tracking-wide font-mono">
                  {trackedOrder.tracking_number}
                </div>
                <div className="text-[10px] text-teal-600 font-medium">
                  {trackedOrder.carrier}
                </div>
              </div>
            )}
          </div>

          {/* Visual Status Stepper */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-6">
              Fulfillment & Delivery Milestone Timeline
            </h3>

            {trackedOrder.status === 'cancelled' ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
                <div className="text-lg font-bold">This Order Has Been Cancelled</div>
                <p className="text-xs mt-1">If you have questions regarding a refund, please contact support.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-5 left-[10%] right-[10%] h-1 bg-slate-200 -z-0">
                  <div
                    className="h-full bg-teal-600 transition-all duration-500"
                    style={{
                      width: `${((Math.max(currentStep, 1) - 1) / (milestones.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
                  {milestones.map((m, idx) => {
                    const stepNum = idx + 1;
                    const isCompleted = stepNum <= currentStep;
                    const isCurrent = stepNum === currentStep;

                    return (
                      <div
                        key={idx}
                        className="flex md:flex-col items-center md:text-center gap-4 md:gap-2"
                      >
                        {/* Step Circle Indicator */}
                        <div
                          className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-extrabold text-xs transition ${
                            isCompleted
                              ? 'bg-teal-600 text-white shadow-md ring-4 ring-teal-100'
                              : 'bg-slate-100 border border-slate-300 text-slate-400'
                          }`}
                        >
                          {isCompleted ? '✓' : stepNum}
                        </div>

                        {/* Step Details */}
                        <div>
                          <div
                            className={`text-xs font-bold ${
                              isCurrent
                                ? 'text-teal-700'
                                : isCompleted
                                ? 'text-slate-900'
                                : 'text-slate-400'
                            }`}
                          >
                            {m.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {m.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Order Items List */}
          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
              Items in Package
            </h4>
            <div className="space-y-3">
              {trackedOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-3"
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-200 bg-white"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.variant} (x{item.quantity})
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-sm font-bold text-slate-900">
              <span>Total Amount Paid</span>
              <span className="text-teal-700 font-extrabold">
                ${trackedOrder.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
