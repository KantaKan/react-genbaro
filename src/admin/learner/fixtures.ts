import type { TodayLearner } from "../types";

export const mkLearner = (o: Partial<TodayLearner> = {}): TodayLearner => ({
  id: "u1",
  first_name: "Chanon",
  last_name: "S",
  zoom_name: "04_Chanon(Non/นนท์)",
  jsd_number: "04",
  genmate_group: "B",
  avatar: null,
  morning: { status: "", checked_in_at: null },
  afternoon: { status: "", checked_in_at: null },
  streak: 0,
  leave_used: 6,
  warning_level: "second",
  attendance_rate: 0.898,
  mood_yesterday: "panic",
  last10: [],
  ...o,
});
