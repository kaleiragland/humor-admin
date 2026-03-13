'use client';

import { Suspense } from 'react';
import CrudTable from '@/app/components/CrudTable';
import type { ColumnDef } from '@/app/components/CrudTable';

const columns: ColumnDef[] = [
  { key: 'id', label: 'ID', type: 'number', editable: false },
  { key: 'humor_flavor_id', label: 'Humor Flavor ID', type: 'number' },
  { key: 'caption_count', label: 'Caption Count', type: 'number' },
  { key: 'created_datetime_utc', label: 'Created', editable: false },
];

export default function HumorMixPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 p-8">Loading...</div>}>
      <CrudTable
        tableName="humor_flavor_mix"
        title="Humor Mix"
        subtitle="Read and update humor mix settings."
        columns={columns}
        basePath="/admin/humor-mix"
        canCreate={false}
        canDelete={false}
        canUpdate={true}
      />
    </Suspense>
  );
}
