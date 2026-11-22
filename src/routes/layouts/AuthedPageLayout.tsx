import { Outlet, useLocation } from "react-router-dom";
import { ProtectedRoute } from "../ProtectedRoute";
import { useAuth } from "../../AuthContext";
import type { UserRole } from "../../types/auth";
import { LearnerShell, usePageHeader } from "../../learner/shell/LearnerShell";
import { NAV } from "../../learner/shell/nav";
import { AdminShell, useAdminHeader } from "../../admin/shell/AdminShell";

type AuthedPageLayoutProps = {
  allowedRoles: UserRole[];
};

const EXTRA_TITLES: [string, string][] = [
  ["/profile/", "Profile"],
  ["/talk-board", "Talk Board"],
  ["/tools", "Tools"],
  ["/character", "Baro Characters"],
  ["/showcase-lawn", "Showcase Lawn"],
  ["/startup-story", "Startup Story"],
  ["/stamp-board", "Stamp Board"],
];

const titleFor = (pathname: string) => {
  const nav = NAV.find((n) => n.to !== "/learner" && (pathname === n.to || pathname.startsWith(`${n.to}/`)));
  return nav?.label ?? EXTRA_TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "";
};

/** Shared pages (Talk Board, Stamp Board, games…) don't set a title, so name them from the nav. */
function RouteTitle() {
  usePageHeader({ title: titleFor(useLocation().pathname) });
  return null;
}

function AdminRouteTitle() {
  useAdminHeader({ title: titleFor(useLocation().pathname) });
  return null;
}

/** Shared pages keep each person in their own shell: learners in the learner shell, staff in the admin one. */
export function AuthedPageLayout({ allowedRoles }: AuthedPageLayoutProps) {
  const { userRole } = useAuth();
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      {userRole === "learner" ? (
        <LearnerShell>
          <RouteTitle />
          <Outlet />
        </LearnerShell>
      ) : (
        <AdminShell>
          <AdminRouteTitle />
          <Outlet />
        </AdminShell>
      )}
    </ProtectedRoute>
  );
}
