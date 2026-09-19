import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { 
  ArrowLeft, 
  MapPin, 
  Mail, 
  Calendar, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function updateOrderStatus(formData: FormData) {
  'use server';

  const orderId = formData.get('orderId') as string;
  const status = formData.get('status') as string;
  const paymentStatus = formData.get('paymentStatus') as string;
  const trackingNumber = formData.get('trackingNumber') as string;

  if (!orderId) return;

  const updatePayload: Record<string, any> = {
    status,
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };

  if (trackingNumber !== undefined && trackingNumber !== null) {
    updatePayload.tracking_number = trackingNumber.trim() || null;
  }

  await (supabaseAdmin.from('orders') as any)
    .update(updatePayload)
    .eq('id', orderId);

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
  revalidatePath(`/track-order`);
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: order, error } = await (supabaseAdmin.from('orders') as any)
    .select(`
      *,
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        total_price,
        variant_details
      )
    `)
    .eq('id', id)
    .single();

  if (error || !order) {
    notFound();
  }

  const shipping = order.shipping_address || {};

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <span className="font-mono text-xs text-slate-400">UUID: {order.id}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items & Customer Address */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4">Purchased Items</h2>
            <div className="divide-y divide-slate-100">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{item.product_name}</h3>
                    <p className="text-xs text-slate-500">
                      {item.variant_details?.storage} · {item.variant_details?.color} · {item.variant_details?.condition}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Qty: {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900 text-sm">
                    ${Number(item.total_price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Total Amount</span>
              <span className="text-base text-teal-600">${Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              Delivery & Contact Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <p className="font-bold text-slate-800">{shipping.fullName || 'Recipient'}</p>
                <p>{shipping.address}</p>
                {shipping.apartment && <p>Apt/Suite: {shipping.apartment}</p>}
                <p>{shipping.city}, {shipping.postalCode}</p>
                <p>{shipping.country}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{order.guest_email || shipping.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Placed: {new Date(order.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Fulfillment Status Controls */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4">Manage Fulfillment</h2>

            <form action={updateOrderStatus} className="space-y-4 text-xs">
              <input type="hidden" name="orderId" value={order.id} />

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Order Status</label>
                <select
                  name="status"
                  defaultValue={order.status}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Payment Status</label>
                <select
                  name="paymentStatus"
                  defaultValue={order.payment_status}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Courier Tracking #</label>
                <input
                  type="text"
                  name="trackingNumber"
                  defaultValue={order.tracking_number || ''}
                  placeholder="e.g. FEDEX-89382173"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}