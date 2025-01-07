import React from "react";
import AdminReflectionsTable from "./admin-reflections-table";

export function AdminTablePage() {
  return (
    <div className="flex flex-col gap-2 overflow-hidden p-6">
      <h3 className="text-5xl font-bold">All User Reflections</h3>
      <AdminReflectionsTable />
    </div>
  );
}
