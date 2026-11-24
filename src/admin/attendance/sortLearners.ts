import type { RegisterLearner } from "../types";

export type SortKey = "name" | "group" | "week" | "leave";
export type SortDir = "asc" | "desc";

const nameOf = (l: RegisterLearner) => (l.zoom_name || l.first_name || "").toLowerCase();

/** Register rows sorted by a column; ties fall back to the learner's number so the order is stable. */
export function sortLearners(list: RegisterLearner[], key: SortKey, dir: SortDir): RegisterLearner[] {
  const val = (l: RegisterLearner): string | number =>
    key === "group" ? (l.genmate_group || "~").toLowerCase() : key === "week" ? l.week_rate : key === "leave" ? l.leave_used : nameOf(l);
  const sign = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const x = val(a), y = val(b);
    const c = x < y ? -1 : x > y ? 1 : 0;
    return c !== 0 ? c * sign : a.jsd_number.localeCompare(b.jsd_number, undefined, { numeric: true });
  });
}

/** Learners whose name, nickname or number contains the search text. */
export function matchLearner(l: RegisterLearner, q: string): boolean {
  const s = q.trim().toLowerCase();
  return !s || `${l.zoom_name} ${l.first_name} ${l.last_name} ${l.jsd_number}`.toLowerCase().includes(s);
}
