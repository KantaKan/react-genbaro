export type Zone = "comfort" | "stretch-enjoying" | "stretch-overwhelmed" | "panic" | "no-data" | "weekend";

export interface WeeklyReflection {
  weekStart: string;
  weekEnd: string;
  reflections: DailyReflection[];
}

export interface DailyReflection {
  date: string;
  day: string;
  reflections: ReflectionEntry[];
}

export interface ReflectionEntry {
  _id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  jsd_number?: string;
  cohort_number?: number;
  barometer: string;
  tech_sessions: {
    happy: string;
    improve: string;
  };
  non_tech_sessions: {
    happy: string;
    improve: string;
  };
  createdAt: string;
}

export interface BarometerData {
  date: string;
  barometer: string;
  count: number;
}

export interface ReflectionStats {
  totalReflections: number;
  averageBarometer: number;
  zoneDistribution: Record<Zone, number>;
}
