import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface ReadOnlyTableProps {
  tableName: string;
  title: string;
  subtitle?: string;
  pageSize?: number;
  searchColumn?: string;
  orderBy?: string;
  excludeColumns?: string[];
  searchParams: { page?: string; search?: string };
}

export default async function ReadOnlyTable({
  tableName,
  title,
  subtitle,
  pageSize = 25,
  searchColumn,
  orderBy = 'created_datetime_utc',
  excludeColumns = ['embedding'],
  searchParams,
}: ReadOnlyTableProps) {
  const supabase = await createClient();
  const page = parseInt(searchParams.page || '1', 10);
  const offset = (page - 1) * pageSize;
  const search = searchParams.search;

  let query = supabase
    .from(tableName)
    .select('*', { count: 'exact' })
    .range(offset, offset + pageSize - 1);

  // Try ordering, but don't fail if column doesn't exist
  try {
    query = query.order(orderBy, { ascending: false });
  } catch {
    // fallback: no ordering
  }

  if (search && searchColumn) {
    query = query.ilike(searchColumn, `%${search}%`);
  }

  const { data: rows, count, error } = await query;
  const totalPages = Math.ceil((count ?? 0) / pageSize);
  const basePath = `/admin/${tableName.replace(/_/g, '-')}`;

  // Get columns from first row, excluding specified columns
  const columns = rows && rows.length > 0
    ? Object.keys(rows[0]).filter(k => !excludeColumns.includes(k))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="text-slate-400 text-sm mt-1">
          {subtitle || 'Read-only view.'} {count?.toLocaleString()} total rows.
        </p>
      </div>

      {searchColumn && (
        <form className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search || ''}
            placeholder={`Search by ${searchColumn}...`}
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
              href={basePath}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-300 font-medium hover:bg-slate-600 transition"
            >
              Clear
            </Link>
          )}
        </form>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-red-300 text-sm">
          Error: {error.message}
        </div>
      )}

      {(!rows || rows.length === 0) ? (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-12 text-center">
          <p className="text-slate-400">No data found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                {columns.map((key) => (
                  <th key={key} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {key.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {rows.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-slate-800/50">
                  {columns.map((key) => (
                    <td key={key} className="px-4 py-3 text-slate-300 max-w-xs truncate">
                      {row[key] === null ? (
                        <span className="text-slate-600 italic">null</span>
                      ) : typeof row[key] === 'boolean' ? (
                        <span className={row[key] ? 'text-emerald-400' : 'text-red-400'}>
                          {String(row[key])}
                        </span>
                      ) : typeof row[key] === 'object' ? (
                        <span className="text-slate-500 font-mono text-xs">
                          {JSON.stringify(row[key]).slice(0, 80)}
                        </span>
                      ) : (
                        String(row[key])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`${basePath}?page=${page - 1}${search ? `&search=${search}` : ''}`}
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
              href={`${basePath}?page=${page + 1}${search ? `&search=${search}` : ''}`}
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
