export type CupCategory = "coding" | "soft" | "showing_up" | "helping";

export interface GroupScore {
  group: string;
  total: number;
  by_category: Record<CupCategory, number>;
  by_day: number[]; // Mon..Fri
}

export interface CupAward {
  id: string;
  group: string;
  category: CupCategory;
  points: number;
  reason: string;
  day: string;
  created_at: string;
}

export interface MyCup {
  week: string;
  week_no: number;
  ends_at: string;
  standings: GroupScore[];
  my_group: string;
  my_awards: CupAward[];
  champion_group: string;
  my_medals: { week: string; week_no: number }[];
  wall_of_fame: { week_no: number; group: string; points: number }[];
}
