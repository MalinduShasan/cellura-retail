import Link from 'next/link';
import { 
  Package, 
  Layers, 
  Store, 
  ExternalLink,
  LayoutDashboard,
  Tag,
  Users
} from 'lucide-react';
import { AdminSignOutButton } from '@/components/admin/admin-sign-out-button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navLinks = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Orders', href: '/admin/orders', icon: Package },
    { label: 'Inventory', href: '/admin/inventory', icon: Layers },
    { label: 'Coupons', href: '/admin/coupons', icon: Tag },
    { label: 'Customers', href: '/admin/customers', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar / Mobile Header */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-4 md:p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-black text-lg shadow-xs">
                C
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 tracking-tight leading-none">Cellura Retail</div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-teal-600 uppercase tracking-wider mt-1">Admin Portal</div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <Link
                href="/"
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Store className="h-3 w-3" />
                <span>Store</span>
              </Link>
              <AdminSignOutButton compact />
            </div>
          </div>

          {/* Navigation: Horizontally scrollable on mobile, vertical stack on desktop */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar py-1 md:py-0">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shrink-0 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:block pt-6 border-t border-slate-100 mt-6 space-y-2">
          <Link
            href="/"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <span className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Storefront
            </span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <AdminSignOutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-10 max-w-7xl w-full">
        {children}
      </main>
    </div>
  );
}