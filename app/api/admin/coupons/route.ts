import { NextResponse } from 'next/server';
import { requireStaffOrAdmin } from '@/lib/supabase/auth';
import { 
  getAllCoupons, 
  createCoupon, 
  toggleCouponStatus, 
  deleteCoupon 
} from '@/lib/coupons';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireStaffOrAdmin();
    const coupons = await getAllCoupons();
    return NextResponse.json({ coupons });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unauthorized access';
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireStaffOrAdmin();
    const body = await req.json();

    const { code, discountType, discountValue, minSpend, description } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Promo code is required.' }, { status: 400 });
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json({ error: 'Discount type must be percentage or fixed.' }, { status: 400 });
    }

    const numericValue = Number(discountValue);
    if (isNaN(numericValue) || numericValue <= 0) {
      return NextResponse.json({ error: 'Discount value must be a positive number.' }, { status: 400 });
    }

    if (discountType === 'percentage' && numericValue > 100) {
      return NextResponse.json({ error: 'Percentage discount cannot exceed 100%.' }, { status: 400 });
    }

    const coupon = await createCoupon({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: numericValue,
      minSpend: minSpend ? Number(minSpend) : 0,
      description: description?.trim() || undefined,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create promo code';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireStaffOrAdmin();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });
    }

    const success = await toggleCouponStatus(id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireStaffOrAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required.' }, { status: 400 });
    }

    const success = await deleteCoupon(id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete coupon';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
