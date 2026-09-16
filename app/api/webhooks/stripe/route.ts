import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
	const signature = request.headers.get('stripe-signature');
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!signature || !webhookSecret) {
		return NextResponse.json({ error: 'Webhook is not configured' }, { status: 400 });
	}

	let event;
	try {
		const body = await request.text();
		event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
	} catch {
		return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
		const paymentIntentId = typeof session.payment_intent === 'string'
			? session.payment_intent
			: null;
		const admin = createAdminClient();
		const { error } = await admin
			.from('orders')
			.update({
				payment_status: 'paid',
				status: 'processing',
				stripe_payment_intent_id: paymentIntentId,
			} as never)
			.eq('stripe_session_id', session.id)
			.neq('payment_status', 'paid');

		if (error) {
			return NextResponse.json({ error: 'Unable to update order' }, { status: 500 });
		}
	}

	return NextResponse.json({ received: true });
}
