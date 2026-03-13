import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ImageActions from './ImageActions';

export default async function ImagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const { page: pageParam, filter } = await searchParams;
  const supabase = await createClient();
  const page = parseInt(pageParam || '1', 10);
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('images')
    .select('id, url, created_datetime_utc, is_public, is_common_use, profile_id, image_description', { count: 'exact' })
    .order('created_datetime_utc', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (filter === 'public') query = query.eq('is_public', true);
  if (filter === 'private') query = query.eq('is_public', false);
  if (filter === 'common') query = query.eq('is_common_use', true);

  const { data: images, count, error } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Images</h1>
          <p className="text-slate-400 text-sm mt-1">
            {count?.toLocaleString()} total images. Full CRUD management.
          </p>
        </div>
        <Link
          href="/admin/images/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white font-medium hover:bg-emerald-700 transition"
        >
          + Add Image
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { label: 'All', value: '' },
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
          { label: 'Common Use', value: 'common' },
        ].map((f) => (
          <Link
            key={f.value}
            href={`/admin/images${f.value ? `?filter=${f.value}` : ''}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              (filter || '') === f.value
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-red-300 text-sm">
          Error: {error.message}
        </div>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(images ?? []).map((image) => (
          <div
            key={image.id}
            className="rounded-xl bg-slate-800/50 border border-slate-700 overflow-hidden group"
          >
            <div className="relative aspect-video bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Uploaded image"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                {image.is_public && (
                  <span className="bg-emerald-600/80 text-white text-xs px-2 py-0.5 rounded-full">Public</span>
                )}
                {image.is_common_use && (
                  <span className="bg-blue-600/80 text-white text-xs px-2 py-0.5 rounded-full">Common</span>
                )}
              </div>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-xs text-slate-500 font-mono truncate">ID: {image.id}</p>
              <p className="text-xs text-slate-400 truncate">
                {image.image_description?.slice(0, 100) || 'No description'}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(image.created_datetime_utc).toLocaleDateString()}
              </p>
              <div className="flex gap-2 pt-2">
                <Link
                  href={`/admin/images/${image.id}/edit`}
                  className="flex-1 rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-300 text-center hover:bg-slate-600 transition"
                >
                  Edit
                </Link>
                <ImageActions imageId={image.id} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {(images ?? []).length === 0 && !error && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-12 text-center">
          <p className="text-slate-400">No images found.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/images?page=${page - 1}${filter ? `&filter=${filter}` : ''}`}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/images?page=${page + 1}${filter ? `&filter=${filter}` : ''}`}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
