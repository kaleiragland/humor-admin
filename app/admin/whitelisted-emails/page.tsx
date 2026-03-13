'use client';

import { Suspense } from 'react';
import CrudTable from '@/app/components/CrudTable';
import type { ColumnDef } from '@/app/components/CrudTable';

const columns: ColumnDef[] = [
  { key: 'id', label: 'ID', type: 'number', editable: false },
  { key: 'email_address', label: 'Email Address', type: 'email', required: true },
  { key: 'created_datetime_utc', label: 'Created', editable: false },
  { key: 'modified_datetime_utc', label: 'Modified', editable: false },
];

export default function WhitelistedEmailsPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 p-8">Loading...</div>}>
      <CrudTable
        tableName="whitelist_email_addresses"
        title="Whitelisted Emails"
        subtitle="Manage whitelisted email addresses."
        columns={columns}
        basePath="/admin/whitelisted-emails"
        searchColumn="email_address"
      />
    </Suspense>
  );
}
