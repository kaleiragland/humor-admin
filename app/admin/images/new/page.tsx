'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewImagePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCommonUse, setIsCommonUse] = useState(false);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    setSaving(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from('images').insert({
      url: url.trim(),
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
      return;
    }

    router.push('/admin/images');
    router.refresh();
  };

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
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Image URL *</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            placeholder="https://..."
          />
        </div>

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

        {url && (
          <div className="rounded-lg bg-slate-900 p-4">
            <p className="text-xs text-slate-500 mb-2">Preview:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Preview" className="max-h-48 rounded-lg mx-auto" />
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm text-white font-medium hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Create Image'}
        </button>
      </form>
    </div>
  );
}
