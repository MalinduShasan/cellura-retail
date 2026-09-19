import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import type { FulfillmentType, Json, PaymentMethod } from '@/types/database.types';

type CheckoutItem = {
  variant_id: string;
  quantity: number;
  product_name?: string;
};

type CheckoutRequest = {
  items: CheckoutItem[];
  email?: string;
  payment_method: PaymentMethod;
  fulfillment_type: FulfillmentType;
  shipping_address: Json;
};

type VariantRow = {
  id: string;
  sku: string;
  price: number;
  stock_quantity: number;
};

type CreatedOrder = {
  id: string;
  tracking_token: string | null;
};

function isValidRequest(body: CheckoutRequest) {
  return body.items.length > 0 && body.items.every(
    (item) => typeof item.variant_id === 'string'
      && Number.isInteger(item.quantity)
      && item.quantity > 0
      && item.quantity <= 20
  );
}

export async function POST(request: Request) {
  let body: CheckoutRequest;
  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body || !isValidRequest(body) || !['stripe', 'manual', 'store_pickup'].includes(body.payment_method)
    || !['home_delivery', 'store_pickup'].includes(body.fulfillment_type)) {
    return NextResponse.json({ error: 'Invalid checkout details' }, { status: 400 });
  }

  if (!body.email || !body.email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const stripe = body.payment_method === 'stripe' ? getStripe() : null;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    let stripeSessionId: string | null = null;
    if (stripe) {
      const { data: rawVariants, error } = await supabase
        .from('product_variants')
        .select('id, sku, price, stock_quantity')
        .in('id', body.items.map((item) => item.variant_id));
      const variants = (rawVariants || []) as VariantRow[];

      if (error || !variants || variants.length !== body.items.length) {
        return NextResponse.json({ error: 'One or more products are unavailable' }, { status: 409 });
      }

      const lineItems = body.items.map((item) => {
        const variant = variants.find((candidate) => candidate.id === item.variant_id);
        if (!variant || variant.stock_quantity < item.quantity) {
          throw new Error('Insufficient stock');
        }
        return {
          quantity: item.quantity,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(Number(variant.price) * 100),
            product_data: { name: item.product_name || variant.sku },
          },
        };
      });

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: body.email,
        line_items: lineItems,
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/checkout`,
      });
      stripeSessionId = session.id;
    }

    const createOrder = supabase.rpc as unknown as (
      functionName: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: CreatedOrder | null; error: { message: string } | null }>;
    const { data: order, error } = await createOrder('create_manual_order', {
      p_user_id: user?.id ?? null,
      p_guest_email: user ? null : body.email,
      p_payment_method: body.payment_method,
      p_fulfillment_type: body.fulfillment_type,
      p_shipping_address: body.shipping_address,
      p_items: body.items as unknown as Json,
      p_stripe_session_id: stripeSessionId,
    });

    if (error || !order) {
      return NextResponse.json({ error: error?.message || 'Unable to create order' }, { status: 409 });
    }

    return NextResponse.json({ orderId: order.id, trackingToken: order.tracking_token, sessionId: stripeSessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create checkout';
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
