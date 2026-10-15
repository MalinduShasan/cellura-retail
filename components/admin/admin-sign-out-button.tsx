'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { signOutAndRedirect } from '@/lib/auth-client';

export function AdminSignOutButton({ compact, className = '' }: { compact?: boolean; className?: string }) {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await signOutAndRedirect('/login');
  };

  if (compact) {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={handleSignOut}
        className={`flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition ${className}`}
        title="Sign Out"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
        <span>Exit</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleSignOut}
      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition ${className}`}
      title="Sign Out of Admin"
    >
      <span className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
        ) : (
          <LogOut className="h-4 w-4 text-rose-500" />
        )}
        <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
      </span>
      <span className="text-[10px] uppercase font-bold text-slate-400">Exit</span>
    </button>
  );
}
