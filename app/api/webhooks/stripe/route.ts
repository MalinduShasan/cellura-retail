import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.warn('Stripe webhook missing signature or secret key configuration.');
      return NextResponse.json(
        { error: 'Missing stripe signature or webhook secret.' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err);
      return NextResponse.json(
        { error: `Webhook Error: ${err instanceof Error ? err.message : 'Invalid signature'}` },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        console.log(`Processing paid Stripe session for order: ${orderId}`);

        // Update order payment status and fulfillment status
        const { error: updateOrderError } = await (supabaseAdmin.from('orders') as any)
          .update({
            payment_status: 'paid',
            status: 'processing',
            stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (updateOrderError) {
          console.error(`Failed to update order ${orderId} status:`, updateOrderError);
        }

        // Fetch order items to decrement inventory
        const { data: orderItems, error: itemsError } = await (supabaseAdmin.from('order_items') as any)
          .select('variant_id, quantity')
          .eq('order_id', orderId);

        if (!itemsError && orderItems && orderItems.length > 0) {
          for (const item of (orderItems as any[])) {
            if (item.variant_id) {
              // Fetch current stock quantity
              const { data: variant } = await (supabaseAdmin.from('product_variants') as any)
                .select('stock_quantity')
                .eq('id', item.variant_id)
                .single();

              if (variant) {
                const currentStock = (variant as any).stock_quantity || 0;
                const newStock = Math.max(0, currentStock - item.quantity);

                await (supabaseAdmin.from('product_variants') as any)
                  .update({
                    stock_quantity: newStock,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', item.variant_id);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('Unhandled Stripe webhook error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
