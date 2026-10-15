import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MOCK_ORDERS } from '@/lib/mock-data';
import type { TrackedOrder } from '@/types/store.types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId') || searchParams.get('order_id') || '';
    const email = (searchParams.get('email') || '').trim().toLowerCase();

    const cleanId = orderId.trim();

    if (!cleanId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Query Database via supabaseAdmin (Bypasses RLS to allow guest & customer tracking)
    try {
      const { data: dbOrder, error } = await (supabaseAdmin.from('orders') as any)
        .select(`
          id,
          user_id,
          guest_email,
          status,
          payment_status,
          payment_method,
          fulfillment_type,
          created_at,
          tracking_number,
          subtotal,
          total_amount,
          shipping_address,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price,
            variant_details
          )
        `)
        .eq('id', cleanId)
        .maybeSingle();

      if (!error && dbOrder) {
        const orderEmail = (dbOrder.guest_email || dbOrder.shipping_address?.email || '').toLowerCase();
        
        // If an email was provided, verify it matches the order's email for extra privacy
        if (email && orderEmail && email !== orderEmail) {
          // If customer provided an email that doesn't match the order's email
          return NextResponse.json(
            { error: 'The email provided does not match the order records. Please check the email address.' },
            { status: 403 }
          );
        }

        const shipping = dbOrder.shipping_address || {};

        const mappedOrder: TrackedOrder = {
          id: dbOrder.id,
          email: orderEmail || email || 'customer@cellura.com',
          status: dbOrder.status as any,
          payment_status: dbOrder.payment_status as any,
          created_at: dbOrder.created_at,
          tracking_number: dbOrder.tracking_number || undefined,
          carrier: dbOrder.fulfillment_type === 'store_pickup' 
            ? 'Flagship Store Pickup' 
            : 'FedEx Express 2-Day Priority',
          subtotal: Number(dbOrder.subtotal || dbOrder.total_amount),
          total_amount: Number(dbOrder.total_amount),
          shipping_address: {
            ...shipping,
            fullName: shipping.fullName || 'Valued Customer',
            address: shipping.address || 'Address on file',
            city: shipping.city || 'Store Location',
            postalCode: shipping.postalCode || '',
            country: shipping.country || 'United States',
          },
          items: (dbOrder.order_items || []).map((item: any) => {
            const details = item.variant_details || {};
            const specs = [details.storage, details.color, details.condition].filter(Boolean).join(' · ');
            return {
              name: item.product_name,
              variant: specs || 'Smartphone Unit',
              quantity: item.quantity,
              price: Number(item.unit_price),
              image: details.image || details.images?.[0] || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
            };
          }),
        };

        return NextResponse.json({ order: mappedOrder });
      }
    } catch (dbErr) {
      console.warn('Database order tracking error:', dbErr);
    }

    // 2. Fallback to Mock Orders Dictionary (supports sample IDs like ord-1001, ord-1002)
    const mockMatch =
      MOCK_ORDERS[cleanId] ||
      Object.values(MOCK_ORDERS).find(
        (o) => o.id.toLowerCase() === cleanId.toLowerCase()
      );

    if (mockMatch) {
      return NextResponse.json({ order: mockMatch });
    }

    return NextResponse.json(
      { error: 'No order found with the provided ID. Please verify your Order Reference ID.' },
      { status: 404 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to track order';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
