import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireStaffOrAdmin } from '@/lib/supabase/auth';
import { revalidatePath } from 'next/cache';
import { 
  InventoryManager, 
  type InventoryItem, 
  type CreateProductPayload, 
  type UpdateVariantPayload 
} from '@/components/admin/inventory-manager';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

// 1. Quick Stock Stepper Action
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

// 2. Add New Product & Hardware Variant Action
async function createProductAction(payload: CreateProductPayload): Promise<{ success: boolean; error?: string; item?: InventoryItem }> {
  'use server';

  try {
    await requireStaffOrAdmin();

    if (!payload.name || !payload.sku || payload.price < 0) {
      return { success: false, error: 'Name, SKU, and valid Price are required.' };
    }

    // 1. Find or create brand
    let brandId: string | null = null;
    const cleanBrand = payload.brandName.trim() || 'Cellura';
    const { data: existingBrand } = await (supabaseAdmin.from('brands') as any)
      .select('id')
      .ilike('name', cleanBrand)
      .maybeSingle();

    if (existingBrand) {
      brandId = existingBrand.id;
    } else {
      const brandSlug = cleanBrand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: newBrand, error: brandErr } = await (supabaseAdmin.from('brands') as any)
        .insert({ name: cleanBrand, slug: brandSlug })
        .select('id')
        .single();
      if (!brandErr && newBrand) {
        brandId = newBrand.id;
      }
    }

    // 2. Find or create product
    let productId: string;
    const baseSlug = payload.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { data: existingProduct } = await (supabaseAdmin.from('products') as any)
      .select('id')
      .eq('slug', baseSlug)
      .maybeSingle();

    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      const { data: newProduct, error: prodErr } = await (supabaseAdmin.from('products') as any)
        .insert({
          name: payload.name.trim(),
          slug: baseSlug,
          brand_id: brandId,
          description: payload.description || `${payload.name} flagship smartphone.`,
          is_active: true,
        })
        .select('id')
        .single();

      if (prodErr || !newProduct) {
        return { success: false, error: `Product creation failed: ${prodErr?.message}` };
      }
      productId = newProduct.id;
    }

    // 3. Create product variant
    const defaultImage = payload.imageUrl?.trim() || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80';
    const { data: variant, error: varErr } = await (supabaseAdmin.from('product_variants') as any)
      .insert({
        product_id: productId,
        sku: payload.sku.trim(),
        storage: payload.storage.trim(),
        color: payload.color.trim(),
        condition: payload.condition,
        price: payload.price,
        compare_at_price: payload.compareAtPrice || null,
        stock_quantity: payload.stockQuantity || 0,
        images: [defaultImage],
      })
      .select('*')
      .single();

    if (varErr || !variant) {
      return { success: false, error: `Variant creation failed: ${varErr?.message}` };
    }

    revalidatePath('/admin/inventory');
    revalidatePath('/phones');
    revalidatePath('/');

    const newItem: InventoryItem = {
      id: variant.id,
      productId,
      sku: variant.sku,
      productName: payload.name.trim(),
      brandName: cleanBrand,
      storage: variant.storage,
      color: variant.color,
      condition: variant.condition,
      price: Number(variant.price),
      compareAtPrice: variant.compare_at_price ? Number(variant.compare_at_price) : null,
      stockQuantity: Number(variant.stock_quantity),
      image: defaultImage,
      isActive: true,
      updatedAt: variant.updated_at || new Date().toISOString(),
    };

    return { success: true, item: newItem };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create product.',
    };
  }
}

