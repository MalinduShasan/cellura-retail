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
  RefreshCw
} from 'lucide-react';

export interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  brandName: string;
  storage: string;
  color: string;
  condition: string;
  price: number;
  stockQuantity: number;
  image?: string;
  updatedAt: string;
}

interface InventoryManagerProps {
  initialItems: InventoryItem[];
  updateStockAction: (variantId: string, newQuantity: number) => Promise<{ success: boolean; error?: string }>;
}

export function InventoryManager({ initialItems, updateStockAction }: InventoryManagerProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();

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

    return matchesSearch && matchesStock && matchesCondition;
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by device, SKU, color..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2 overflow-x-auto">
          {/* Stock Filter Pills */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                stockFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('low')}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                stockFilter === 'low' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Low ({lowStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('out')}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                stockFilter === 'out' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Out ({outOfStockCount})
            </button>
          </div>

          {/* Condition Filter Dropdown */}
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
                <th className="px-6 py-4">Inventory Status</th>
                <th className="px-6 py-4 text-right">Quick Stock Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
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

                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-900">${item.price.toFixed(2)}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
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
                            className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <span className="text-[11px] text-slate-400">units</span>
                        </div>
                      </td>

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
                            Optimal Stock
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item.id, item.stockQuantity, -1)}
                            disabled={isUpdating || item.stockQuantity <= 0}
                            title="Decrement stock (-1)"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 shadow-2xs transition active:scale-95 disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900">
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mx-auto text-teal-600" /> : item.stockQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item.id, item.stockQuantity, 1)}
                            disabled={isUpdating}
                            title="Increment stock (+1)"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-600 hover:text-slate-900 shadow-2xs transition active:scale-95 disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
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
    </div>
  );
}
