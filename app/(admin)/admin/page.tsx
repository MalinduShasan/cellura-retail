import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import { 
  Package, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  Store,
  Truck
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Query orders
  const { data: ordersData } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      guest_email,
      status,
      payment_status,
      payment_method,
      total_amount,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  // Query low stock items
  const { data: variantsData } = await supabaseAdmin
    .from('product_variants')
    .select('id, stock_quantity')
    .lte('stock_quantity', 5);

  const orders = (ordersData as any[]) || [];
  const lowStockCount = variantsData?.length || 0;
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing');
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Operations Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Live overview of smartphone dispatches, counter pickups, and warehouse alerts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Fulfillment</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">{pendingOrders.length}</div>
          <p className="mt-0.5 text-xs text-slate-400">Awaiting packaging or courier</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Low Stock SKUs</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 tracking-tight">{lowStockCount}</div>
          <p className="mt-0.5 text-xs text-slate-400">Variants below 5 units</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cleared Volume</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            ${totalRevenue.toFixed(2)}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Total processed revenue</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recent Registrations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">{orders.length}</div>
          <p className="mt-0.5 text-xs text-slate-400">Recorded orders</p>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/orders"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-teal-500 hover:shadow-sm transition group"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Orders & Dispatches</h2>
              <p className="text-xs text-slate-500 mt-0.5">Process shipments, verify wire payments, update tracking.</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          href="/admin/inventory"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-teal-500 hover:shadow-sm transition group"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Stock & Inventory</h2>
              <p className="text-xs text-slate-500 mt-0.5">Quick stock level increments, variant SKUs, valuation stats.</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
        </Link>
      </div>

      {/* Recent Orders Overview */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Customer Orders</h2>
            <p className="text-xs text-slate-500">Latest checkouts requiring fulfillment attention</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 transition"
          >
            View all →
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {orders.length === 0 ? (
            <div className="py-8 text-center text-slate-400">No orders registered yet.</div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50 transition">
                <div className="space-y-0.5">
                  <div className="font-mono font-bold text-slate-900">{o.id.slice(0, 8)}...</div>
                  <div className="text-[11px] text-slate-400">{o.guest_email || 'Guest Customer'}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-slate-900">${Number(o.total_amount).toFixed(2)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      o.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700'
                        : o.status === 'processing'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {o.status}
                  </span>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-700 font-semibold hover:bg-slate-50 transition"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
