'use client';

import { Suspense } from 'react';
import CrudTable from '@/app/components/CrudTable';
import type { ColumnDef } from '@/app/components/CrudTable';

const columns: ColumnDef[] = [
  { key: 'id', label: 'ID', type: 'number', editable: false },
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'llm_provider_id', label: 'Provider ID', type: 'number', required: true },
  { key: 'provider_model_id', label: 'Provider Model Name', type: 'text', required: true },
  { key: 'is_temperature_supported', label: 'Temp Supported', type: 'boolean', defaultValue: true },
  { key: 'created_datetime_utc', label: 'Created', editable: false },
];

export default function LlmModelsPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 p-8">Loading...</div>}>
      <CrudTable
        tableName="llm_models"
        title="LLM Models"
        subtitle="Manage LLM model configurations."
        columns={columns}
        searchColumn="name"
      />
    </Suspense>
  );
}
