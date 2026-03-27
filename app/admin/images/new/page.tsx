'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type UploadMode = 'file' | 'url';

export default function NewImagePage() {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>('file');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isCommonUse, setIsCommonUse] = useState(false);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB');
      return;
    }

    setFile(selected);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    if (!dropped.type.startsWith('image/')) {
      setError('Please drop an image file');
      return;
    }

    if (dropped.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB');
      return;
    }

    setFile(dropped);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target?.result as string);
    reader.readAsDataURL(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'url' && !url.trim()) {
      setError('URL is required');
      return;
    }

    if (mode === 'file' && !file) {
      setError('Please select an image file');
      return;
    }

    setSaving(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let imageUrl = url.trim();

    if (mode === 'file' && file) {
      setUploadProgress('Uploading image...');
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        setSaving(false);
        setUploadProgress('');
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
      setUploadProgress('Saving record...');
    }

    const { error: insertError } = await supabase.from('images').insert({
      url: imageUrl,
      is_public: isPublic,
      is_common_use: isCommonUse,
      image_description: description.trim() || null,
      profile_id: user?.id,
      created_by_user_id: user?.id,
      modified_by_user_id: user?.id,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      setUploadProgress('');
      return;
    }

    router.push('/admin/images');
    router.refresh();
  };

  const previewUrl = mode === 'file' ? filePreview : url;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/images"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
        >
          Back
        </Link>
        <h1 className="text-3xl font-bold text-white">Add Image</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl bg-slate-800/50 border border-slate-700 p-6 space-y-4">
        {/* Upload mode toggle */}
        <div className="flex rounded-lg bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              mode === 'file'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              mode === 'url'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Paste URL
          </button>
        </div>

        {mode === 'file' ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="space-y-2">
                <p className="text-sm text-emerald-400 font-medium">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-slate-500">Click or drop to replace</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl text-slate-600">+</div>
                <p className="text-sm text-slate-400">
                  Drag and drop an image here, or click to browse
                </p>
                <p className="text-xs text-slate-500">Max 10MB</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Image URL *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              placeholder="https://..."
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            placeholder="Image description..."
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded"
            />
            Public
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={isCommonUse}
              onChange={(e) => setIsCommonUse(e.target.checked)}
              className="rounded"
            />
            Common Use
          </label>
        </div>

        {previewUrl && (
          <div className="rounded-lg bg-slate-900 p-4">
            <p className="text-xs text-slate-500 mb-2">Preview:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg mx-auto" />
          </div>
        )}

        {uploadProgress && (
          <p className="text-sm text-purple-400 text-center">{uploadProgress}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm text-white font-medium hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {saving ? (uploadProgress || 'Saving...') : 'Create Image'}
        </button>
      </form>
    </div>
  );
}