// 3. Edit Existing Variant & Product Action
async function updateVariantAction(payload: UpdateVariantPayload): Promise<{ success: boolean; error?: string; item?: InventoryItem }> {
  'use server';

  try {
    await requireStaffOrAdmin();

    // 1. Update product_variants
    const updateVariantData: Record<string, any> = {
      sku: payload.sku.trim(),
      storage: payload.storage.trim(),
      color: payload.color.trim(),
      condition: payload.condition,
      price: payload.price,
      compare_at_price: payload.compareAtPrice || null,
      stock_quantity: payload.stockQuantity,
      updated_at: new Date().toISOString(),
    };

    if (payload.imageUrl?.trim()) {
      updateVariantData.images = [payload.imageUrl.trim()];
    }

    const { data: updatedVariant, error: varErr } = await (supabaseAdmin.from('product_variants') as any)
      .update(updateVariantData)
      .eq('id', payload.variantId)
      .select('*')
      .single();

    if (varErr || !updatedVariant) {
      return { success: false, error: `Variant update failed: ${varErr?.message}` };
    }

    // 2. Update product title and visibility
    if (payload.productId) {
      await (supabaseAdmin.from('products') as any)
        .update({
          name: payload.productName.trim(),
          is_active: payload.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.productId);
    }

    revalidatePath('/admin/inventory');
    revalidatePath('/phones');
    revalidatePath('/');

    const updatedItem: InventoryItem = {
      id: updatedVariant.id,
      productId: payload.productId,
      sku: updatedVariant.sku,
      productName: payload.productName.trim(),
      brandName: 'Cellura',
      storage: updatedVariant.storage,
      color: updatedVariant.color,
      condition: updatedVariant.condition,
      price: Number(updatedVariant.price),
      compareAtPrice: updatedVariant.compare_at_price ? Number(updatedVariant.compare_at_price) : null,
      stockQuantity: Number(updatedVariant.stock_quantity),
      image: updatedVariant.images?.[0] || payload.imageUrl,
      isActive: payload.isActive,
      updatedAt: updatedVariant.updated_at,
    };

    return { success: true, item: updatedItem };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update variant.',
    };
  }
}

// 4. Soft Delete Toggle Action (Store Visibility)
async function toggleProductActiveAction(productId: string, isActive: boolean) {
  'use server';

  try {
    await requireStaffOrAdmin();

    const { error } = await (supabaseAdmin.from('products') as any)
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

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
      error: err instanceof Error ? err.message : 'Visibility toggle failed.',
    };
  }
}

// 5. Delete or Archive Variant Action
async function deleteVariantAction(variantId: string, productId: string) {
  'use server';

  try {
    await requireStaffOrAdmin();

    // Check if variant has existing sales in order_items
    const { count } = await (supabaseAdmin.from('order_items') as any)
      .select('id', { count: 'exact', head: true })
      .eq('variant_id', variantId);

    if (count && count > 0) {
      // Safe Soft Delete: set stock to 0 and deactivate product so historical receipts remain intact
      await (supabaseAdmin.from('product_variants') as any)
        .update({ stock_quantity: 0, updated_at: new Date().toISOString() })
        .eq('id', variantId);

      await (supabaseAdmin.from('products') as any)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', productId);

      revalidatePath('/admin/inventory');
      revalidatePath('/phones');
      revalidatePath('/');

      return {
        success: true,
        message: 'Variant is linked to past customer orders: safely deactivated and stock set to 0 (soft-deleted).',
      };
    }

    // If no sales history, safe hard delete
    const { error } = await (supabaseAdmin.from('product_variants') as any)
      .delete()
      .eq('id', variantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/inventory');
    revalidatePath('/phones');
    revalidatePath('/');

    return { success: true, message: 'Variant permanently removed from catalog.' };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete variant.',
    };
  }
}

async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .select(`
        id,
        product_id,
        sku,
        storage,
        color,
        condition,
        price,
        compare_at_price,
        stock_quantity,
        images,
        updated_at,
        products (
          id,
          name,
          is_active,
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
          productId: prod?.id || row.product_id,
          sku: row.sku,
          productName: prod?.name || 'Smartphone',
          brandName: brand || 'Cellura',
          storage: row.storage,
          color: row.color,
          condition: row.condition,
          price: Number(row.price),
          compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : null,
          stockQuantity: Number(row.stock_quantity) || 0,
          image: row.images?.[0] || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
          isActive: prod?.is_active ?? true,
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
      productId: p.id,
      sku: v.sku,
      productName: p.name,
      brandName: p.brand,
      storage: v.storage,
      color: v.color,
      condition: v.condition,
      price: v.price,
      compareAtPrice: v.compare_at_price,
      stockQuantity: v.stock_quantity,
      image: v.images[0],
      isActive: true,
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
            Monitor real-time warehouse counts, add devices, edit prices, and manage store visibility.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs">
          Active SKUs: <span className="text-teal-600">{items.length}</span>
        </div>
      </div>

      <InventoryManager 
        initialItems={items} 
        updateStockAction={updateStockAction}
        createProductAction={createProductAction}
        updateVariantAction={updateVariantAction}
        toggleProductActiveAction={toggleProductActiveAction}
        deleteVariantAction={deleteVariantAction}
      />
    </div>
  );
}
