import { Outlet } from "react-router-dom";
import Page from "../../app/dashboard/page";
import { ProtectedRoute } from "../ProtectedRoute";

export function AdminLayout() {
  return (
    <Page>
      <ProtectedRoute allowedRoles={["admin"]}>
        <Outlet />
      </ProtectedRoute>
    </Page>
  );
}

