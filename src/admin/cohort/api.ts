import { api } from "@/infrastructure/api";
import type { CheckinRules } from "@/learner/types";

export type CohortSettings = {
  cohort_number: number;
  rules: CheckinRules;
  allowed_networks: string[];
  group_chat_urls?: Record<string, string>;
  start_date?: string;
  course_days?: number;
  checkin_region?: "anywhere" | "thailand";
  flag_unusual?: boolean;
};
export type Activity = { id: string; actor_name: string; actor_role: string; action: string; detail: string; status: number; at: string; targets?: string[]; facts?: Record<string, string> };

const data = async <T,>(p: Promise<{ data: { data: T } }>): Promise<T> => (await p).data.data;

export const cohortApi = {
  settings: (cohort: number) => data<CohortSettings>(api.get(`/admin/cohorts/${cohort}/settings`)),
  saveSettings: (cohort: number, s: CohortSettings) => data<CohortSettings>(api.put(`/admin/cohorts/${cohort}/settings`, s)),
  moveGroups: async (cohort: number, moves: { user_id: string; group: string }[]) => {
    await api.put(`/admin/cohorts/${cohort}/groups`, { moves });
  },
  create: async (p: { cohort_number: number; start_date: string; course_days: number }) => {
    await api.post("/admin/cohorts", p);
  },
  activity: (page: number) => data<{ items: Activity[]; total: number; page: number }>(api.get(`/admin/activity?page=${page}`)),
};
