import { Outlet, useLocation } from "react-router-dom";
import Page from "../../app/dashboard/page";
import { ProtectedRoute } from "../ProtectedRoute";
import { useAuth } from "../../AuthContext";
import type { UserRole } from "../../types/auth";
import { LearnerShell, usePageHeader } from "../../learner/shell/LearnerShell";
import { NAV } from "../../learner/shell/nav";

type AuthedPageLayoutProps = {
  allowedRoles: UserRole[];
};

const EXTRA_TITLES: [string, string][] = [
  ["/profile/", "Profile"],
  ["/talk-board", "Talk Board"],
  ["/tools", "Tools"],
];

/** Shared pages (Talk Board, Stamp Board, games…) don't set a title, so name them from the nav. */
function RouteTitle() {
  const { pathname } = useLocation();
  const nav = NAV.find((n) => n.to !== "/learner" && (pathname === n.to || pathname.startsWith(`${n.to}/`)));
  const title = nav?.label ?? EXTRA_TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "";
  usePageHeader({ title });
  return null;
}

export function AuthedPageLayout({ allowedRoles }: AuthedPageLayoutProps) {
  const { userRole } = useAuth();
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      {userRole === "learner" ? (
        // Learners stay in the new learner shell everywhere, not just under /learner.
        <LearnerShell>
          <RouteTitle />
          <Outlet />
        </LearnerShell>
      ) : (
        <Page>
          <Outlet />
        </Page>
      )}
    </ProtectedRoute>
  );
}
