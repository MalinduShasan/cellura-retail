import { createClient } from '@/lib/supabase/client';

/**
 * Cleanly signs out the user across both client and server sessions,
 * clears cookies, and performs a hard refresh redirect to the relevant page.
 *
 * @param customRedirect Optional URL to redirect to after sign-out.
 * If omitted:
 * - Protected pages (/admin, /account) redirect to /login
 * - Public pages refresh their current URL to reflect the signed-out state.
 */
export async function signOutAndRedirect(customRedirect?: string) {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Browser signOut warning:', err);
  }

  try {
    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    console.warn('Server signOut warning:', err);
  }

  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    const isProtected = currentPath.startsWith('/admin') || currentPath.startsWith('/account');
    let target = customRedirect || (isProtected ? '/login?message=signed_out' : currentPath || '/');
    if (target === '/login') {
      target = '/login?message=signed_out';
    }

    // Full window navigation clears all React state, cart listeners, and loads freshly invalidated cookies
    window.location.href = target;
  }
}
