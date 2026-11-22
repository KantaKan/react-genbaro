import { api } from "@/infrastructure/api";
import type { LearnerRef } from "../wellbeing";

type Envelope<T> = { data: T };
const data = async <T,>(p: Promise<{ data: Envelope<T> }>) => (await p).data.data;

export type KPI = { value: number; prev: number; trend: number[] };
export type Tally = { on_time: number; late: number; leave: number; absent: number; not_yet: number };
export type Report = {
  week: string;
  week_end: string;
  summary: string;
  kpis: { attendance: KPI; lates: KPI; reflections: KPI; rough: KPI };
  reflections_written: number;
  mood: { day: string; holiday: boolean; comfort: number; enjoying: number; overwhelmed: number; panic: number; none: number }[];
  by_day: { day: string; holiday: boolean; am: Tally; pm: Tally }[];
  support: { learner: LearnerRef; status: "new" | "still" | "better"; reasons: string[] }[];
  groups: { group: string; attendance: number; rough: number; cup: number }[];
  notes: string;
  status: "draft" | "sent";
  sent_at?: string;
};
export type SendResult = { status: string; sent_to_slack: boolean; slack_error?: string };

export const reportApi = {
  get: (cohort: number, week: string) => data<Report>(api.get(`/admin/report?cohort=${cohort}&week=${week}`)),
  saveNotes: (cohort: number, week: string, notes: string) => api.put(`/admin/report/notes?cohort=${cohort}`, { week, notes }).then(() => undefined),
  send: (cohort: number, week: string) => data<SendResult>(api.post(`/admin/report/send?cohort=${cohort}`, { week })),
};
