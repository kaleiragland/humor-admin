'use client';

import { Suspense } from 'react';
import CrudTable from '@/app/components/CrudTable';
import type { ColumnDef } from '@/app/components/CrudTable';

const columns: ColumnDef[] = [
  { key: 'id', label: 'ID', type: 'number', editable: false },
  { key: 'apex_domain', label: 'Apex Domain', type: 'text', required: true },
  { key: 'created_datetime_utc', label: 'Created', editable: false },
];

export default function AllowedSignupDomainsPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 p-8">Loading...</div>}>
      <CrudTable
        tableName="allowed_signup_domains"
        title="Allowed Signup Domains"
        subtitle="Manage domains allowed for user signup."
        columns={columns}
        searchColumn="apex_domain"
      />
    </Suspense>
  );
}
