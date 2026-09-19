import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Store, 
  Building2, 
  CreditCard,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface OrderRow {
  id: string;
  guest_email: string | null;
  status: 'pending' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  total_amount: number;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    variant_details: any;
  }[];
}

async function getAdminOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      guest_email,
      status,
      payment_status,
      payment_method,
      total_amount,
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to query orders for admin:', error);
    return [];
  }

  return (data as unknown as OrderRow[]) || [];
}

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Delivered
          </span>
        );
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            <Truck className="h-3 w-3" /> Dispatched
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <RefreshCw className="h-3 w-3 animate-spin" /> Processing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  const getPaymentBadge = (method: string, status: string) => {
    return (
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700 capitalize">
          {method === 'store_pickup' && <Store className="h-3.5 w-3.5 text-teal-600" />}
          {method === 'bank_transfer' && <Building2 className="h-3.5 w-3.5 text-blue-600" />}
          {method === 'stripe' && <CreditCard className="h-3.5 w-3.5 text-emerald-600" />}
          {method ? method.replace('_', ' ') : 'Manual'}
        </span>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
          {status}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Fulfillment</h1>
          <p className="text-sm text-slate-500">Manage device dispatches, counter pickups, and payments.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs">
          Total Orders: <span className="text-teal-600">{orders.length}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Order ID & Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Devices</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Fulfillment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    No orders registered yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-bold text-slate-900">
                        {order.id.slice(0, 8)}...
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-slate-900">
                        {order.guest_email || 'Guest Customer'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="text-xs font-medium text-slate-800">
                            {item.quantity}x {item.product_name}
                            <span className="text-[11px] text-slate-400 ml-1">
                              ({item.variant_details?.storage} · {item.variant_details?.color})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">
                        ${Number(order.total_amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getPaymentBadge(order.payment_method, order.payment_status)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                      >
                        Details
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}