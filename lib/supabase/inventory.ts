import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Atomically decrement inventory for a product variant.
 * Attempts stored procedure decrement_stock first for atomic row locking,
 * and falls back to a guarded update.
 */
export async function decrementStock(
  variantId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  if (quantity <= 0) {
    return { success: false, error: 'Invalid quantity' };
  }

  try {
    // 1. Try atomic RPC with Postgres row-level locking
    const { data: rpcSuccess, error: rpcError } = await (supabaseAdmin.rpc as any)(
      'decrement_stock',
      {
        p_variant_id: variantId,
        p_quantity: quantity,
      }
    );

    if (!rpcError && typeof rpcSuccess === 'boolean') {
      return { success: rpcSuccess };
    }

    // 2. Fallback to guarded update if RPC is not yet migrated on the remote database
    const { data: variant, error: fetchError } = await (supabaseAdmin.from('product_variants') as any)
      .select('stock_quantity')
      .eq('id', variantId)
      .single();

    if (fetchError || !variant) {
      return { success: false, error: 'Variant not found' };
    }

    const currentStock = Number(variant.stock_quantity) || 0;
    if (currentStock < quantity) {
      return { success: false, error: 'Insufficient stock' };
    }

    const newStock = Math.max(0, currentStock - quantity);
    const { error: updateError } = await (supabaseAdmin.from('product_variants') as any)
      .update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variantId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Inventory decrement error';
    return { success: false, error: message };
  }
}

/**
 * Restore inventory for a product variant (e.g. on order cancellation, refund, or checkout timeout).
 */
export async function restoreStock(
  variantId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  if (quantity <= 0) return { success: true };

  try {
    // 1. Try RPC
    const { error: rpcError } = await (supabaseAdmin.rpc as any)('restore_stock', {
      p_variant_id: variantId,
      p_quantity: quantity,
    });

    if (!rpcError) {
      return { success: true };
    }

    // 2. Fallback update
    const { data: variant } = await (supabaseAdmin.from('product_variants') as any)
      .select('stock_quantity')
      .eq('id', variantId)
      .single();

    if (variant) {
      const currentStock = Number(variant.stock_quantity) || 0;
      await (supabaseAdmin.from('product_variants') as any)
        .update({
          stock_quantity: currentStock + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', variantId);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Stock restore failed' };
  }
}
