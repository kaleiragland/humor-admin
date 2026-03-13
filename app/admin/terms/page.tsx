'use client';

import { Suspense } from 'react';
import CrudTable from '@/app/components/CrudTable';
import type { ColumnDef } from '@/app/components/CrudTable';

const columns: ColumnDef[] = [
  { key: 'id', label: 'ID', type: 'number', editable: false },
  { key: 'term', label: 'Term', type: 'text', required: true },
  { key: 'definition', label: 'Definition', type: 'textarea', required: true },
  { key: 'example', label: 'Example', type: 'textarea' },
  { key: 'priority', label: 'Priority', type: 'number' },
  { key: 'term_type_id', label: 'Term Type ID', type: 'number' },
  { key: 'created_datetime_utc', label: 'Created', editable: false },
  { key: 'modified_datetime_utc', label: 'Modified', editable: false },
];

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 p-8">Loading...</div>}>
      <CrudTable
        tableName="terms"
        title="Terms"
        subtitle="Manage terms and definitions."
        columns={columns}
        searchColumn="term"
      />
    </Suspense>
  );
}
