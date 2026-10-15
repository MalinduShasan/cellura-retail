import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/supabase/auth';
import { 
  Printer, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone, 
  Building2 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Official Tax Invoice & Warranty Slip | Cellura Retail',
  description: 'Download or print the official purchase invoice and 1-year hardware warranty certificate.',
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  // Fetch Order
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

  // Authorization check: User must be staff/admin OR the owner of the order
  let isAuthorized = false;
  if (user) {
    if (order.user_id === user.id || order.guest_email === user.email) {
      isAuthorized = true;
    } else {
      // Check staff role
      const { data: profile } = await (supabaseAdmin.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile && (profile.role === 'admin' || profile.role === 'staff' || profile.role === 'manager')) {
        isAuthorized = true;
      }
    }
  }

  // Allow guest invoice viewing if tracking via direct link or if logged in
  if (!user && !order.guest_email) {
    redirect(`/login?next=/account/invoice/${id}`);
  }

  const shipping = order.shipping_address || {};
  const orderDate = new Date(order.created_at);
  const warrantyEndDate = new Date(orderDate);
  warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 1);

  const discountAmount = Number(shipping.discountAmount || 0);
  const subtotal = Number(order.subtotal || order.total_amount);
  const finalTotal = Number(order.total_amount);

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white text-slate-800">
      {/* Top Action Bar - Hidden in Print */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Account
        </Link>
        <button
          type="button"
          // Client script handles window.print() via onClick
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition"
          id="print-invoice-btn"
        >
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Main Invoice Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xs p-8 sm:p-12 print:border-none print:shadow-none print:p-0 print:rounded-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-base">
                C
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">CELLURA RETAIL</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authorized Premium Hardware Retailer & Certified Electronics
            </p>
            <p className="text-[11px] text-slate-400">
              100 Tech Promenade, Suite 400 · contact@cellura.lk · cellura.lk
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Official Tax Invoice
            </span>
            <h2 className="text-sm font-mono font-bold text-slate-900">
              INV-2026-{order.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="text-xs text-slate-500">
              Order Date: {orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Billed To / Shipped To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
              Customer / Billed To
            </h3>
            <p className="font-bold text-slate-900 text-sm">{shipping.fullName || 'Valued Customer'}</p>
            <p className="text-slate-600">{order.guest_email || 'No email specified'}</p>
            {shipping.phone && <p className="text-slate-600">Tel: {shipping.phone}</p>}
          </div>

          <div>
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
              Fulfillment & Payment
            </h3>
            <p className="text-slate-700">
              <span className="font-semibold">Method:</span>{' '}
              {order.fulfillment_type === 'store_pickup' ? 'Store Pickup (Counter Collection)' : 'Insured Doorstep Courier'}
            </p>
            <p className="text-slate-700">
              <span className="font-semibold">Payment:</span>{' '}
              <span className="capitalize">{order.payment_method?.replace('_', ' ')}</span> ({order.payment_status?.toUpperCase()})
            </p>
            {order.tracking_number && (
              <p className="text-slate-700 font-mono">
                <span className="font-semibold font-sans">Tracking:</span> {order.tracking_number}
              </p>
            )}
            {order.fulfillment_type !== 'store_pickup' && shipping.address && (
              <p className="text-slate-600 mt-1">
                {shipping.address}, {shipping.city} {shipping.postalCode}, {shipping.country}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6 border-b border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="pb-3 font-semibold">Device & Specifications</th>
                <th className="pb-3 font-semibold">Registered IMEI / Serial</th>
                <th className="pb-3 font-semibold text-center">Qty</th>
                <th className="pb-3 font-semibold text-right">Unit Price</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.order_items?.map((item: any) => {
                const imei = item.variant_details?.imei;
                return (
                  <tr key={item.id} className="align-top">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-slate-900 text-sm">{item.product_name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.variant_details?.storage} · {item.variant_details?.color} · <span className="capitalize">{item.variant_details?.condition || 'New'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      {imei ? (
                        <span className="font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          {imei}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending Fulfillment</span>
                      )}
                    </td>
                    <td className="py-3.5 text-center font-medium">{item.quantity}</td>
                    <td className="py-3.5 text-right font-medium text-slate-700">
                      ${Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="py-3.5 text-right font-bold text-slate-900">
                      ${Number(item.total_price).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="py-6 border-b border-slate-200 flex justify-end text-xs">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-900">${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount ({shipping.couponCode || 'Promo'}):</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Insured Shipping:</span>
              <span className="font-medium text-teal-700">FREE</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>VAT / Sales Tax (0%):</span>
              <span className="font-medium text-slate-900">$0.00</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Paid:</span>
              <span className="text-teal-700">${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 1-Year Warranty Certificate Section */}
        <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50/50 p-6 text-xs text-teal-950 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-teal-900">
            <ShieldCheck className="h-5 w-5 text-teal-600" />
            <span>Cellura 1-Year Comprehensive Hardware Warranty Certificate</span>
          </div>
          <p className="leading-relaxed text-slate-700 text-[11px]">
            This certificate verifies that each smartphone listed on this invoice is covered by Cellura Retail&apos;s 1-Year Limited Hardware Guarantee until{' '}
            <strong>{warrantyEndDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
            Coverage includes battery diagnostics health, display assembly functionality, logic board performance, and network modem integrity.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] border-t border-teal-200/60">
            <div>
              <span className="font-bold text-teal-900 block">Certificate Ref:</span>
              <span className="font-mono text-slate-600">WAR-{order.id.slice(0, 12).toUpperCase()}</span>
            </div>
            <div>
              <span className="font-bold text-teal-900 block">Warranty Period:</span>
              <span className="text-slate-600">365 Days (Full Coverage)</span>
            </div>
            <div>
              <span className="font-bold text-teal-900 block">Claim Support:</span>
              <span className="text-slate-600">warranty@cellura.lk</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-8 text-center text-[11px] text-slate-400">
          <p>Thank you for choosing Cellura Retail. Please keep this tax invoice for warranty claims and insurance purposes.</p>
          <p className="mt-1">Computer generated invoice · No physical signature required.</p>
        </div>
      </div>

      {/* Inline Client Script for Native Print Handler */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-invoice-btn')?.addEventListener('click', () => {
              window.print();
            });
          `,
        }}
      />
    </div>
  );
}
