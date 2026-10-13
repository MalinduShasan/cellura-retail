import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireStaffOrAdmin } from '@/lib/supabase/auth';
import { revalidatePath } from 'next/cache';
import { InventoryManager, type InventoryItem } from '@/components/admin/inventory-manager';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

async function updateStockAction(variantId: string, newQuantity: number) {
  'use server';

  try {
    await requireStaffOrAdmin();

    if (newQuantity < 0) {
      return { success: false, error: 'Quantity cannot be negative.' };
    }

    const { error } = await (supabaseAdmin.from('product_variants') as any)
      .update({
        stock_quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/inventory');
    revalidatePath('/phones');
    revalidatePath('/');

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Stock update failed.',
    };
  }
}

async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .select(`
        id,
        sku,
        storage,
        color,
        condition,
        price,
        stock_quantity,
        images,
        updated_at,
        products (
          name,
          brands (
            name
          )
        )
      `)
      .order('sku', { ascending: true });

    if (!error && data && data.length > 0) {
      return (data as any[]).map((row) => {
        const prod = Array.isArray(row.products) ? row.products[0] : row.products;
        const brand = prod?.brands ? (Array.isArray(prod.brands) ? prod.brands[0]?.name : prod.brands?.name) : 'Cellura';

        return {
          id: row.id,
          sku: row.sku,
          productName: prod?.name || 'Smartphone',
          brandName: brand || 'Cellura',
          storage: row.storage,
          color: row.color,
          condition: row.condition,
          price: Number(row.price),
          stockQuantity: Number(row.stock_quantity) || 0,
          image: row.images?.[0] || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
          updatedAt: row.updated_at,
        };
      });
    }
  } catch (err) {
    console.warn('Failed to query inventory from database; using mock items.', err);
  }

  // Fallback to MOCK_PRODUCTS variants if database is empty/unseeded
  return MOCK_PRODUCTS.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      productName: p.name,
      brandName: p.brand,
      storage: v.storage,
      color: v.color,
      condition: v.condition,
      price: v.price,
      stockQuantity: v.stock_quantity,
      image: v.images[0],
      updatedAt: p.created_at,
    }))
  );
}

export default async function AdminInventoryPage() {
  const items = await getInventoryItems();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock & Inventory Control</h1>
          <p className="text-sm text-slate-500">
            Monitor real-time warehouse counts, variant SKUs, and restock alerts.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs">
          Active SKUs: <span className="text-teal-600">{items.length}</span>
        </div>
      </div>

      <InventoryManager initialItems={items} updateStockAction={updateStockAction} />
    </div>
  );
}
