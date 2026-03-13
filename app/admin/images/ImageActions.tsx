'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ImageActions({ imageId }: { imageId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this image? This cannot be undone.')) return;

    const supabase = createClient();
    const { error } = await supabase.from('images').delete().eq('id', imageId);

    if (error) {
      alert(`Delete failed: ${error.message}`);
      return;
    }

    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg bg-red-600/20 border border-red-600/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-600/30 transition"
    >
      Delete
    </button>
  );
}
