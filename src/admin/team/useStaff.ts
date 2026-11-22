import { useQuery } from "react-query";
import { adminApi } from "../api";
import { can, type Capability, type StaffRole } from "./perm";

/** The signed-in staff member. Until /admin/me answers, treat as Owner (nothing hidden; the server still enforces). */
export function useStaff() {
  const q = useQuery(["admin-me"], () => adminApi.me(), { staleTime: 5 * 60_000, retry: false });
  const role: StaffRole = q.data?.staff_role ?? "owner";
  return {
    role,
    known: !!q.data,
    cohorts: q.data?.cohorts ?? [],
    groups: q.data?.groups ?? [],
    can: (c: Capability) => can(role, c),
  };
}
