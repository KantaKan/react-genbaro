import { Outlet } from "react-router-dom";
import Page from "../../app/dashboard/page";
import { ProtectedRoute } from "../ProtectedRoute";
import type { UserRole } from "../../types/auth";

type AuthedPageLayoutProps = {
  allowedRoles: UserRole[];
};

export function AuthedPageLayout({ allowedRoles }: AuthedPageLayoutProps) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Page>
        <Outlet />
      </Page>
    </ProtectedRoute>
  );
}

