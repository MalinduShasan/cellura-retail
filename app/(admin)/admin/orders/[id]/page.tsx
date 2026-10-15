import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireStaffOrAdmin } from '@/lib/supabase/auth';
import { restoreStock, decrementStock } from '@/lib/supabase/inventory';
import { 
  ArrowLeft, 
  MapPin, 
  Mail, 
  Calendar, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Clock,
  Smartphone,
  ShieldCheck,
  FileText
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function updateOrderStatus(formData: FormData) {
  'use server';

  await requireStaffOrAdmin();

  const orderId = formData.get('orderId') as string;
  const status = formData.get('status') as string;
  const paymentStatus = formData.get('paymentStatus') as string;
  const trackingNumber = formData.get('trackingNumber') as string;

  if (!orderId) return;

  // Check previous order status to release stock if transitioning to cancelled
  const { data: currentOrder } = await (supabaseAdmin.from('orders') as any)
    .select('status, order_items ( variant_id, quantity )')
    .eq('id', orderId)
    .single();

  const wasCancelled = currentOrder?.status === 'cancelled';
  const isNowCancelled = status === 'cancelled';

  if (!wasCancelled && isNowCancelled && currentOrder?.order_items) {
    for (const item of currentOrder.order_items) {
      if (item.variant_id && item.quantity > 0) {
        await restoreStock(item.variant_id, item.quantity);
      }
    }
  } else if (wasCancelled && !isNowCancelled && currentOrder?.order_items) {
    for (const item of currentOrder.order_items) {
      if (item.variant_id && item.quantity > 0) {
        await decrementStock(item.variant_id, item.quantity);
      }
    }
  }

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

async function updateItemImei(formData: FormData) {
  'use server';

  await requireStaffOrAdmin();

  const orderId = formData.get('orderId') as string;
  const itemId = formData.get('itemId') as string;
  const imei = ((formData.get('imei') as string) || '').trim();

  if (!orderId || !itemId) return;

  const { data: item } = await (supabaseAdmin.from('order_items') as any)
    .select('variant_details')
    .eq('id', itemId)
    .single();

  if (item) {
    const updatedDetails = {
      ...(typeof item.variant_details === 'object' && item.variant_details !== null
        ? item.variant_details
        : {}),
      imei: imei || null,
    };

    await (supabaseAdmin.from('order_items') as any)
      .update({ variant_details: updatedDetails })
      .eq('id', itemId);

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/account');
    revalidatePath(`/account/invoice/${orderId}`);
  }
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
        <div className="flex items-center gap-2">
          <Link
            href={`/account/invoice/${order.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <FileText className="h-3.5 w-3.5 text-teal-600" />
            Print Official Invoice
          </Link>
          <span className="font-mono text-xs text-slate-400">UUID: {order.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items & Customer Address */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4">Purchased Items</h2>
            <div className="divide-y divide-slate-100">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
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

                  {/* Device IMEI Assignment Form for Staff */}
                  <form action={updateItemImei} className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <Smartphone className="h-3.5 w-3.5 text-teal-600" />
                      <span>Device IMEI / SN:</span>
                    </div>
                    <input
                      type="text"
                      name="imei"
                      defaultValue={item.variant_details?.imei || ''}
                      placeholder="e.g. 354892091234567"
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 w-44"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700 transition"
                    >
                      {item.variant_details?.imei ? 'Update IMEI' : 'Assign IMEI'}
                    </button>
                    {item.variant_details?.imei && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ShieldCheck className="h-3 w-3" /> Warranty Active
                      </span>
                    )}
                  </form>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-bold text-slate-900">
              <div>
                <span>Total Amount</span>
                {order.shipping_address?.discountAmount > 0 && (
                  <span className="block text-[11px] text-emerald-600 font-normal">
                    Includes {order.shipping_address?.couponCode || 'Promo'} discount (-${Number(order.shipping_address?.discountAmount).toFixed(2)})
                  </span>
                )}
              </div>
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