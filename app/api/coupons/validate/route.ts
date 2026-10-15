import { NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/coupons';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, subtotal } = body;

    if (typeof subtotal !== 'number' || subtotal <= 0) {
      return NextResponse.json(
        { error: 'Invalid subtotal provided.' },
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, subtotal);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Coupon validation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
