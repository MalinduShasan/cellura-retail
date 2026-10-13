'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, Loader2, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUploader({ value, onChange, label = 'Device Image' }: ImageUploaderProps) {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      if (data.url) {
        onChange(data.url);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">{label}</label>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold transition ${
              tab === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="h-3 w-3" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold transition ${
              tab === 'url' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="h-3 w-3" />
            URL
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-[11px] text-rose-700 font-medium">
          ⚠️ {uploadError}
        </div>
      )}

      {/* Preview if image is present */}
      {value ? (
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2 flex items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Image Attached</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">{value}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            title="Remove image"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          {tab === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${
                isDragOver
                  ? 'border-teal-500 bg-teal-50/50'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {isUploading ? (
                <div className="py-2 flex flex-col items-center justify-center text-teal-600 gap-1.5">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs font-semibold">Uploading to Supabase Storage...</span>
                </div>
              ) : (
                <div className="py-1 flex flex-col items-center justify-center gap-1 text-slate-500">
                  <UploadCloud className="h-6 w-6 text-teal-600" />
                  <span className="text-xs font-bold text-slate-700">
                    Click to browse or drag and drop image
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Supports PNG, JPG, WebP (up to 10MB)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
