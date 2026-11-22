import type { AttendanceStatusType } from "@/domain/types/attendance";
import type { CheckinRules } from "@/learner/types";
import type { AvatarConfig } from "@/learner/avatar/types";
import type { ZoneId } from "@/learner/today/BarometerFace";

export type Session = "morning" | "afternoon";
export type PreviousRecord = { _id: string; status: AttendanceStatusType; marked_by: "self" | "admin"; marked_by_user: string; submitted_at: string; checkin_style: string };
export type SessionCell = {
  status: AttendanceStatusType | "";
  checked_in_at: string | null;
  style?: string;
  marked_by?: "self" | "admin" | "system";
  record_id?: string;
};
export type TodayLearner = {
  id: string;
  first_name: string;
  last_name: string;
  zoom_name: string;
  jsd_number: string;
  genmate_group: string;
  avatar?: AvatarConfig | null;
  morning: SessionCell;
  afternoon: SessionCell;
  streak: number;
  leave_used: number;
  warning_level: "none" | "first" | "second" | "third";
  attendance_rate: number;
  mood_yesterday: ZoneId | "";
  last10: { date: string; status: AttendanceStatusType }[];
};
export type SessionCounts = { on_time: number; late: number; leave: number; absent: number; not_yet: number; total: number };
export type TodayView = {
  date: string;
  class_today: boolean;
  session: Session;
  rules: CheckinRules;
  counts: Record<Session, SessionCounts>;
  learners: TodayLearner[];
};
export type RegisterLearner = {
  id: string;
  first_name: string;
  last_name: string;
  zoom_name: string;
  jsd_number: string;
  genmate_group: string;
  avatar?: AvatarConfig | null;
  days: [SessionCell, SessionCell][];
  week_rate: number;
  leave_used: number;
};
export type RegisterKPIs = { attendance_rate: number; lates: number; absences: number; excused: number; at_six_plus: number; at_seven: number };
export type RegisterView = { week: string; dates: string[]; holidays: string[]; kpis: RegisterKPIs; previous: RegisterKPIs; learners: RegisterLearner[] };
