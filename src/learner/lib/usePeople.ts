import { useQuery } from "react-query";
import { learnerApi } from "../api";

/** Cached cohort list, shared by Classmates, Talk Board and recommendations. */
export function usePeople() {
  const q = useQuery(["cohort-people"], learnerApi.getCohortPeople, { staleTime: 60_000 });
  const list = q.data ?? [];
  const byId = new Map(list.map((p) => [p._id, p]));
  return { list, byId, isLoading: q.isLoading };
}

/** Only http(s) links are rendered. */
export const safeUrl = (u?: string) => (u && /^https?:\/\//i.test(u.trim()) ? u.trim() : undefined);
