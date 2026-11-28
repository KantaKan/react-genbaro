export type ZoneKey = "comfort" | "stretch-enjoying" | "stretch-overwhelmed" | "panic";

export interface Quote {
  reflection_id: string;
  date: string;
  text: string;
}

export interface Journey {
  unlocked: boolean;
  name?: string;
  cohort?: string;
  first_day?: string;
  last_day?: string;
  weeks?: number;
  class_days?: number;
  written?: number;
  grid?: { date: string; zone: ZoneKey | "" | null }[] | null;
  zone_counts?: Partial<Record<ZoneKey, number>> | null;
  main_zone?: ZoneKey | "";
  hardest_week?: { number: number; from: string; to: string; zones: (ZoneKey | "" | null)[] } | null;
  darkest_night?: { date: string; zone: ZoneKey | ""; text: string; reply: string; reply_name: string } | null;
  comeback?: { length: number; after_darkest: boolean } | null;
  attendance_rate?: number | null;
  badges?: number;
  ta_replies?: number;
  quote?: Quote | null;
  quote_options?: Quote[] | null;
}

export type SlideId = "cover" | "grid" | "zone" | "week" | "night" | "comeback" | "tiles" | "closing";

export interface Extras {
  cupMedals: number;
  baroName: string | null;
  hideNight: boolean;
}
