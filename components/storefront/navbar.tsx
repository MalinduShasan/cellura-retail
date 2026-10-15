'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  ShoppingBag, 
  Smartphone, 
  X, 
  User, 
  Shield, 
  LogOut, 
  Layers, 
  Package, 
  ChevronDown,
  Heart,
  Tag,
  Loader2
} from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { createClient } from '@/lib/supabase/client';
import { signOutAndRedirect } from '@/lib/auth-client';

export function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const { totalCount, setIsOpen } = useCart();
  const { wishlistCount, setIsWishlistDrawerOpen } = useWishlist();

  // Auth & Profile State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setUserRole(data.role);
          setAvatarUrl(data.avatarUrl || data.user?.user_metadata?.avatar_url || null);
        }
      } catch {
        // Ignore fetch errors
      }
    }

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setProfileDropdownOpen(false);
    await signOutAndRedirect();
  };

  const activeBrand = searchParams.get('brand')?.toLowerCase();
  const activeCondition = searchParams.get('condition')?.toLowerCase();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/phones?q=${encodeURIComponent(searchTerm.trim())}`);
      setMobileSearchOpen(false);
    } else {
      router.push('/phones');
    }
  };

  const isStaffOrAdmin = userRole && ['staff', 'manager', 'admin'].includes(userRole);

  const navTags = [
    { label: 'All Devices', href: '/phones', isActive: !activeBrand && !activeCondition && !searchParams.get('q') },
    { label: 'Apple', href: '/phones?brand=Apple', isActive: activeBrand === 'apple' },
    { label: 'Samsung', href: '/phones?brand=Samsung', isActive: activeBrand === 'samsung' },
    { label: 'Google', href: '/phones?brand=Google', isActive: activeBrand === 'google' },
    { label: 'Refurbished', href: '/phones?condition=refurbished', isActive: activeCondition === 'refurbished' },
    { label: 'Pre-Owned', href: '/phones?condition=pre-owned', isActive: activeCondition === 'pre-owned' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white transition group-hover:bg-teal-600">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-none">
              Cellura
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium tracking-widest text-teal-600 uppercase">
              Retail
            </span>
          </div>
        </Link>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search flagship models, storage, or brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search devices"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
            />
          </form>
        </div>

        {/* Action Controls (Admin Badge, Profile Dropdown & Cart Trigger) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Admin Portal Button for staff members */}
          {isStaffOrAdmin && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-600 transition shadow-xs"
            >
              <Shield className="h-3.5 w-3.5 text-teal-300" />
              <span>Admin Portal</span>
            </Link>
          )}

          {/* Mobile Search Toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Toggle mobile search"
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200"
          >
            {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          {/* User Profile / Account Menu */}
          <div className="relative" ref={dropdownRef}>
            {currentUser ? (
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-label="User Account Menu"
                className="flex items-center gap-1.5 h-10 px-2 rounded-full border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="User Avatar"
                    className="h-6 w-6 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white text-[11px] font-bold uppercase">
                    {currentUser.email ? currentUser.email[0] : 'U'}
                  </div>
                )}
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            ) : (
              <Link
                href="/login"
                title="Sign In / Staff Portal"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
              >
                <User className="h-4.5 w-4.5" />
              </Link>
            )}

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && currentUser && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center gap-2.5">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full object-cover shrink-0 border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold shrink-0">
                      {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-400 font-medium leading-none">Signed in as</div>
                    <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                      {currentUser.email}
                    </div>
                    {userRole && (
                      <span className="inline-block mt-1 rounded-md bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal-700 border border-teal-200">
                        {userRole}
                      </span>
                    )}
                  </div>
                </div>

                {isStaffOrAdmin && (
                  <>
                    <Link
                      href="/admin"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      <Shield className="h-4 w-4 text-teal-600" />
                      Admin Dashboard
                    </Link>
                    <Link
                      href="/admin/orders"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      <Package className="h-4 w-4 text-slate-400" />
                      Orders & Dispatches
                    </Link>
                    <Link
                      href="/admin/inventory"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      <Layers className="h-4 w-4 text-slate-400" />
                      Stock & Inventory
                    </Link>
                    <Link
                      href="/admin/coupons"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      <Tag className="h-4 w-4 text-slate-400" />
                      Coupons & Promos
                    </Link>
                    <div className="border-t border-slate-100 my-1" />
                  </>
                )}

                <Link
                  href="/account"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                >
                  <User className="h-4 w-4 text-teal-600" />
                  My Orders & Account
                </Link>

                <Link
                  href="/track-order"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                >
                  <Package className="h-4 w-4 text-slate-400" />
                  Track Orders
                </Link>

                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition text-left"
                >
                  {isSigningOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                      Signing out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 text-rose-500" />
                      Sign Out
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Wishlist Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsWishlistDrawerOpen(true)}
            aria-label={`Wishlist with ${wishlistCount} saved devices`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          >
            <Heart className={`h-4.5 w-4.5 ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label={`Shopping cart with ${totalCount} items`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-semibold text-white">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="border-t border-slate-200 bg-white p-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              autoFocus
              placeholder="Search models, specs, brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search devices"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-teal-500 focus:bg-white"
            />
          </form>
        </div>
      )}

      {/* Explore Category Filters */}
      <div className="border-t border-slate-100 bg-slate-50/90 px-4 py-2 text-xs">
        <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5">
          <span className="shrink-0 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
            Explore:
          </span>
          {navTags.map((tag) => (
            <Link
              key={tag.label}
              href={tag.href}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                tag.isActive
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {tag.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}