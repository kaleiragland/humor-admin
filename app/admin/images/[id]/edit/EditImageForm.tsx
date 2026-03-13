'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ImageData {
  id: string;
  url: string;
  is_public: boolean;
  is_common_use: boolean;
  image_description: string | null;
  additional_context: string | null;
  profile_id: string | null;
  created_datetime_utc: string;
}

export default function EditImageForm({ image }: { image: ImageData }) {
  const router = useRouter();
  const [url, setUrl] = useState(image.url);
  const [isPublic, setIsPublic] = useState(image.is_public);
  const [isCommonUse, setIsCommonUse] = useState(image.is_common_use);
  const [description, setDescription] = useState(image.image_description || '');
  const [context, setContext] = useState(image.additional_context || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('images')
      .update({
        url: url.trim(),
        is_public: isPublic,
        is_common_use: isCommonUse,
        image_description: description.trim() || null,
        additional_context: context.trim() || null,
        modified_datetime_utc: new Date().toISOString(),
      })
      .eq('id', image.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Link
          href="/admin/images"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
        >
          Back
        </Link>
        <h1 className="text-3xl font-bold text-white">Edit Image</h1>
      </div>

      <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt="Current image" className="max-h-64 rounded-lg mx-auto" />
        <p className="text-xs text-slate-500 font-mono text-center mt-2">{image.id}</p>
        <p className="text-xs text-slate-500 text-center">
          Created: {new Date(image.created_datetime_utc).toLocaleString()} | Owner: {image.profile_id?.slice(0, 8)}...
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-red-300 text-sm">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/50 p-4 text-emerald-300 text-sm">
          Image updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl bg-slate-800/50 border border-slate-700 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Image URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Additional Context</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={2}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
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

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm text-white font-medium hover:bg-purple-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Update Image'}
        </button>
      </form>
    </>
  );
}
