import { api } from "@/infrastructure/api";
import type { AttendanceStatusType } from "@/domain/types/attendance";
import type { AvatarConfig } from "@/learner/avatar/types";
import type { ZoneId } from "@/learner/today/BarometerFace";

export type Zone = ZoneId | "";
export type LearnerRef = { id: string; first_name: string; zoom_name: string; jsd_number: string; genmate_group: string; avatar?: AvatarConfig | null };
export type Pattern = { key: string; title: string; detail: string };
export type Reason = { key: string; text: string };
export type Entry = { learner: LearnerRef; reflection_id: string; day: string; zone: Zone; tech_happy: string; tech_improve: string; nontech_happy: string; nontech_improve: string; admin_feedback: string; admin_feedback_name?: string; admin_feedback_at?: string; words: string[] | null };
export type Board = {
  date: string;
  range: "night" | "week" | "4w";
  sent: number;
  total: number;
  missing: LearnerRef[];
  zones: Record<ZoneId, number>;
  zones_prev: Record<ZoneId, number>;
  by_group: { group: string; sent: number; total: number }[];
  worth: { learner: LearnerRef; patterns: Pattern[]; strip: Zone[]; quote: string }[];
  map: { learner: LearnerRef; nights: Zone[] }[];
  dates: string[];
  entries: Entry[];
};
export type LearnerRow = LearnerRef & { email: string; attendance_status?: string; attendance_rate: number; leave_used: number; mood: Zone[]; last_seen: string | null; support: boolean };
export type Note = { id: string; user_id: string; author_id: string; author_name: string; text: string; created_at: string };
export type SupportItem = { id: string; user_id: string; text: string; done: boolean; done_at?: string; author_name: string; created_at: string };
export type Overview = {
  learner: LearnerRef & { last_name: string; email: string; created_at: string; cohort_number: number };
  attendance_rate: number;
  leave_used: number;
  streak: number;
  last20: { date: string; morning: AttendanceStatusType | ""; afternoon: AttendanceStatusType | "" }[];
  nights: { day: string; zone: Zone }[];
  latest_quote: { day: string; zone: Zone; text: string } | null;
  patterns: Pattern[];
  reasons: Reason[];
  notes: Note[];
  support: SupportItem[];
  days: OverviewDay[];
  course: { week_number: number; total_weeks: number; day_number: number; course_days: number };
  best_streak: number;
  cohort_attendance: number;
  badges: OverviewBadge[];
  neighbors: { prev: string | null; next: string | null; index: number; total: number };
};
export type SessionAt = { status: AttendanceStatusType; at: string };
export type DayReflection = { id: string; zone: Zone; sent_at: string; tech_happy: string; tech_improve: string; nontech_happy: string; nontech_improve: string; reply: string; reply_name: string; reply_at: string | null };
export type OverviewDay = { date: string; morning: SessionAt | null; afternoon: SessionAt | null; reflection: DayReflection | null };
export type OverviewBadge = { id?: string; name: string; emoji: string; image_url?: string; color?: string; style?: string; awarded_at: string };
export type SupportRow = { learner: LearnerRef; reasons: Reason[]; open_items: number; done_items: number; owner: string };

const data = async <T,>(p: Promise<{ data: { data: T } }>): Promise<T> => (await p).data.data;

export type RoughLearner = { learner: LearnerRef; nights: (Zone | "")[]; panic: number; overwhelmed: number; again: boolean };
export type WeekRough = { week: string; sent: number; possible: number; zones: Record<string, number>; learners: RoughLearner[] };

export const wellbeingApi = {
  weeks: (cohort: number, n: number) => data<WeekRough[]>(api.get(`/admin/reflections/weeks?cohort=${cohort}&weeks=${n}`)),
  board: (cohort: number, range: Board["range"]) => data<Board>(api.get(`/admin/reflections/board?cohort=${cohort}&range=${range}`)),
  learners: (cohort: number) => data<LearnerRow[]>(api.get(`/admin/learners?cohort=${cohort}`)),
  overview: (id: string) => data<Overview>(api.get(`/admin/learners/${id}/overview`)),
  support: (cohort: number) => data<SupportRow[]>(api.get(`/admin/support?cohort=${cohort}`)),
  notes: (id: string) => data<Note[]>(api.get(`/admin/learners/${id}/notes`)),
  addNote: (id: string, text: string) => data<Note>(api.post(`/admin/learners/${id}/notes`, { text })),
  addStep: (id: string, text: string) => data<SupportItem>(api.post(`/admin/learners/${id}/support`, { text })),
  setStep: async (itemId: string, done: boolean) => {
    await api.patch(`/admin/support/${itemId}`, { done });
  },
  deleteStep: async (itemId: string) => {
    await api.delete(`/admin/support/${itemId}`);
  },
  /** Hides this exact reason for 7 days; if it changes (6/8 → 7/8) it shows again. */
  ack: async (id: string, reasonKey: string, reasonText: string) => {
    await api.post(`/admin/learners/${id}/support/ack`, { reason_key: reasonKey, reason_text: reasonText });
  },
  reply: async (userId: string, reflectionId: string, feedback: string) => {
    await api.put(`/admin/users/${userId}/reflections/${reflectionId}/feedback`, { user_id: userId, reflection_id: reflectionId, feedback });
  },
};
