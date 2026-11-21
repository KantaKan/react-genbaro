import { Outlet } from "react-router-dom";
import { ProtectedRoute } from "../ProtectedRoute";
import { AdminShell } from "../../admin/shell/AdminShell";

export function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </ProtectedRoute>
  );
}
