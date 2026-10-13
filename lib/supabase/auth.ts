import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/types/database.types';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await (supabaseAdmin.from('profiles') as any)
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as ProfileRow;
}

export async function requireStaffOrAdmin(): Promise<ProfileRow> {
  const profile = await getCurrentProfile();
  const allowedRoles: string[] = ['staff', 'manager', 'admin'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    throw new Error('Unauthorized: Staff or Admin credentials required.');
  }
  return profile;
}
