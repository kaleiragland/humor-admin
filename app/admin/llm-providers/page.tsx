'use client';

import { Suspense } from 'react';
import CrudTable from '@/app/components/CrudTable';
import type { ColumnDef } from '@/app/components/CrudTable';

const columns: ColumnDef[] = [
  { key: 'id', label: 'ID', type: 'number', editable: false },
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'created_datetime_utc', label: 'Created', editable: false },
];

export default function LlmProvidersPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 p-8">Loading...</div>}>
      <CrudTable
        tableName="llm_providers"
        title="LLM Providers"
        subtitle="Manage LLM provider configurations."
        columns={columns}
        searchColumn="name"
      />
    </Suspense>
  );
}
