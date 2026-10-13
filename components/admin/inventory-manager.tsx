'use client';

import { useState, useTransition } from 'react';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Minus, 
  Layers, 
  DollarSign, 
  Loader2,
  RefreshCw,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  X,
  Smartphone,
  Save,
  Check
} from 'lucide-react';
import { ImageUploader } from './image-uploader';

export interface InventoryItem {
  id: string; // variant id
  productId: string;
  sku: string;
  productName: string;
  brandName: string;
  storage: string;
  ram?: string | null;
  color: string;
  condition: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  image?: string;
  isActive: boolean;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  brandName: string;
  sku: string;
  storage: string;
  color: string;
  condition: 'new' | 'refurbished' | 'pre-owned';
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  imageUrl?: string;
  description?: string;
}

export interface UpdateVariantPayload {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  storage: string;
  color: string;
  condition: 'new' | 'refurbished' | 'pre-owned';
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
}

interface InventoryManagerProps {
  initialItems: InventoryItem[];
  updateStockAction: (variantId: string, newQuantity: number) => Promise<{ success: boolean; error?: string }>;
  createProductAction: (payload: CreateProductPayload) => Promise<{ success: boolean; error?: string; item?: InventoryItem }>;
  updateVariantAction: (payload: UpdateVariantPayload) => Promise<{ success: boolean; error?: string; item?: InventoryItem }>;
  toggleProductActiveAction: (productId: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  deleteVariantAction: (variantId: string, productId: string) => Promise<{ success: boolean; error?: string; message?: string }>;
}

export function InventoryManager({ 
  initialItems, 
  updateStockAction,
  createProductAction,
  updateVariantAction,
  toggleProductActiveAction,
  deleteVariantAction
}: InventoryManagerProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  // New Product Form State
  const [newForm, setNewForm] = useState<CreateProductPayload>({
    name: '',
    brandName: 'Apple',
    sku: '',
    storage: '256GB',
    color: 'Space Black',
    condition: 'new',
    price: 999,
    compareAtPrice: 1099,
    stockQuantity: 10,
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    description: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState<UpdateVariantPayload | null>(null);

  // Metrics
  const totalUnits = items.reduce((acc, item) => acc + item.stockQuantity, 0);
  const totalValue = items.reduce((acc, item) => acc + item.price * item.stockQuantity, 0);
  const lowStockCount = items.filter((item) => item.stockQuantity > 0 && item.stockQuantity <= 5).length;
  const outOfStockCount = items.filter((item) => item.stockQuantity === 0).length;

  // Filtered List
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brandName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low'
        ? item.stockQuantity > 0 && item.stockQuantity <= 5
        : item.stockQuantity === 0;

    const matchesCondition =
      conditionFilter === 'all'
        ? true
        : item.condition.toLowerCase() === conditionFilter.toLowerCase();

    const matchesVisibility =
      visibilityFilter === 'all'
        ? true
        : visibilityFilter === 'active'
        ? item.isActive
        : !item.isActive;

    return matchesSearch && matchesStock && matchesCondition && matchesVisibility;
  });

  const handleAdjustStock = (variantId: string, currentStock: number, delta: number) => {
    const targetStock = Math.max(0, currentStock + delta);
    setUpdatingId(variantId);
    setStatusMessage(null);

    startTransition(async () => {
      const res = await updateStockAction(variantId, targetStock);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === variantId ? { ...i, stockQuantity: targetStock, updatedAt: new Date().toISOString() } : i
          )
        );
        setStatusMessage({ text: 'Stock level updated successfully.', type: 'success' });
      } else {
        setStatusMessage({ text: res.error || 'Failed to update stock.', type: 'error' });
      }
      setUpdatingId(null);
    });
  };

  const handleDirectStockChange = (variantId: string, value: string) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) return;

    setUpdatingId(variantId);
    setStatusMessage(null);

    startTransition(async () => {
      const res = await updateStockAction(variantId, parsed);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === variantId ? { ...i, stockQuantity: parsed, updatedAt: new Date().toISOString() } : i
          )
        );
        setStatusMessage({ text: 'Stock level updated successfully.', type: 'success' });
      } else {
        setStatusMessage({ text: res.error || 'Failed to update stock.', type: 'error' });
      }
      setUpdatingId(null);
    });
  };

  const handleToggleVisibility = (item: InventoryItem) => {
    const targetActive = !item.isActive;
    setUpdatingId(item.id);
    setStatusMessage(null);

    startTransition(async () => {
      const res = await toggleProductActiveAction(item.productId, targetActive);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.productId === item.productId ? { ...i, isActive: targetActive } : i
          )
        );
        setStatusMessage({
          text: targetActive ? 'Product activated and visible in storefront.' : 'Product deactivated (soft-deleted from storefront).',
          type: 'success'
        });
      } else {
        setStatusMessage({ text: res.error || 'Failed to update visibility.', type: 'error' });
      }
      setUpdatingId(null);
    });
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      const res = await createProductAction(newForm);
      if (res.success && res.item) {
        setItems((prev) => [res.item!, ...prev]);
        setIsAddModalOpen(false);
        setStatusMessage({ text: `Successfully created ${newForm.name} (${newForm.sku}).`, type: 'success' });
        // Reset form
        setNewForm({
          name: '',
          brandName: 'Apple',
          sku: '',
          storage: '256GB',
          color: 'Space Black',
          condition: 'new',
          price: 999,
          compareAtPrice: 1099,
          stockQuantity: 10,
          imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
          description: '',
        });
      } else {
        setStatusMessage({ text: res.error || 'Failed to create product.', type: 'error' });
      }
    });
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setEditForm({
      variantId: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      storage: item.storage,
      color: item.color,
      condition: item.condition as any,
      price: item.price,
      compareAtPrice: item.compareAtPrice,
      stockQuantity: item.stockQuantity,
      imageUrl: item.image,
      isActive: item.isActive,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    setStatusMessage(null);

    startTransition(async () => {
      const res = await updateVariantAction(editForm);
      if (res.success && res.item) {
        setItems((prev) =>
          prev.map((i) => (i.id === editForm.variantId ? res.item! : i))
        );
        setEditingItem(null);
        setEditForm(null);
        setStatusMessage({ text: `Updated ${editForm.productName} successfully.`, type: 'success' });
      } else {
        setStatusMessage({ text: res.error || 'Failed to update product details.', type: 'error' });
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    setStatusMessage(null);

    startTransition(async () => {
      const res = await deleteVariantAction(deletingItem.id, deletingItem.productId);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
        setStatusMessage({ text: res.message || 'Variant removed successfully.', type: 'success' });
      } else {
        setStatusMessage({ text: res.error || 'Failed to remove variant.', type: 'error' });
      }
      setDeletingItem(null);
    });
  };

  const getConditionBadge = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'refurbished':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pre-owned':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Units</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">{totalUnits}</div>
          <p className="mt-0.5 text-xs text-slate-400">Across {items.length} active variants</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Catalog Valuation</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Inventory retail value</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Low Stock Alert</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 tracking-tight">{lowStockCount}</div>
          <p className="mt-0.5 text-xs text-slate-400">5 or fewer units remaining</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Out of Stock</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 tracking-tight">{outOfStockCount}</div>
          <p className="mt-0.5 text-xs text-slate-400">Requires restocking</p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`rounded-xl p-3 text-xs font-medium flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter, Search Bar & Add Product Trigger */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by device, SKU, color..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stock Filter Pills */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                stockFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('low')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                stockFilter === 'low' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Low ({lowStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('out')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                stockFilter === 'out' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Out ({outOfStockCount})
            </button>
          </div>

          {/* Condition Filter */}
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Conditions</option>
            <option value="new">Brand New</option>
            <option value="refurbished">Refurbished</option>
            <option value="pre-owned">Pre-Owned</option>
          </select>

          {/* Visibility Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Visibility</option>
            <option value="active">Active in Store</option>
            <option value="hidden">Hidden / Draft</option>
          </select>

          {/* Add Product Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition active:scale-95 ml-auto"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Device</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 text-[11px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Hardware SKU & Device</th>
                <th className="px-6 py-4">Grade & Specs</th>
                <th className="px-6 py-4">Unit Price</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Store Visibility</th>
                <th className="px-6 py-4">Stock Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Layers className="mx-auto h-8 w-8 mb-2 opacity-40" />
                    No smartphone variants matched your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isUpdating = updatingId === item.id && isPending;
                  const isLow = item.stockQuantity > 0 && item.stockQuantity <= 5;
                  const isOut = item.stockQuantity === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      {/* Device & SKU */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.image}
                              alt={item.productName}
                              className="h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200 bg-white"
                            />
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{item.productName}</div>
                            <div className="font-mono text-[11px] text-teal-600 font-semibold">{item.sku}</div>
                          </div>
                        </div>
                      </td>

                      {/* Specs */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getConditionBadge(
                              item.condition
                            )}`}
                          >
                            {item.condition}
                          </span>
                          <div className="text-slate-500 text-[11px]">
                            {item.storage} · {item.color}
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-extrabold text-slate-900">${item.price.toFixed(2)}</span>
                          {item.compareAtPrice && (
                            <span className="text-[11px] text-slate-400 line-through ml-1.5">
                              ${item.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock Stepper */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(item.id, item.stockQuantity, -1)}
                              disabled={isUpdating || item.stockQuantity <= 0}
                              title="Decrement stock (-1)"
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 shadow-2xs transition active:scale-95 disabled:opacity-40"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              defaultValue={item.stockQuantity}
                              key={item.stockQuantity}
                              onBlur={(e) => {
                                if (parseInt(e.target.value, 10) !== item.stockQuantity) {
                                handleDirectStockChange(item.id, e.target.value);
                              }
                            }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              disabled={isUpdating}
                              className="w-12 text-center text-xs font-bold text-slate-900 bg-transparent focus:bg-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(item.id, item.stockQuantity, 1)}
                              disabled={isUpdating}
                              title="Increment stock (+1)"
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 shadow-2xs transition active:scale-95 disabled:opacity-40"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Store Visibility / Soft Delete Toggle */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(item)}
                          title={item.isActive ? "Click to soft-delete/hide from store" : "Click to reactivate in store"}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border transition ${
                            item.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                          }`}
                        >
                          {item.isActive ? (
                            <>
                              <Eye className="h-3 w-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              <span>Hidden (Soft Del)</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="px-6 py-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Low ({item.stockQuantity} left)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Optimal
                          </span>
                        )}
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Product & Variant Details"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50/50 transition"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            title="Delete or Archive Variant"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD PRODUCT MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Smartphone</h3>
                  <p className="text-xs text-slate-500">Add model, hardware variant, pricing and inventory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 16 Pro Max"
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="Apple, Samsung, Google..."
                    value={newForm.brandName}
                    onChange={(e) => setNewForm({ ...newForm, brandName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hardware SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IP16PM-256-NAT-NEW"
                    value={newForm.sku}
                    onChange={(e) => setNewForm({ ...newForm, sku: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Storage</label>
                  <input
                    type="text"
                    required
                    placeholder="128GB, 256GB, 512GB, 1TB"
                    value={newForm.storage}
                    onChange={(e) => setNewForm({ ...newForm, storage: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Color Finish</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Natural Titanium"
                    value={newForm.color}
                    onChange={(e) => setNewForm({ ...newForm, color: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Condition Grade</label>
                  <select
                    value={newForm.condition}
                    onChange={(e) => setNewForm({ ...newForm, condition: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="new">Brand New</option>
                    <option value="refurbished">Refurbished</option>
                    <option value="pre-owned">Pre-Owned</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newForm.stockQuantity}
                    onChange={(e) => setNewForm({ ...newForm, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newForm.price}
                    onChange={(e) => setNewForm({ ...newForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Compare-At Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional original MSRP"
                    value={newForm.compareAtPrice || ''}
                    onChange={(e) => setNewForm({ ...newForm, compareAtPrice: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="col-span-2">
                  <ImageUploader
                    value={newForm.imageUrl || ''}
                    onChange={(url) => setNewForm({ ...newForm, imageUrl: url })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save & Publish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT MODAL */}
      {/* ========================================================================= */}
      {editingItem && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Product Variant</h3>
                  <p className="text-xs text-slate-500">Update hardware details, pricing, and stock</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={editForm.productName}
                    onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hardware SKU</label>
                  <input
                    type="text"
                    required
                    value={editForm.sku}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Condition Grade</label>
                  <select
                    value={editForm.condition}
                    onChange={(e) => setEditForm({ ...editForm, condition: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="new">Brand New</option>
                    <option value="refurbished">Refurbished</option>
                    <option value="pre-owned">Pre-Owned</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Storage</label>
                  <input
                    type="text"
                    required
                    value={editForm.storage}
                    onChange={(e) => setEditForm({ ...editForm, storage: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Color</label>
                  <input
                    type="text"
                    required
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Compare-At Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.compareAtPrice || ''}
                    onChange={(e) => setEditForm({ ...editForm, compareAtPrice: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.stockQuantity}
                    onChange={(e) => setEditForm({ ...editForm, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Store Visibility</label>
                  <select
                    value={editForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="true">Active (Visible in Storefront)</option>
                    <option value="false">Hidden (Draft / Soft Deleted)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <ImageUploader
                    value={editForm.imageUrl || ''}
                    onChange={(url) => setEditForm({ ...editForm, imageUrl: url })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Remove Variant?</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-slate-800">{deletingItem.productName} ({deletingItem.sku})</span>?
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              * If this variant is linked to past customer orders, it will be safely deactivated (soft-deleted with 0 stock) to preserve receipt integrity.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>Confirm Removal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
