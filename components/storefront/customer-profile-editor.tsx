'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Lock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Edit2, 
  ShieldCheck,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  UploadCloud
} from 'lucide-react';

interface CustomerProfileEditorProps {
  initialProfile: {
    id: string;
    email?: string;
    full_name?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    shipping_address?: any;
  };
  trigger?: React.ReactNode;
  defaultTab?: 'details' | 'security';
}

export function CustomerProfileEditor({ initialProfile, trigger, defaultTab = 'details' }: CustomerProfileEditorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'security'>(defaultTab);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialProfile.avatar_url || initialProfile.shipping_address?._avatar_url || null
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fullName, setFullName] = useState(initialProfile.full_name || '');
  const [phone, setPhone] = useState(initialProfile.phone || '');
  
  const initialAddress = initialProfile.shipping_address || {};
  const [streetAddress, setStreetAddress] = useState(initialAddress.address || '');
  const [apartment, setApartment] = useState(initialAddress.apartment || '');
  const [city, setCity] = useState(initialAddress.city || '');
  const [postalCode, setPostalCode] = useState(initialAddress.postalCode || '');
  const [country, setCountry] = useState(initialAddress.country || 'United States');

  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleOpen = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setNewPassword('');
    setConfirmPassword('');
    setActiveTab(defaultTab);
    setIsOpen(true);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
      setErrorMessage('Please choose a valid image file (JPEG, PNG, WebP, or AVIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit.');
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/account/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      setAvatarUrl(data.avatarUrl);
      setSuccessMessage('Profile picture uploaded successfully!');
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/account/avatar', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove image.');
      }
      setAvatarUrl(null);
      setSuccessMessage('Profile picture removed.');
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to remove profile picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate password if user entered one
    if (activeTab === 'security' || newPassword) {
      if (newPassword && newPassword.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (newPassword && newPassword !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your confirmation.');
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload: any = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl,
        shippingAddress: {
          firstName: fullName.split(' ')[0] || '',
          lastName: fullName.split(' ').slice(1).join(' ') || '',
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: streetAddress.trim(),
          apartment: apartment.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          _avatar_url: avatarUrl,
        },
      };

      if (newPassword) {
        payload.newPassword = newPassword;
      }

      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccessMessage(data.message || 'Profile updated successfully!');
      setNewPassword('');
      setConfirmPassword('');

      // Also update localStorage default address if updated
      try {
        localStorage.setItem(
          'cellura_default_address',
          JSON.stringify(payload.shippingAddress)
        );
      } catch {
        // Ignore localStorage error
      }

      setTimeout(() => {
        router.refresh();
        setIsOpen(false);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const initialLetter = initialProfile.full_name
    ? initialProfile.full_name[0].toUpperCase()
    : initialProfile.email
    ? initialProfile.email[0].toUpperCase()
    : 'U';

  return (
    <>
      {trigger ? (
        <span onClick={handleOpen} className="inline-block cursor-pointer">
          {trigger}
        </span>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 shadow-2xs transition active:scale-98"
        >
          <Edit2 className="h-3.5 w-3.5 text-teal-600" />
          <span>Edit Profile & Password</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Manage Account & Profile</h3>
                  <p className="text-[11px] text-slate-400">Update photo, contact, shipping or password</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-100 bg-slate-50/60 px-5 sm:px-6 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => { setActiveTab('details'); setErrorMessage(null); }}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition ${
                  activeTab === 'details'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Profile & Address</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('security'); setErrorMessage(null); }}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition ${
                  activeTab === 'security'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Change Password</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {activeTab === 'details' ? (
                <>
                  {/* Avatar Upload Section */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4">
                      {/* Avatar preview */}
                      <div className="relative group shrink-0">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarUrl}
                            alt="Profile"
                            className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-teal-500/20"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 text-white font-extrabold text-xl shadow-xs ring-2 ring-teal-500/20">
                            {initialLetter}
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={isUploadingAvatar}
                          onClick={() => fileInputRef.current?.click()}
                          title="Change photo"
                          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-md hover:bg-teal-600 transition"
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Camera className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-1">
                        <div className="text-xs font-bold text-slate-900">Profile Picture</div>
                        <p className="text-[11px] text-slate-500">
                          PNG, JPG, WebP up to 5MB. Visible across your account and invoices.
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
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
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
                          >
                            <UploadCloud className="h-3.5 w-3.5 text-teal-600" />
                            <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                          </button>

                          {avatarUrl && (
                            <button
                              type="button"
                              disabled={isUploadingAvatar}
                              onClick={handleRemoveAvatar}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 transition"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Personal details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Peter"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Default shipping address */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
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
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          placeholder="123 Retail Boulevard"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Apartment, Suite (Optional)
                        </label>
                        <input
                          type="text"
                          value={apartment}
                          onChange={(e) => setApartment(e.target.value)}
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
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Enter your desired new password below. Passwords must be at least 6 characters long.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingAvatar}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50 transition"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
