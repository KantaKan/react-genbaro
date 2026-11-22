/** The course calendar, as the backend serves it (admin and learner share these shapes). */
export type Session = {
  start: string; // "09:15"
  end: string;
  code: string;
  title: string;
  subtitle: string;
  facilitators: string[];
  type: string;
  kind: "session" | "break";
};
export type CalDay = { date: string; label: string; weekday: number; holiday: boolean; sessions: Session[] };
export type CalWeek = { n: number; name: string; monday: string; published?: boolean; published_at?: string | null; days: CalDay[] };

/** Small dot colour per session type (the program's key, tuned for dots on white and dark). */
export const TYPE_DOT: Record<string, string> = {
  behavioral: "#e879f9",
  technical: "#38bdf8",
  skills_application: "#84cc16",
  employment: "#facc15",
  reinforcement: "#fb923c",
  community: "#f9a8d4",
  social_support: "#a5b4fc",
  orientation: "#93c5fd",
  other: "#a1a1aa",
  break: "#d4d4d8",
};

export const TYPE_LABEL: Record<string, string> = {
  behavioral: "Behavioral Skills & Mindset",
  technical: "Technical Skills",
  skills_application: "Skills Application",
  employment: "Employment Essentials",
  reinforcement: "Reinforcement & Reflection",
  community: "Community",
  social_support: "Social Support & Mentorship",
  orientation: "Orientation",
  other: "Other",
  break: "Break",
};

/** "09:15" → minutes since midnight. */
export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** What a learner gets: published weeks only, plus the Zoom link. */
export type LearnerCalendar = { zoom_url: string; weeks: CalWeek[] };
