import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 10 for 10% or 50 for $50
  minSpend?: number;     // Minimum cart subtotal required
  description: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount: number;
  newTotal: number;
  message: string;
}

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'coupons.json');

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'c1a2b3c4-1111-4000-8000-000000000001',
    code: 'CELLURA10',
    discountType: 'percentage',
    discountValue: 10,
    minSpend: 100,
    description: '10% off any smartphone order over $100',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c1a2b3c4-2222-4000-8000-000000000002',
    code: 'FLAGSHIP50',
    discountType: 'fixed',
    discountValue: 50,
    minSpend: 500,
    description: '$50 discount on premium flagship devices over $500',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c1a2b3c4-3333-4000-8000-000000000003',
    code: 'WELCOME5',
    discountType: 'percentage',
    discountValue: 5,
    minSpend: 50,
    description: '5% welcome discount for new smartphone customers',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Reads coupons from local persistent JSON store.
 */
function readLocalCoupons(): Coupon[] {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read local coupons file:', err);
  }
  return DEFAULT_COUPONS;
}

/**
 * Writes coupons to local persistent JSON store.
 */
function writeLocalCoupons(coupons: Coupon[]): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(coupons, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local coupons file:', err);
  }
}

/**
 * Fetch all coupons (queries Supabase first, falls back to local storage).
 */
export async function getAllCoupons(): Promise<Coupon[]> {
  const localCoupons = readLocalCoupons();

  try {
    const { data, error } = await (supabaseAdmin.from('coupons') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      if (data.length > 0) {
        const dbCoupons: Coupon[] = data.map((c: any) => ({
          id: c.id,
          code: c.code,
          discountType: c.discount_type,
          discountValue: Number(c.discount_value),
          minSpend: c.min_spend ? Number(c.min_spend) : 0,
          description: c.description || '',
          isActive: c.is_active,
          expiresAt: c.expires_at || undefined,
          createdAt: c.created_at,
        }));

        // Merge any local coupons not yet present in Supabase
        const dbCodes = new Set(dbCoupons.map((c) => c.code.toUpperCase()));
        const missingFromDb = localCoupons.filter((c) => !dbCodes.has(c.code.toUpperCase()));

        if (missingFromDb.length > 0) {
          // Asynchronously sync missing coupons to Supabase
          Promise.resolve().then(async () => {
            for (const item of missingFromDb) {
              try {
                await (supabaseAdmin.from('coupons') as any).upsert({
                  id: item.id,
                  code: item.code.toUpperCase(),
                  discount_type: item.discountType,
                  discount_value: item.discountValue,
                  min_spend: item.minSpend || 0,
                  description: item.description,
                  is_active: item.isActive,
                });
              } catch {
                // Ignore seed errors
              }
            }
          });
        }

        return [...dbCoupons, ...missingFromDb];
      } else {
        // Table exists in DB but has 0 records -> Seed it from local store
        Promise.resolve().then(async () => {
          for (const item of localCoupons) {
            try {
              await (supabaseAdmin.from('coupons') as any).upsert({
                id: item.id,
                code: item.code.toUpperCase(),
                discount_type: item.discountType,
                discount_value: item.discountValue,
                min_spend: item.minSpend || 0,
                description: item.description,
                is_active: item.isActive,
              });
            } catch {
              // Ignore seed errors
            }
          }
        });

        return localCoupons;
      }
    }
  } catch {
    // Fall through to local fallback
  }

  return localCoupons;
}

/**
 * Creates a new promotional coupon code.
 */
export async function createCoupon(couponData: {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend?: number;
  description?: string;
  isActive?: boolean;
}): Promise<Coupon> {
  const normalizedCode = couponData.code.trim().toUpperCase();

  const newCoupon: Coupon = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `coup-${Date.now()}`,
    code: normalizedCode,
    discountType: couponData.discountType,
    discountValue: couponData.discountValue,
    minSpend: couponData.minSpend || 0,
    description: couponData.description || `${couponData.discountValue}${couponData.discountType === 'percentage' ? '%' : '$'} promotional discount`,
    isActive: couponData.isActive !== false,
    createdAt: new Date().toISOString(),
  };

  try {
    await (supabaseAdmin.from('coupons') as any)
      .upsert({
        id: newCoupon.id,
        code: newCoupon.code,
        discount_type: newCoupon.discountType,
        discount_value: newCoupon.discountValue,
        min_spend: newCoupon.minSpend,
        description: newCoupon.description,
        is_active: newCoupon.isActive,
      });
  } catch {
    // Fall back to local file
  }

  const existing = readLocalCoupons();
  const filtered = existing.filter((c) => c.code.toUpperCase() !== normalizedCode);
  const updated = [newCoupon, ...filtered];
  writeLocalCoupons(updated);
  return newCoupon;
}

/**
 * Toggles a coupon's active status.
 */
export async function toggleCouponStatus(id: string): Promise<boolean> {
  try {
    const { data: current } = await (supabaseAdmin.from('coupons') as any)
      .select('is_active')
      .eq('id', id)
      .single();

    if (current) {
      const nextActive = !current.is_active;
      const { error } = await (supabaseAdmin.from('coupons') as any)
        .update({ is_active: nextActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) return true;
    }
  } catch {
    // Fall back to local file
  }

  const existing = readLocalCoupons();
  const match = existing.find((c) => c.id === id);
  if (match) {
    match.isActive = !match.isActive;
    writeLocalCoupons(existing);
    return true;
  }
  return false;
}

/**
 * Deletes a promotional coupon.
 */
export async function deleteCoupon(id: string): Promise<boolean> {
  try {
    const { error } = await (supabaseAdmin.from('coupons') as any)
      .delete()
      .eq('id', id);

    if (!error) return true;
  } catch {
    // Fall back to local file
  }

  const existing = readLocalCoupons();
  const updated = existing.filter((c) => c.id !== id);
  writeLocalCoupons(updated);
  return true;
}

/**
 * Validates a coupon code dynamically against registered active coupons.
 */
export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
  const normalizedCode = (code || '').trim().toUpperCase();

  if (!normalizedCode) {
    return {
      valid: false,
      discountAmount: 0,
      newTotal: subtotal,
      message: 'Please enter a coupon code.',
    };
  }

  const allCoupons = await getAllCoupons();
  const coupon = allCoupons.find(
    (c) => c.code === normalizedCode && c.isActive
  );

  if (!coupon) {
    return {
      valid: false,
      discountAmount: 0,
      newTotal: subtotal,
      message: 'Invalid promo code or coupon has expired.',
    };
  }

  if (coupon.minSpend && subtotal < coupon.minSpend) {
    return {
      valid: false,
      discountAmount: 0,
      newTotal: subtotal,
      message: `Minimum order spend of $${coupon.minSpend} required for promo code ${coupon.code}.`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (subtotal * coupon.discountValue) / 100;
  } else {
    discountAmount = Math.min(coupon.discountValue, subtotal);
  }

  // Round discount to 2 decimal places
  discountAmount = Math.round(discountAmount * 100) / 100;
  const newTotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    newTotal,
    message: `Promo code ${coupon.code} applied successfully! You saved $${discountAmount.toFixed(2)}.`,
  };
}
