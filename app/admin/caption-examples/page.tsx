'use client';

import { Suspense } from 'react';
import CrudTable from '@/app/components/CrudTable';
import type { ColumnDef } from '@/app/components/CrudTable';

const columns: ColumnDef[] = [
  { key: 'id', label: 'ID', type: 'number', editable: false },
  { key: 'image_description', label: 'Image Description', type: 'textarea' },
  { key: 'caption', label: 'Caption', type: 'textarea', required: true },
  { key: 'explanation', label: 'Explanation', type: 'textarea' },
  { key: 'priority', label: 'Priority', type: 'number' },
  { key: 'image_id', label: 'Image ID', type: 'text' },
  { key: 'created_datetime_utc', label: 'Created', editable: false },
  { key: 'modified_datetime_utc', label: 'Modified', editable: false },
];

export default function CaptionExamplesPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 p-8">Loading...</div>}>
      <CrudTable
        tableName="caption_examples"
        title="Caption Examples"
        subtitle="Manage caption examples for LLM training."
        columns={columns}
        searchColumn="caption"
      />
    </Suspense>
  );
}
