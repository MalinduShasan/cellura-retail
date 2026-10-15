'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Building2, 
  Store, 
  ArrowLeft, 
  ShoppingBag,
  Loader2,
  CheckCircle2,
  Tag,
  Sparkles,
  X,
  MapPin,
  Plus,
  Edit2,
  RotateCcw
} from 'lucide-react';

interface SavedAddress {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  postalCode: string;
  country: string;
  email?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bank_transfer' | 'store_pickup'>('stripe');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Promo code engine state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    discountType: string;
    discountValue: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Address engine & Default Address State
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [addressMode, setAddressMode] = useState<'default' | 'new' | 'editing'>('new');
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    postalCode: '',
    country: 'United States',
  });

  useEffect(() => {
    setMounted(true);

    async function loadAddressData() {
      let candidate: SavedAddress | null = null;

      // 1. Check local storage for quick prefill
      try {
        const local = localStorage.getItem('cellura_default_address');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && parsed.address && parsed.city) {
            candidate = parsed;
          }
        }
      } catch {
        // Ignore JSON error
      }

      // 2. Fetch authenticated profile to check if cloud-stored address exists
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.shipping_address && typeof data.profile.shipping_address === 'object') {
            const cloudAddr = data.profile.shipping_address;
            candidate = {
              firstName: cloudAddr.firstName || data.profile.full_name?.split(' ')[0] || candidate?.firstName || '',
              lastName: cloudAddr.lastName || data.profile.full_name?.split(' ').slice(1).join(' ') || candidate?.lastName || '',
              phone: cloudAddr.phone || data.profile.phone || candidate?.phone || '',
              address: cloudAddr.address || candidate?.address || '',
              apartment: cloudAddr.apartment || candidate?.apartment || '',
              city: cloudAddr.city || candidate?.city || '',
              postalCode: cloudAddr.postalCode || candidate?.postalCode || '',
              country: cloudAddr.country || candidate?.country || 'United States',
              email: data.user?.email || candidate?.email || '',
            };
          } else if (data.user?.email) {
            setFormData((prev) => ({
              ...prev,
              email: data.user.email,
              phone: data.profile?.phone || prev.phone,
              firstName: data.profile?.full_name?.split(' ')[0] || prev.firstName,
              lastName: data.profile?.full_name?.split(' ').slice(1).join(' ') || prev.lastName,
            }));
          }
        }
      } catch {
        // Ignore network error
      }

      if (candidate && candidate.address && candidate.city) {
        setSavedAddress(candidate);
        setFormData((prev) => ({
          ...prev,
          email: candidate?.email || prev.email,
          phone: candidate?.phone || prev.phone,
          firstName: candidate?.firstName || prev.firstName,
          lastName: candidate?.lastName || prev.lastName,
          address: candidate?.address || prev.address,
          apartment: candidate?.apartment || '',
          city: candidate?.city || prev.city,
          postalCode: candidate?.postalCode || prev.postalCode,
          country: candidate?.country || prev.country || 'United States',
        }));
        setAddressMode('default');
        setSaveAsDefault(true);
      } else {
        setAddressMode('new');
        setSaveAsDefault(true);
      }
    }

    loadAddressData();
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Handle Empty Cart
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-4">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-500">
          You have no devices in your checkout queue. Select a smartphone to proceed.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Catalog
        </Link>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          subtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.message || 'Invalid coupon code');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: data.code,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          discountValue: data.discountValue,
          message: data.message,
        });
        setCouponInput('');
      }
    } catch {
      setCouponError('Failed to validate promo code.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handleSwitchToNewAddress = () => {
    setAddressMode('new');
    setFormData((prev) => ({
      ...prev,
      firstName: '',
      lastName: '',
      address: '',
      apartment: '',
      city: '',
      postalCode: '',
    }));
    setSaveAsDefault(false);
  };

  const handleSwitchBackToDefault = () => {
    if (savedAddress) {
      setFormData((prev) => ({
        ...prev,
        firstName: savedAddress.firstName || prev.firstName,
        lastName: savedAddress.lastName || prev.lastName,
        phone: savedAddress.phone || prev.phone,
        address: savedAddress.address || prev.address,
        apartment: savedAddress.apartment || '',
        city: savedAddress.city || prev.city,
        postalCode: savedAddress.postalCode || prev.postalCode,
        country: savedAddress.country || prev.country || 'United States',
      }));
      setAddressMode('default');
      setSaveAsDefault(true);
    }
  };

  const handleEditDefaultAddress = () => {
    setAddressMode('editing');
    setSaveAsDefault(true);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          customerEmail: formData.email,
          shippingDetails: {
            ...formData,
            fullName: `${formData.firstName} ${formData.lastName}`.trim(),
          },
          paymentMethod,
          couponCode: appliedCoupon?.code,
          saveAsDefault,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process order. Please try again.');
      }

      // Persist as default address locally for immediate prefill on next visit
      if (saveAsDefault || addressMode === 'default') {
        try {
          const toSave: SavedAddress = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            address: formData.address,
            apartment: formData.apartment,
            city: formData.city,
            postalCode: formData.postalCode,
            country: formData.country,
            email: formData.email,
          };
          localStorage.setItem('cellura_default_address', JSON.stringify(toSave));
        } catch {
          // Ignore storage errors
        }
      }

      // If Stripe payment URL is returned, redirect to Stripe Checkout
      if (paymentMethod === 'stripe' && data.url) {
        window.location.href = data.url;
        return;
      }

      // For Bank Transfer or Store Pickup, clear cart and redirect to success
      clearCart();
      router.push(`/checkout/success?orderId=${data.orderId || 'manual'}&paymentMethod=${paymentMethod}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Checkout
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete your order with certified diagnostics guarantee and express dispatch.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Customer & Shipping & Payment */}
          <div className="lg:col-span-7 space-y-6">
            {/* Contact Information */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
                1. Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Order updates and tracking links will be sent here.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  2. Shipping Address
                </h2>
                {savedAddress && addressMode === 'default' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3 text-teal-600" />
                    Default Shipping Address
                  </span>
                )}
                {savedAddress && addressMode !== 'default' && (
                  <button
                    type="button"
                    onClick={handleSwitchBackToDefault}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Use Default Address
                  </button>
                )}
              </div>

              {/* Mode A: Default Address Card View */}
              {savedAddress && addressMode === 'default' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/60 via-white to-slate-50/50 p-4 sm:p-5 transition hover:border-teal-300">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-1.5 text-xs">
                        <div className="text-sm font-extrabold text-slate-900">
                          {formData.firstName} {formData.lastName}
                        </div>
                        <div className="text-slate-700 font-medium leading-relaxed">
                          {formData.address}
                          {formData.apartment ? `, ${formData.apartment}` : ''}
                        </div>
                        <div className="text-slate-600">
                          {formData.city}, {formData.postalCode} · {formData.country}
                        </div>
                        {formData.phone && (
                          <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1 font-mono">
                            <span>Phone:</span>
                            <span className="font-semibold text-slate-700">{formData.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleEditDefaultAddress}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSwitchToNewAddress}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition shadow-2xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Ship to Another Address</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode B: Form Input View (for New Address or Editing Default) */}
              {(addressMode === 'new' || addressMode === 'editing' || !savedAddress) && (
                <div className="space-y-4">
                  {addressMode === 'new' && savedAddress && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-center justify-between">
                      <span>Entering a new destination for this order.</span>
                      <button
                        type="button"
                        onClick={handleSwitchBackToDefault}
                        className="font-bold underline hover:text-amber-900 ml-2"
                      >
                        Cancel & use default
                      </button>
                    </div>
                  )}

                  {addressMode === 'editing' && (
                    <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-800 flex items-center justify-between">
                      <span>Modifying your default shipping address.</span>
                      <button
                        type="button"
                        onClick={() => setAddressMode('default')}
                        className="font-bold underline hover:text-teal-900 ml-2"
                      >
                        Done
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="123 Retail Boulevard"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Apartment, Suite, Unit (Optional)
                      </label>
                      <input
                        type="text"
                        name="apartment"
                        value={formData.apartment}
                        onChange={handleInputChange}
                        placeholder="Apt 4B"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        required
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Option to set as default address */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveAsDefault}
                        onChange={(e) => setSaveAsDefault(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800">
                          Save as default shipping address
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          Automatically pre-fill this address for your future smartphone purchases.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
                3. Payment Method
              </h2>
              <div className="space-y-3">
                <label
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                    paymentMethod === 'stripe'
                      ? 'border-teal-600 bg-teal-50/30 ring-1 ring-teal-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'stripe'}
                      onChange={() => setPaymentMethod('stripe')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Credit / Debit Card (Stripe Checkout)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Fast, encrypted checkout via Visa, Mastercard, or Apple Pay
                      </div>
                    </div>
                  </div>
                  <CreditCard className="h-5 w-5 text-slate-400" />
                </label>

                <label
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-teal-600 bg-teal-50/30 ring-1 ring-teal-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Direct Bank Transfer
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Transfer directly; device is dispatched once funds settle
                      </div>
                    </div>
                  </div>
                  <Building2 className="h-5 w-5 text-slate-400" />
                </label>

                <label
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                    paymentMethod === 'store_pickup'
                      ? 'border-teal-600 bg-teal-50/30 ring-1 ring-teal-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'store_pickup'}
                      onChange={() => setPaymentMethod('store_pickup')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        In-Store Pickup / Pay on Collection
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Inspect hardware in person and pay at retail counter
                      </div>
                    </div>
                  </div>
                  <Store className="h-5 w-5 text-slate-400" />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
                Order Summary ({items.reduce((sum, item) => sum + item.quantity, 0)})
              </h2>

              {/* Items List */}
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-14 w-14 rounded-xl bg-slate-100 object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {item.storage} · {item.color} · <span className="capitalize">{item.condition}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Box */}
              <div className="border-t border-slate-100 pt-4 mt-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-teal-600" />
                    Promo / Discount Code
                  </span>
                  <span className="text-[10px] text-teal-600 font-normal">
                    Try: <strong>CELLURA10</strong>
                  </span>
                </label>

                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. CELLURA10"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs uppercase font-mono tracking-wider text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
                    >
                      {isApplyingCoupon ? 'Verifying...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold font-mono uppercase">{appliedCoupon.code}</span>
                        <span className="text-[11px] text-emerald-600 block">
                          Saved ${appliedCoupon.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Remove promo code"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="mt-1.5 text-[11px] text-rose-600">{couponError}</p>
                )}
              </div>

              {/* Cost Calculations */}
              {(() => {
                const discount = appliedCoupon?.discountAmount || 0;
                const finalTotal = Math.max(0, subtotal - discount);

                return (
                  <div className="border-t border-slate-100 pt-4 mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span>-${appliedCoupon.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Express Insured Shipping</span>
                      <span className="font-semibold text-teal-600">FREE</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Estimated Tax</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-100 pt-3">
                      <span>Total</span>
                      <div className="text-right">
                        <span>${finalTotal.toFixed(2)}</span>
                        {appliedCoupon && (
                          <span className="block text-[10px] text-slate-400 line-through font-normal">
                            ${subtotal.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 px-4 text-sm font-bold text-white shadow-xs transition hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Securing Order...
                  </>
                ) : paymentMethod === 'stripe' ? (
                  'Proceed to Stripe Payment'
                ) : (
                  'Place Order'
                )}
              </button>

              {/* Guarantees */}
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>1-Year Cellura Retail operational hardware warranty</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Dispatched via tracked priority express courier</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>14-day zero-friction return & exchange window</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}