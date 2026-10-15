'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { signOutAndRedirect } from '@/lib/auth-client';

interface AccountSignOutButtonProps {
  className?: string;
  variant?: 'outline' | 'ghost' | 'danger';
}

export function AccountSignOutButton({
  className = '',
  variant = 'outline',
}: AccountSignOutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await signOutAndRedirect('/login');
  };

  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition disabled:opacity-50';

  const variantStyles = {
    outline:
      'border border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 px-3.5 py-2',
    ghost:
      'text-rose-600 hover:bg-rose-50 px-3 py-1.5',
    danger:
      'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-3.5 py-2',
  }[variant];

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleSignOut}
      className={`${baseStyles} ${variantStyles} ${className}`}
      title="Sign Out of your account"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
          <span>Signing out...</span>
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4 text-rose-500" />
          <span>Sign Out</span>
        </>
      )}
    </button>
  );
}
