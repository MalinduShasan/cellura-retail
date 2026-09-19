import Link from 'next/link';
import { 
  Package, 
  Layers, 
  Store, 
  ExternalLink 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-black text-lg shadow-xs">
              C
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 tracking-tight">Cellura Retail</div>
              <div className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider">Admin Staff</div>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href="/admin/orders"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <Package className="h-4 w-4 text-slate-400" />
              Orders & Dispatches
            </Link>

            <Link
              href="/admin/inventory"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              <Layers className="h-4 w-4 text-slate-400" />
              Stock & Inventory
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100 mt-6">
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
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl">
        {children}
      </main>
    </div>
  );
}