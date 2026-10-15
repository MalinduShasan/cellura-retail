import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { 
  User, 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ShoppingBag, 
  ArrowRight, 
  MapPin, 
  Building2, 
  Store, 
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Smartphone,
  FileText
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Account & Order History | Cellura Retail',
  description: 'View your purchased devices, fulfillment status, tracking numbers, and warranty certificates.',
};

export default async function CustomerAccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?next=/account');
  }

  // Fetch profile
  const { data: profile } = await (supabaseAdmin.from('profiles') as any)
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Fetch user's orders (linked by user_id OR user's email)
  const { data: ordersData, error } = await (supabaseAdmin.from('orders') as any)
    .select(`
      id,
      guest_email,
      status,
      payment_status,
      payment_method,
      fulfillment_type,
      total_amount,
      tracking_number,
      shipping_address,
      created_at,
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        total_price,
        variant_details
      )
    `)
    .or(`user_id.eq.${user.id},guest_email.eq.${user.email}`)
    .order('created_at', { ascending: false });

  const orders = (ordersData as any[]) || [];

  const totalSpent = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const activeShipments = orders.filter((o) => o.status === 'processing' || o.status === 'dispatched').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Delivered
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
            <Truck className="h-3 w-3" /> In Transit / Dispatched
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" /> Packaging & Diagnostics
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
            <Clock className="h-3 w-3" /> Placed / Pending
          </span>
        );
    }
  };

  const getPaymentBadge = (method: string, status: string) => {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 capitalize">
          {method === 'store_pickup' && <Store className="h-3.5 w-3.5 text-teal-600" />}
          {method === 'bank_transfer' && <Building2 className="h-3.5 w-3.5 text-blue-600" />}
          {method === 'stripe' && <CreditCard className="h-3.5 w-3.5 text-emerald-600" />}
          {method ? method.replace('_', ' ') : 'Card'}
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider rounded-md px-1.5 py-0.5 ${
            status === 'paid'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : status === 'refunded'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {status}
        </span>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Breadcrumbs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
          <Link href="/" className="hover:text-teal-600 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Customer Account</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {profile?.full_name || user.email?.split('@')[0]}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Manage your orders, shipment tracking, hardware warranty coverage, and account profile.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/phones"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Browse Catalog</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Profile Card & Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white font-black text-lg">
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 text-sm truncate">
                  {profile?.full_name || 'Customer'}
                </div>
                <div className="text-[11px] text-slate-400 truncate font-mono">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account Type</span>
                <span className="font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md text-[10px]">
                  {profile?.role || 'Customer'}
                </span>
              </div>
              {profile?.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Phone</span>
                  <span className="font-medium text-slate-800">{profile.phone}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Member Since</span>
                <span className="font-medium text-slate-800">
                  {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Purchases Summary
            </h2>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-lg font-black text-slate-900">{orders.length}</div>
                <div className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase">Orders</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-lg font-black text-teal-600">{activeShipments}</div>
                <div className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase">In Transit</div>
              </div>
            </div>
            <div className="rounded-2xl bg-emerald-50/60 p-3.5 border border-emerald-100 text-center">
              <div className="text-xs font-bold text-emerald-800">Total Cleared Volume</div>
              <div className="text-xl font-black text-emerald-900 mt-0.5">${totalSpent.toFixed(2)}</div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs text-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>1-Year Hardware Protection</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every device purchased through Cellura Retail is backed by a 40-point diagnostics certificate and free warranty service.
            </p>
          </div>
        </div>

        {/* Right Column: Order History List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Order History</h2>
                <p className="text-xs text-slate-500">Track shipments, courier updates, and device invoices</p>
              </div>
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                {orders.length} {orders.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                  <Package className="h-8 w-8 text-slate-400 opacity-60" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Orders Placed Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                  You haven&apos;t placed any smartphone orders under this account. Explore certified devices with 1-Year warranty.
                </p>
                <Link
                  href="/phones"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition"
                >
                  <span>Explore Phones</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {orders.map((order) => {
                  const shipping = order.shipping_address || {};

                  return (
                    <div key={order.id} className="py-6 first:pt-4 space-y-4">
                      {/* Top Bar: Order ID, Date, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              Order #{order.id.slice(0, 8)}...
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Placed on {new Date(order.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div>{getPaymentBadge(order.payment_method, order.payment_status)}</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusBadge(order.status)}
                          <Link
                            href={`/account/invoice/${order.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                          >
                            <FileText className="h-3 w-3 text-teal-600" />
                            <span>Invoice & Warranty</span>
                          </Link>
                          <Link
                            href={`/track-order?orderId=${order.id}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                          >
                            <span>Live Tracker</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </Link>
                        </div>
                      </div>

                      {/* Items Purchased */}
                      <div className="space-y-3 px-2">
                        {order.order_items?.map((item: any) => {
                          const imei = item.variant_details?.imei;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-4 text-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                                  <Smartphone className="h-5 w-5 text-slate-400" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">
                                    {item.product_name}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {item.variant_details?.storage} · {item.variant_details?.color} · {item.variant_details?.condition || 'new'}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {imei ? (
                                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                        IMEI: {imei}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic">
                                        IMEI: Pending Dispatch Scan
                                      </span>
                                    )}
                                    {imei && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                        <ShieldCheck className="h-2.5 w-2.5" /> 1-Yr Warranty Active
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="font-extrabold text-slate-900">
                                  ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Qty: {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Footer: Courier Tracking & Total */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 px-2 text-xs">
                        <div>
                          {order.tracking_number ? (
                            <div className="flex items-center gap-2 text-teal-700 font-bold">
                              <Truck className="h-4 w-4" />
                              <span>Tracking Number: </span>
                              <span className="font-mono bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                                {order.tracking_number}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400">
                              {order.fulfillment_type === 'store_pickup'
                                ? 'Pickup at Flagship Store: 100 Tech Promenade, Suite 400'
                                : 'Courier tracking will be updated once diagnostics are finalized.'}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          {Number(shipping.discountAmount || 0) > 0 && (
                            <div className="text-[11px] text-emerald-600 font-medium">
                              Saved ${Number(shipping.discountAmount).toFixed(2)} with {shipping.couponCode || 'Promo'}
                            </div>
                          )}
                          <div className="flex items-center gap-2 sm:justify-end text-sm">
                            <span className="text-slate-500 font-medium">Order Total:</span>
                            <span className="text-base font-black text-slate-900">
                              ${Number(order.total_amount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
