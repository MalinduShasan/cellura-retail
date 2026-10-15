import { NextResponse } from 'next/server';
import { requireStaffOrAdmin } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireStaffOrAdmin();

    // Fetch all profiles from Supabase
    const { data: profiles, error: profilesError } = await (supabaseAdmin.from('profiles') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      throw profilesError;
    }

    // Fetch order counts for each user
    const { data: orders, error: ordersError } = await (supabaseAdmin.from('orders') as any)
      .select('user_id, total_amount');

    const orderCountMap: Record<string, { count: number; totalSpent: number }> = {};
    if (!ordersError && orders) {
      for (const order of orders) {
        if (order.user_id) {
          if (!orderCountMap[order.user_id]) {
            orderCountMap[order.user_id] = { count: 0, totalSpent: 0 };
          }
          orderCountMap[order.user_id].count += 1;
          orderCountMap[order.user_id].totalSpent += Number(order.total_amount || 0);
        }
      }
    }

    // Fetch auth users to get user_metadata (including avatar_url)
    const avatarMap: Record<string, string | null> = {};
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      if (authData?.users) {
        for (const u of authData.users) {
          if (u.user_metadata?.avatar_url) {
            avatarMap[u.id] = u.user_metadata.avatar_url;
          }
        }
      }
    } catch (e) {
      console.warn('Could not list auth users metadata:', e);
    }

    const customersWithMetrics = (profiles || []).map((p: any) => ({
      ...p,
      avatar_url: avatarMap[p.id] || p.shipping_address?._avatar_url || null,
      orderCount: orderCountMap[p.id]?.count || 0,
      totalSpent: orderCountMap[p.id]?.totalSpent || 0,
    }));

    return NextResponse.json({ customers: customersWithMetrics });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch customers';
    const status = msg.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
