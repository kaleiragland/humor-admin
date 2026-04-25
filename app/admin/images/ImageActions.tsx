'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ImageActions({ imageId }: { imageId: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const friendlyDeleteError = (message: string): string => {
    if (/foreign key constraint/i.test(message)) {
      return "Can't delete this image because it's still referenced by other records (e.g. captions or caption requests). Remove those first.";
    }
    return message;
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this image? This cannot be undone.')) return;

    setDeleting(true);
    setError('');
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('images').delete().eq('id', imageId);

    if (deleteError) {
      setError(friendlyDeleteError(deleteError.message));
      setDeleting(false);
      return;
    }

    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-lg bg-red-600/20 border border-red-600/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-600/30 disabled:opacity-50 transition"
      >
        {deleting ? 'Deleting...' : 'Delete'}
      </button>
      {error && (
        <p className="text-xs text-red-400 max-w-xs text-right">{error}</p>
      )}
    </div>
  );
}
