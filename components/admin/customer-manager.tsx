'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  Edit3, 
  Key, 
  Shield, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Sparkles,
  Calendar,
  Camera,
  Trash2,
  UploadCloud
} from 'lucide-react';

interface CustomerItem {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'customer' | 'staff' | 'manager' | 'admin';
  avatar_url?: string | null;
  shipping_address: any;
  created_at: string;
  orderCount?: number;
  totalSpent?: number;
}

export function CustomerManager() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'staff' | 'admin'>('all');

  // Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editRole, setEditRole] = useState<'customer' | 'staff' | 'manager' | 'admin'>('customer');
  const [editAddress, setEditAddress] = useState({
    address: '',
    apartment: '',
    city: '',
    postalCode: '',
    country: 'United States',
  });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load customers');
      }
      setCustomers(data.customers || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenEdit = (customer: CustomerItem) => {
    setEditingCustomer(customer);
    setEditFullName(customer.full_name || '');
    setEditPhone(customer.phone || '');
    setEditAvatarUrl(customer.avatar_url || null);
    setEditRole(customer.role || 'customer');
    
    const addr = customer.shipping_address || {};
    setEditAddress({
      address: addr.address || '',
      apartment: addr.apartment || '',
      city: addr.city || '',
      postalCode: addr.postalCode || '',
      country: addr.country || 'United States',
    });

    setNewPassword('');
    setShowPassword(false);
    setModalMessage(null);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
      setModalMessage({ type: 'error', text: 'Please choose a valid image file (JPEG, PNG, WebP, AVIF).' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setModalMessage({ type: 'error', text: 'Image file size must be under 5MB.' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }
      setEditAvatarUrl(data.url);
      setModalMessage({ type: 'success', text: 'Image uploaded. Click "Save Customer Changes" to apply.' });
    } catch (err: unknown) {
      setModalMessage({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setShowPassword(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    if (newPassword && newPassword.trim().length < 6) {
      setModalMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    setIsSaving(true);
    setModalMessage(null);

    try {
      const payload: any = {
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        role: editRole,
        avatarUrl: editAvatarUrl,
        shippingAddress: {
          ...editAddress,
          fullName: editFullName.trim(),
          phone: editPhone.trim(),
          _avatar_url: editAvatarUrl,
        },
      };

      if (newPassword.trim()) {
        payload.newPassword = newPassword.trim();
      }

      const res = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }

      setModalMessage({ type: 'success', text: data.message || 'Customer profile updated successfully.' });

      // Update local state list
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomer.id
            ? {
                ...c,
                full_name: editFullName.trim(),
                phone: editPhone.trim(),
                role: editRole,
                shipping_address: payload.shippingAddress,
              }
            : c
        )
      );

      // Reset password field
      setNewPassword('');

      // Auto close after brief display
      setTimeout(() => {
        setEditingCustomer(null);
      }, 1400);
    } catch (err: unknown) {
      setModalMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Update failed',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (c.full_name || '').toLowerCase().includes(q);
    const emailMatch = (c.email || '').toLowerCase().includes(q);
    const phoneMatch = (c.phone || '').toLowerCase().includes(q);
    const idMatch = c.id.toLowerCase().includes(q);

    const matchesQuery = nameMatch || emailMatch || phoneMatch || idMatch;
    if (!matchesQuery) return false;

    if (roleFilter === 'all') return true;
    if (roleFilter === 'customer') return c.role === 'customer';
    if (roleFilter === 'staff') return c.role === 'staff' || c.role === 'manager';
    if (roleFilter === 'admin') return c.role === 'admin';
    return true;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 border border-purple-200">
            <Shield className="h-3 w-3" /> Admin
          </span>
        );
      case 'manager':
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-200">
            Staff
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-700 border border-teal-200">
            Customer
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-teal-600" />
            Customer Profiles & Accounts
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            View customer order volumes, update profile records, and manage account passwords
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCustomers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {(['all', 'customer', 'staff', 'admin'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setRoleFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                roleFilter === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'all' ? `All (${customers.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table / Directory */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            <span>Loading customer accounts...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600 flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No customers found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Orders Placed</th>
                  <th className="py-3 px-4">Shipping Location</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => {
                  const addr = c.shipping_address || {};
                  const location = [addr.city, addr.country].filter(Boolean).join(', ');

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {c.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.avatar_url}
                              alt={c.full_name || 'Customer'}
                              className="h-9 w-9 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-sm shrink-0">
                              {c.email ? c.email[0].toUpperCase() : 'U'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">
                              {c.full_name || 'Customer Name Not Set'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Joined {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-mono text-[11px]">{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-mono text-[11px]">{c.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {getRoleBadge(c.role)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {c.orderCount || 0} {c.orderCount === 1 ? 'order' : 'orders'}
                        </div>
                        {c.totalSpent ? (
                          <div className="text-[11px] text-teal-600 font-semibold">
                            ${c.totalSpent.toFixed(2)} volume
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">$0.00 volume</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {location ? (
                          <div className="flex items-center gap-1 truncate max-w-xs">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{location}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No default address</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-500 hover:text-teal-600 shadow-2xs transition"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                          <span>Edit & Password</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Customer & Password Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">
                  {editingCustomer.email ? editingCustomer.email[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Profile: {editingCustomer.full_name || editingCustomer.email}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    ID: {editingCustomer.id}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {modalMessage && (
                <div
                  className={`rounded-xl border p-3 text-xs flex items-center gap-2 ${
                    modalMessage.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  {modalMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  <span>{modalMessage.text}</span>
                </div>
              )}

              {/* Profile Avatar Section */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4">
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    {editAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={editAvatarUrl}
                        alt="Customer Avatar"
                        className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-lg shadow-xs">
                        {editingCustomer.email ? editingCustomer.email[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={isUploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload customer photo"
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm hover:bg-teal-600 transition"
                    >
                      <Camera className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-bold text-slate-900">Customer Profile Photo</div>
                    <p className="text-[11px] text-slate-500">
                      Upload or change profile avatar for this customer.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarUpload(file);
                        }}
                      />
                      <button
                        type="button"
                        disabled={isUploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                      >
                        <UploadCloud className="h-3.5 w-3.5 text-teal-600" />
                        <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Image'}</span>
                      </button>
                      {editAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setEditAvatarUrl(null)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Profile Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="e.g. Alex Peter"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Role
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff Member</option>
                      <option value="manager">Fulfillment Manager</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registered Email
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingCustomer.email}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Password Management */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-teal-600" />
                    Reset Customer Password
                  </h4>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition"
                  >
                    <Sparkles className="h-3 w-3" />
                    Generate Random
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep customer's current password"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    If set, the customer&apos;s password will be updated immediately in Supabase Auth.
                  </p>
                </div>
              </div>

              {/* Default Shipping Address */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  Default Shipping Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={editAddress.address}
                      onChange={(e) => setEditAddress({ ...editAddress, address: e.target.value })}
                      placeholder="123 Retail Blvd"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Apartment / Suite
                    </label>
                    <input
                      type="text"
                      value={editAddress.apartment}
                      onChange={(e) => setEditAddress({ ...editAddress, apartment: e.target.value })}
                      placeholder="Apt 4B"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={editAddress.city}
                      onChange={(e) => setEditAddress({ ...editAddress, city: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={editAddress.postalCode}
                      onChange={(e) => setEditAddress({ ...editAddress, postalCode: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50 transition"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Customer Profile</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
