import React from 'react';
import AdminReflectionsTable from './admin-reflections-table';

export function AdminTablePage() {
  return (
    <div className="flex flex-col gap-2 overflow-hidden p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Reflections Table</h1>
      <AdminReflectionsTable />
    </div>
  );
}

