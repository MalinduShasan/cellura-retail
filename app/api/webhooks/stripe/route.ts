import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { decrementStock } from '@/lib/supabase/inventory';
import { sendOrderConfirmationEmail } from '@/lib/email';
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

        // Fetch order items to decrement inventory and prepare confirmation email
        const { data: orderItems, error: itemsError } = await (supabaseAdmin.from('order_items') as any)
          .select('variant_id, product_name, variant_details, quantity, unit_price, total_price')
          .eq('order_id', orderId);

        if (!itemsError && orderItems && orderItems.length > 0) {
          for (const item of (orderItems as any[])) {
            if (item.variant_id) {
              const res = await decrementStock(item.variant_id, item.quantity);
              if (!res.success) {
                console.error(`Webhook stock decrement failed for variant ${item.variant_id}:`, res.error);
              }
            }
          }

          const customerEmail = session.customer_email || session.metadata?.customerEmail;
          if (customerEmail) {
            sendOrderConfirmationEmail({
              orderId,
              customerEmail,
              items: (orderItems as any[]).map((i) => ({
                productName: i.product_name,
                variantDetails: i.variant_details,
                quantity: i.quantity,
                unitPrice: Number(i.unit_price),
                totalPrice: Number(i.total_price),
              })),
              totalAmount: (orderItems as any[]).reduce((sum, i) => sum + Number(i.total_price || 0), 0),
              paymentMethod: 'stripe',
            }).catch((err) => console.error('Failed to send Stripe confirmation email:', err));
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
