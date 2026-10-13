import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null, role: null, profile: null });
    }

    // Query profile with supabaseAdmin to bypass RLS recursion
    const { data: profile } = await (supabaseAdmin.from('profiles') as any)
      .select('id, email, full_name, role')
      .eq('id', user.id)
      .maybeSingle();

    return NextResponse.json({
      user,
      role: (profile as any)?.role || 'customer',
      profile: profile || null,
    });
  } catch {
    return NextResponse.json({ user: null, role: null, profile: null });
  }
}
