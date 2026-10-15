import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error during server sign out:', error);
  }

  const acceptHeader = req.headers.get('accept') || '';
  const url = new URL(req.url);
  const next = url.searchParams.get('next');

  // If redirect requested or not expecting json, redirect
  if (next || !acceptHeader.includes('application/json')) {
    return NextResponse.redirect(new URL(next || '/login', req.url), {
      status: 302,
    });
  }

  return NextResponse.json({ success: true, message: 'Signed out successfully' });
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error during server sign out (GET):', error);
  }

  const url = new URL(req.url);
  const next = url.searchParams.get('next') || '/login';
  return NextResponse.redirect(new URL(next, req.url), {
    status: 302,
  });
}
