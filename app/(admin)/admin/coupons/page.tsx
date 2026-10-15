import { requireStaffOrAdmin } from '@/lib/supabase/auth';
import { getAllCoupons } from '@/lib/coupons';
import { CouponManager } from '@/components/admin/coupon-manager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Coupons & Promo Codes | Cellura Admin',
  description: 'Manage storewide discounts, promo codes, and special promotional campaigns.',
};

export default async function AdminCouponsPage() {
  await requireStaffOrAdmin();
  const coupons = await getAllCoupons();

  return <CouponManager initialCoupons={coupons} />;
}
