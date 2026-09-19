import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

interface CheckoutItemRequest {
  variantId: string;
  quantity: number;
}

interface CheckoutRequest {
  items: CheckoutItemRequest[];
  customerEmail: string;
  shippingDetails: {
    fullName: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: 'stripe' | 'bank_transfer' | 'store_pickup';
}

interface DbVariantRow {
  id: string;
  price: number | string;
  stock_quantity: number | null;
  storage: string;
  color: string;
  condition: string;
  products: { id?: string; name: string } | { id?: string; name: string }[] | null;
}

export async function POST(request: Request) {
  let body: CheckoutRequest;
  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { items, customerEmail, shippingDetails, paymentMethod } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  if (!customerEmail) {
    return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
  }

  try {
    const variantIds = items.map((i) => i.variantId);

    // 1. Zero-Trust Price & Inventory Verification
    const { data, error: variantError } = await supabaseAdmin
      .from('product_variants')
      .select(`
        id,
        price,
        stock_quantity,
        storage,
        color,
        condition,
        products (
          id,
          name
        )
      `)
      .in('id', variantIds);

    if (variantError || !data || data.length === 0) {
      console.error('Catalog query error:', variantError);
      return NextResponse.json(
        { error: 'Could not verify catalog pricing. Please try again.' },
        { status: 400 }
      );
    }

    const dbVariants = data as unknown as DbVariantRow[];

    let verifiedSubtotal = 0;
    const validatedItems = items.map((clientItem) => {
      const match = dbVariants.find((v) => v.id === clientItem.variantId);
      if (!match) {
        throw new Error(`Variant ${clientItem.variantId} not found`);
      }
      if ((match.stock_quantity ?? 0) < clientItem.quantity) {
        throw new Error('Insufficient inventory for selected device.');
      }

      const unitPrice = Number(match.price);
      const totalPrice = unitPrice * clientItem.quantity;
      verifiedSubtotal += totalPrice;

      const rawProductName = Array.isArray(match.products)
        ? match.products[0]?.name
        : match.products?.name || 'Smartphone';

      return {
        variantId: match.id,
        productName: rawProductName,
        variantDetails: {
          storage: match.storage,
          color: match.color,
          condition: match.condition || 'new',
        },
        displayName: `${rawProductName} (${match.storage} - ${match.color})`,
        unitPrice,
        quantity: clientItem.quantity,
        totalPrice,
      };
    });

    // 2. Insert Order into Supabase
    const { data: orderData, error: orderError } = await (supabaseAdmin
      .from('orders') as any)
      .insert({
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: paymentMethod,
        guest_email: customerEmail,
        shipping_address: shippingDetails,
        subtotal: verifiedSubtotal,
        total_amount: verifiedSubtotal,
      })
      .select('id')
      .single();

    if (orderError || !orderData) {
      console.error('Order insertion failed:', orderError);
      return NextResponse.json(
        { error: `Database error: ${orderError?.message || 'Failed to create order'}` },
        { status: 500 }
      );
    }

    const orderId = orderData.id;

    // 3. Insert Order Items (Exact match with Supabase schema)
    const itemsPayload = validatedItems.map((item) => ({
      order_id: orderId,
      variant_id: item.variantId,
      product_name: item.productName,
      variant_details: item.variantDetails,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
    }));

    const { error: itemsError } = await (supabaseAdmin
      .from('order_items') as any)
      .insert(itemsPayload);

    if (itemsError) {
      console.error('Order items insertion error:', itemsError);
      return NextResponse.json(
        { error: `Failed to insert order items: ${itemsError.message}` },
        { status: 500 }
      );
    }

    // 4. Handle Payment Branching
    if (paymentMethod === 'stripe') {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey || stripeKey.includes('placeholder')) {
        return NextResponse.json(
          {
            error:
              'Stripe Secret Key is not configured. Please choose Bank Transfer or Store Pickup, or configure test keys.',
          },
          { status: 400 }
        );
      }

      const siteUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:3000';

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = validatedItems.map(
        (item) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.displayName,
            },
            unit_amount: Math.round(item.unitPrice * 100),
          },
          quantity: item.quantity,
        })
      );

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: customerEmail,
        line_items: lineItems,
        mode: 'payment',
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}&paymentMethod=stripe`,
        cancel_url: `${siteUrl}/checkout`,
        metadata: {
          orderId,
          customerEmail,
        },
      });

      return NextResponse.json({ url: session.url, orderId });
    }

    // Direct Bank Transfer or In-Store Pickup
    return NextResponse.json({
      success: true,
      orderId,
      paymentMethod,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Order processing failed';
    console.error('Checkout error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}