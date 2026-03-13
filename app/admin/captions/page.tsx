import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function CaptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page: pageParam, search } = await searchParams;
  const supabase = await createClient();
  const page = parseInt(pageParam || '1', 10);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('captions')
    .select('id, content, created_datetime_utc, image_id, is_public, profile_id', { count: 'exact' })
    .order('created_datetime_utc', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (search) {
    query = query.ilike('content', `%${search}%`);
  }

  const { data: captions, count, error } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Captions</h1>
          <p className="text-slate-400 text-sm mt-1">
            Read-only view. {count?.toLocaleString()} total captions.
          </p>
        </div>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={search || ''}
          placeholder="Search captions..."
          className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white font-medium hover:bg-purple-700 transition"
        >
          Search
        </button>
        {search && (
          <Link
            href="/admin/captions"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-300 font-medium hover:bg-slate-600 transition"
          >
            Clear
          </Link>
        )}
      </form>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-red-300 text-sm">
          Error: {error.message}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Content</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Public</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Image ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Profile ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {(captions ?? []).map((caption) => (
              <tr key={caption.id} className="hover:bg-slate-800/50">
                <td className="px-4 py-3 text-slate-300 max-w-md">
                  <p className="truncate">{caption.content || <span className="italic text-slate-500">empty</span>}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    caption.is_public ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-600/20 text-slate-400'
                  }`}>
                    {caption.is_public ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{caption.image_id?.slice(0, 8)}...</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{caption.profile_id?.slice(0, 8)}...</td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {new Date(caption.created_datetime_utc).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/captions?page=${page - 1}${search ? `&search=${search}` : ''}`}
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
              href={`/admin/captions?page=${page + 1}${search ? `&search=${search}` : ''}`}
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
