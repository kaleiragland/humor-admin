'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export interface ColumnDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'boolean' | 'textarea' | 'url' | 'email' | 'json';
  required?: boolean;
  editable?: boolean;
  defaultValue?: unknown;
}

interface CrudTableProps {
  tableName: string;
  title: string;
  subtitle?: string;
  columns: ColumnDef[];
  idField?: string;
  basePath?: string;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  pageSize?: number;
  orderBy?: string;
  searchColumn?: string;
}

export default function CrudTable({
  tableName,
  title,
  subtitle,
  columns,
  idField = 'id',
  basePath,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
  pageSize = 25,
  orderBy = 'created_datetime_utc',
  searchColumn,
}: CrudTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [creatingRow, setCreatingRow] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const totalPages = Math.ceil(count / pageSize);
  const resolvedBasePath = basePath || `/admin/${tableName.replace(/_/g, '-')}`;
  const selectFields = columns.map(c => c.key).join(', ') + (columns.some(c => c.key === idField) ? '' : `, ${idField}`);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from(tableName)
      .select(selectFields, { count: 'exact' })
      .range(offset, offset + pageSize - 1)
      .order(orderBy, { ascending: false });

    if (search && searchColumn) {
      query = query.ilike(searchColumn, `%${search}%`);
    }

    const { data, count: totalCount, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      // Try without ordering if column doesn't exist
      if (fetchError.message.includes(orderBy)) {
        const retryQuery = supabase
          .from(tableName)
          .select(selectFields, { count: 'exact' })
          .range(offset, offset + pageSize - 1);
        const { data: retryData, count: retryCount, error: retryError } = await retryQuery;
        if (!retryError) {
          setRows((retryData as unknown as Record<string, unknown>[]) || []);
          setCount(retryCount ?? 0);
          setError('');
        }
      }
    } else {
      setRows((data as unknown as Record<string, unknown>[]) || []);
      setCount(totalCount ?? 0);
    }
    setLoading(false);
  }, [page, pageSize, tableName, selectFields, orderBy, search, searchColumn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    const defaults: Record<string, unknown> = {};
    columns.filter(c => c.editable !== false).forEach(c => {
      defaults[c.key] = c.defaultValue ?? (c.type === 'boolean' ? false : '');
    });
    setFormData(defaults);
    setCreatingRow(true);
    setEditingRow(null);
  };

  const openEdit = (row: Record<string, unknown>) => {
    const data: Record<string, unknown> = {};
    columns.filter(c => c.editable !== false).forEach(c => {
      data[c.key] = row[c.key] ?? (c.type === 'boolean' ? false : '');
    });
    setFormData(data);
    setEditingRow(row);
    setCreatingRow(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const supabase = createClient();

    const payload: Record<string, unknown> = {};
    columns.filter(c => c.editable !== false).forEach(c => {
      let val = formData[c.key];
      if (c.type === 'number') val = val === '' ? null : Number(val);
      if (c.type === 'json' && typeof val === 'string') {
        try { val = JSON.parse(val as string); } catch { /* keep as string */ }
      }
      if (val === '') val = null;
      payload[c.key] = val;
    });

    if (creatingRow) {
      const { error: insertError } = await supabase.from(tableName).insert(payload);
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    } else if (editingRow) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update(payload)
        .eq(idField, editingRow[idField] as string);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setCreatingRow(false);
    setEditingRow(null);
    fetchData();
  };

  const handleDelete = async (row: Record<string, unknown>) => {
    if (!confirm('Are you sure you want to delete this row? This cannot be undone.')) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq(idField, row[idField] as string);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    fetchData();
  };

  const closeModal = () => {
    setCreatingRow(false);
    setEditingRow(null);
    setFormData({});
  };

  const renderFormField = (col: ColumnDef) => {
    if (col.editable === false) return null;
    const value = formData[col.key] ?? '';

    if (col.type === 'boolean') {
      return (
        <label key={col.key} className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={!!formData[col.key]}
            onChange={(e) => setFormData({ ...formData, [col.key]: e.target.checked })}
            className="rounded"
          />
          {col.label}
        </label>
      );
    }

    if (col.type === 'textarea' || col.type === 'json') {
      return (
        <div key={col.key}>
          <label className="block text-sm font-medium text-slate-300 mb-1">{col.label}{col.required && ' *'}</label>
          <textarea
            value={String(value)}
            onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
            rows={3}
            required={col.required}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
      );
    }

    return (
      <div key={col.key}>
        <label className="block text-sm font-medium text-slate-300 mb-1">{col.label}{col.required && ' *'}</label>
        <input
          type={col.type === 'number' ? 'number' : col.type === 'url' ? 'url' : col.type === 'email' ? 'email' : 'text'}
          value={String(value)}
          onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
          required={col.required}
          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
        />
      </div>
    );
  };

  const renderCellValue = (value: unknown) => {
    if (value === null || value === undefined) return <span className="text-slate-600 italic">null</span>;
    if (typeof value === 'boolean') return <span className={value ? 'text-emerald-400' : 'text-red-400'}>{String(value)}</span>;
    if (typeof value === 'object') return <span className="text-slate-500 font-mono text-xs">{JSON.stringify(value).slice(0, 80)}</span>;
    const str = String(value);
    return str.length > 80 ? str.slice(0, 80) + '...' : str;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {subtitle || `Manage ${title.toLowerCase()}.`} {count.toLocaleString()} total rows.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white font-medium hover:bg-emerald-700 transition"
          >
            + New
          </button>
        )}
      </div>

      {searchColumn && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); router.push(`${resolvedBasePath}?search=${fd.get('search')}`); }}>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder={`Search by ${searchColumn}...`}
            className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button type="submit" className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white font-medium hover:bg-purple-700 transition">
            Search
          </button>
          {search && (
            <Link href={resolvedBasePath} className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-300 font-medium hover:bg-slate-600 transition">
              Clear
            </Link>
          )}
        </form>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-red-300 text-sm">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-12 text-center">
          <p className="text-slate-400">Loading...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-12 text-center">
          <p className="text-slate-400">No data found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                {(canUpdate || canDelete) && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {rows.map((row, i) => (
                <tr key={(row[idField] as string) || i} className="hover:bg-slate-800/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-slate-300 max-w-xs truncate">
                      {renderCellValue(row[col.key])}
                    </td>
                  ))}
                  {(canUpdate || canDelete) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        {canUpdate && (
                          <button
                            onClick={() => openEdit(row)}
                            className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-600 transition"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(row)}
                            className="rounded-lg bg-red-600/20 border border-red-600/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-600/30 transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
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
              href={`${resolvedBasePath}?page=${page - 1}${search ? `&search=${search}` : ''}`}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`${resolvedBasePath}?page=${page + 1}${search ? `&search=${search}` : ''}`}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
            >
              Next
            </Link>
          )}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {(creatingRow || editingRow) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <h2 className="text-xl font-bold text-white">
              {creatingRow ? `New ${title.replace(/s$/, '')}` : `Edit ${title.replace(/s$/, '')}`}
            </h2>

            {error && (
              <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {columns.filter(c => c.editable !== false).map(renderFormField)}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2.5 text-sm text-white font-medium hover:bg-purple-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : creatingRow ? 'Create' : 'Update'}
              </button>
              <button
                onClick={closeModal}
                className="rounded-lg bg-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
