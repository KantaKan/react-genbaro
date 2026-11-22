/** Mirror of the backend role table (baro-gofiber internal/service/staff/perm.go). The backend enforces; this only hides. */
export type StaffRole = "owner" | "admin" | "ta" | "viewer";
export type Capability = "view" | "mark" | "leave" | "care" | "cup" | "announce" | "gifts" | "cohort_admin" | "report_notes" | "team" | "create_cohort";

const TABLE: Record<Exclude<StaffRole, "owner">, Capability[]> = {
  admin: ["view", "mark", "leave", "care", "cup", "announce", "gifts", "cohort_admin", "report_notes"],
  ta: ["view", "mark", "leave", "care", "cup", "announce", "report_notes"],
  viewer: ["view"],
};

export function can(role: StaffRole, cap: Capability): boolean {
  return role === "owner" || (TABLE[role]?.includes(cap) ?? false);
}

export const ROLE_LABEL: Record<StaffRole, string> = { owner: "Owner", admin: "Admin", ta: "TA", viewer: "Viewer" };
