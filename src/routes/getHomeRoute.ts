import type { UserRole } from "../types/auth";

export function getHomeRoute(
  isAuthenticated: boolean,
  userRole: UserRole | null
): string {
  if (!isAuthenticated) return "/login";
  if (userRole === "learner") return "/learner";
  return "/admin";
}

