'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import type { ProductWithVariants, ProductVariant } from '@/types/store.types';
import Link from 'next/link';

interface ProductViewProps {
  product: ProductWithVariants;
}

export function ProductView({ product }: ProductViewProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const initialVariant = product.variants[0] || {
    id: '',
    sku: '',
    storage: '128GB',
    ram: null,
    color: 'Standard',
    condition: 'new' as const,
    price: 0,
    compare_at_price: null,
    stock_quantity: 0,
    images: [],
  };

  // Decoupled independent state variables for each dimension
  const [selectedStorage, setSelectedStorage] = useState<string>(initialVariant.storage);
  const [selectedColor, setSelectedColor] = useState<string>(initialVariant.color);
  const [selectedCondition, setSelectedCondition] = useState<string>(initialVariant.condition);

  // Resolve current active variant based on independent state variables
  const activeVariant: ProductVariant =
    product.variants.find(
      (v) =>
        v.storage === selectedStorage &&
        v.color === selectedColor &&
        v.condition === selectedCondition
    ) || initialVariant;

  const allImages = Array.from(
    new Set([
      ...(activeVariant.images || []),
      ...product.variants.flatMap((v) => v.images || []),
    ])
  );

  const [selectedImage, setSelectedImage] = useState<string>(
    activeVariant.images[0] || allImages[0] || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'
  );

  // Available unique attribute option lists
  const availableStorages = Array.from(
    new Set(product.variants.map((v) => v.storage))
  );
  const availableColors = Array.from(
    new Set(product.variants.map((v) => v.color))
  );
  const availableConditions = Array.from(
    new Set(product.variants.map((v) => v.condition))
  );

  // Smart Variant Resolvers with priority fallbacks
  const handleSelectStorage = (newStorage: string) => {
    // 1. Exact match: (newStorage, selectedColor, selectedCondition)
    let resolved = product.variants.find(
      (v) =>
        v.storage === newStorage &&
        v.color === selectedColor &&
        v.condition === selectedCondition
    );

    // Fallback 1: Match (newStorage, selectedColor, any condition) -> preserves color
    if (!resolved) {
      resolved = product.variants.find(
        (v) => v.storage === newStorage && v.color === selectedColor
      );
    }

    // Fallback 2: Match (newStorage, any color, selectedCondition) -> preserves condition
    if (!resolved) {
      resolved = product.variants.find(
        (v) => v.storage === newStorage && v.condition === selectedCondition
      );
    }

    // Fallback 3: First variant with newStorage
    if (!resolved) {
      resolved = product.variants.find((v) => v.storage === newStorage);
    }

    if (resolved) {
      setSelectedStorage(resolved.storage);
      setSelectedColor(resolved.color);
      setSelectedCondition(resolved.condition);
      if (resolved.images?.[0]) {
        setSelectedImage(resolved.images[0]);
      }
    }
  };

  const handleSelectColor = (newColor: string) => {
    // 1. Exact match: (selectedStorage, newColor, selectedCondition)
    let resolved = product.variants.find(
      (v) =>
        v.storage === selectedStorage &&
        v.color === newColor &&
        v.condition === selectedCondition
    );

    // Fallback 1: Match (selectedStorage, newColor, any condition) -> preserves storage
    if (!resolved) {
      resolved = product.variants.find(
        (v) => v.storage === selectedStorage && v.color === newColor
      );
    }

    // Fallback 2: Match (any storage, newColor, selectedCondition) -> preserves condition
    if (!resolved) {
      resolved = product.variants.find(
        (v) => v.color === newColor && v.condition === selectedCondition
      );
    }

    // Fallback 3: First variant with newColor
    if (!resolved) {
      resolved = product.variants.find((v) => v.color === newColor);
    }

    if (resolved) {
      setSelectedStorage(resolved.storage);
      setSelectedColor(resolved.color);
      setSelectedCondition(resolved.condition);
      if (resolved.images?.[0]) {
        setSelectedImage(resolved.images[0]);
      }
    }
  };

  const handleSelectCondition = (newCondition: string) => {
    // 1. Exact match: (selectedStorage, selectedColor, newCondition)
    let resolved = product.variants.find(
      (v) =>
        v.storage === selectedStorage &&
        v.color === selectedColor &&
        v.condition === newCondition
    );

    // Fallback 1: Match (selectedStorage, any color, newCondition) -> preserves storage
    if (!resolved) {
      resolved = product.variants.find(
        (v) => v.storage === selectedStorage && v.condition === newCondition
      );
    }

    // Fallback 2: Match (any storage, selectedColor, newCondition) -> preserves color
    if (!resolved) {
      resolved = product.variants.find(
        (v) => v.color === selectedColor && v.condition === newCondition
      );
    }

    // Fallback 3: First variant with newCondition
    if (!resolved) {
      resolved = product.variants.find((v) => v.condition === newCondition);
    }

    if (resolved) {
      setSelectedStorage(resolved.storage);
      setSelectedColor(resolved.color);
      setSelectedCondition(resolved.condition);
      if (resolved.images?.[0]) {
        setSelectedImage(resolved.images[0]);
      }
    }
  };

  const isOutOfStock = activeVariant.stock_quantity <= 0;

  const handleAddToCart = () => {
    addItem({
      variantId: activeVariant.id,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      storage: activeVariant.storage,
      color: activeVariant.color,
      condition: activeVariant.condition,
      price: activeVariant.price,
      image: selectedImage,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  const conditionExplanations: Record<string, string> = {
    new: 'Factory sealed in original box with full 1-Year manufacturer warranty.',
    refurbished: 'Certified Grade A refurbishment. 40-point diagnostic inspection passed with 1-Year Cellura Guarantee.',
    'pre-owned': 'Thoroughly tested and cleaned pre-owned device with 85%+ verified battery health.',
  };

  const specs = product.specs || {
    display: 'Super Retina XDR OLED Display (120Hz ProMotion)',
    processor: 'High-Performance Flagship Mobile Processor',
    camera: 'Multi-Lens Professional Camera Array with 4K Video',
    battery: 'Guaranteed 85%+ Battery Health & Fast Charge Support',
  };

  const discountAmount =
    activeVariant.compare_at_price && activeVariant.compare_at_price > activeVariant.price
      ? activeVariant.compare_at_price - activeVariant.price
      : 0;

  return (
    <div className="space-y-12">
      {/* Top Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-teal-600 transition">
          Home
        </Link>
        <span>/</span>
        <Link href="/phones" className="hover:text-teal-600 transition">
          Smartphones
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Main Product Layout: Gallery + Purchasing Dock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Visual Canvas */}
          <div className="relative aspect-4/3 sm:aspect-square w-full rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt={`${product.name} - ${activeVariant.color}`}
              className="h-full w-full object-cover object-center transition duration-300"
            />

            {/* Condition Tag Overlay */}
            <div className="absolute top-4 left-4">
              <span className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-700 shadow-2xs">
                {activeVariant.condition}
              </span>
            </div>

            {/* Discount Badge Overlay */}
            {discountAmount > 0 && (
              <div className="absolute top-4 right-4">
                <span className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                  Save ${discountAmount.toFixed(0)}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery Strip */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative h-20 w-20 shrink-0 rounded-2xl border bg-white overflow-hidden transition active:scale-95 ${
                    selectedImage === img
                      ? 'border-2 border-teal-600 ring-2 ring-teal-100 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Configurator & Purchasing Dock (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-teal-600">
              {product.brand}
            </div>
            <h1 className="mt-1 text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {product.name}
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Price Header */}
          <div className="flex items-baseline gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">
              ${activeVariant.price.toFixed(2)}
            </span>
            {activeVariant.compare_at_price && (
              <span className="text-sm font-semibold text-slate-400 line-through">
                ${activeVariant.compare_at_price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Storage Selectors */}
          <div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              <span>Storage Configuration</span>
              <span className="text-teal-600 font-semibold">{selectedStorage}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {availableStorages.map((storage) => {
                const isSelected = selectedStorage === storage;

                // Check if exact combination exists
                const hasExactCombo = product.variants.some(
                  (v) =>
                    v.storage === storage &&
                    v.color === selectedColor &&
                    v.condition === selectedCondition
                );

                return (
                  <button
                    key={storage}
                    type="button"
                    onClick={() => handleSelectStorage(storage)}
                    className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-bold transition active:scale-95 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : hasExactCombo
                        ? 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        : 'border-slate-200/80 bg-slate-50/60 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span>{storage}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              <span>Color Finish</span>
              <span className="text-teal-600 font-semibold">{selectedColor}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {availableColors.map((color) => {
                const isSelected = selectedColor === color;

                const hasExactCombo = product.variants.some(
                  (v) =>
                    v.storage === selectedStorage &&
                    v.color === color &&
                    v.condition === selectedCondition
                );

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleSelectColor(color)}
                    className={`min-h-[44px] shrink-0 rounded-xl border px-4 py-2 text-xs font-bold transition active:scale-95 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : hasExactCombo
                        ? 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        : 'border-slate-200/80 bg-slate-50/60 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition Tabs */}
          <div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              <span>Hardware Condition Grade</span>
              <span className="text-teal-600 font-semibold uppercase">{selectedCondition}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {availableConditions.map((cond) => {
                const isSelected = selectedCondition === cond;
                const labels: Record<string, string> = {
                  new: 'Brand New',
                  refurbished: 'Refurbished',
                  'pre-owned': 'Pre-Owned',
                };

                const hasExactCombo = product.variants.some(
                  (v) =>
                    v.storage === selectedStorage &&
                    v.color === selectedColor &&
                    v.condition === cond
                );

                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => handleSelectCondition(cond)}
                    className={`min-h-[44px] flex items-center justify-center rounded-xl border px-2 text-xs font-bold transition active:scale-95 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-2xs'
                        : hasExactCombo
                        ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        : 'border-slate-200/80 bg-slate-50/60 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {labels[cond] || cond}
                  </button>
                );
              })}
            </div>
            <p className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600 leading-relaxed border border-slate-200/60">
              💡 {conditionExplanations[selectedCondition] || conditionExplanations.new}
            </p>
          </div>

          {/* Stock Inventory Status */}
          <div className="flex items-center gap-2 pt-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                activeVariant.stock_quantity > 5
                  ? 'bg-emerald-500 animate-pulse'
                  : activeVariant.stock_quantity > 0
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-bold text-slate-700">
              {activeVariant.stock_quantity > 5
                ? `In Stock (${activeVariant.stock_quantity} units ready to ship)`
                : activeVariant.stock_quantity > 0
                ? `Only ${activeVariant.stock_quantity} left in stock — Order soon!`
                : 'Currently Out of Stock'}
            </span>
          </div>

          {/* Action Dock (Buttons) */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="min-h-[48px] flex-1 flex items-center justify-center rounded-2xl bg-teal-600 px-6 text-sm font-bold text-white shadow-md transition hover:bg-teal-700 active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Add to Cart
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="min-h-[48px] flex-1 flex items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Buy Now Express
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-6 text-center">
            <div className="p-2">
              <div className="text-lg">🛡️</div>
              <div className="mt-1 text-[11px] font-bold text-slate-900">1-Year Warranty</div>
              <div className="text-[10px] text-slate-500">Full Coverage</div>
            </div>
            <div className="p-2">
              <div className="text-lg">⚡</div>
              <div className="mt-1 text-[11px] font-bold text-slate-900">40-Point Inspection</div>
              <div className="text-[10px] text-slate-500">Diagnostic Passed</div>
            </div>
            <div className="p-2">
              <div className="text-lg">🚚</div>
              <div className="mt-1 text-[11px] font-bold text-slate-900">Free Shipping</div>
              <div className="text-[10px] text-slate-500">Express Delivery</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Spec Sheet & Diagnostic Inspection Matrix */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
          <span>📱</span> Hardware Specifications & Diagnostic Matrix
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Display
            </div>
            <div className="text-sm font-bold text-slate-900">{specs.display}</div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Processor / Chipset
            </div>
            <div className="text-sm font-bold text-slate-900">{specs.processor}</div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Camera System
            </div>
            <div className="text-sm font-bold text-slate-900">{specs.camera}</div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Battery Health Guarantee
            </div>
            <div className="text-sm font-bold text-slate-900">{specs.battery}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
