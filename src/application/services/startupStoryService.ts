import { api } from "@/infrastructure/api";
import type { ApiResponse } from "@/domain/types";

export type StartupStage = "founder" | "hub" | "developing" | "item" | "perk" | "event" | "ipo_choice" | "ended";
export type StartupMode = "free" | "ranked";

export interface StartupDev {
  id: string;
  name: string;
  title: string;
  sprite: string;
  genmate_id?: string;
  role?: string;
  perk?: string;
  trait?: string;
  frontend: number;
  backend: number;
  design: number;
  debug: number;
  salary: number;
  level?: number;
  xp?: number;
  burnout?: number;
  perks?: string[];
}

export interface StartupPitch {
  type: string;
  theme: string;
  title: string;
}

export interface StartupProject {
  type: string;
  theme: string;
  boss?: string;
  staff_ids: string[];
  started_at: string;
  ends_at: string;
}

export interface StartupReview {
  reviewer: string;
  score: number;
  line: string;
}

export interface StartupResult {
  type: string;
  theme: string;
  combo: "great" | "good" | "meh";
  reviews: StartupReview[];
  total: number;
  bugs: number;
  money_delta: number;
  fans_delta: number;
}

export interface StartupRun {
  _id: string;
  mode: StartupMode;
  week_key?: string;
  founder?: string;
  status: "active" | "ended";
  outcome?: "ipo" | "pivot" | string;
  stage: StartupStage;
  act: number;
  market: { hot: string[]; cold?: string[] };
  boss_order?: string[];
  bosses_passed: number;
  project_index: number;
  money: number;
  fans: number;
  founder_offer?: StartupDev[];
  staff: StartupDev[];
  candidates?: StartupDev[];
  items?: string[];
  item_offer?: string[];
  project?: StartupProject;
  last_result?: StartupResult;
  score: number;
  version: number;
  max_act?: number;
  endless?: boolean;
  oss?: boolean;
  pitches?: StartupPitch[];
  world_event?: string;
  boss_gimmick?: string;
  pending_perk?: { dev_id: string; offer: string[] };
  pending_event?: { id: string; options: string[] };
  log?: string[];
}

export interface StartupHallEntry {
  run_id: string;
  mode: StartupMode;
  week_key?: string;
  score: number;
  outcome: string;
  founder: string;
  ended_at: string;
}

export interface StartupStudio {
  _id: string;
  fame: number;
  discovered_combos?: string[];
  unlocked_founders?: string[];
  unlocked_items?: string[];
  office_skin?: string;
  hall_of_fame?: StartupHallEntry[];
}

export interface StartupItem {
  id: string;
  name: string;
  icon: string;
  rarity: "common" | "rare" | "legendary" | "cursed";
  desc: string;
}

export interface StartupRole {
  id: string;
  title: string;
  job: string;
  builder: boolean;
}

export interface StartupUnlock {
  fame: number;
  kind: "founder" | "item" | "skin";
  id: string;
  name: string;
}

export interface StartupOverview {
  studio: StartupStudio;
  run: StartupRun | null;
  ranked_attempts_left: number;
  week_key: string;
  server_time: string;
  types: string[];
  themes: string[];
  items: StartupItem[];
  unlocks: StartupUnlock[];
  roles?: StartupRole[];
  opt_out: boolean;
}

export interface StartupLeaderboardEntry {
  owner_id: string;
  name: string;
  score?: number;
  fame?: number;
  outcome?: string;
}

const post = async (path: string, body?: unknown) => (await api.post<ApiResponse<StartupRun>>(`/startup-story${path}`, body)).data.data;

export const STARTUP_STORY_QUERY_KEY = "startup-story";

export const startupStoryService = {
  async overview(): Promise<StartupOverview> {
    const response = await api.get<ApiResponse<StartupOverview>>("/startup-story");
    return response.data.data;
  },
  startRun: (mode: StartupMode) => post("/runs", { mode }),
  pickFounder: (index: number) => post("/runs/active/founder", { index }),
  hire: (candidateId: string) => post("/runs/active/hire", { candidate_id: candidateId }),
  async dismiss(staffId: string): Promise<StartupRun> {
    const response = await api.delete<ApiResponse<StartupRun>>(`/startup-story/runs/active/staff/${encodeURIComponent(staffId)}`);
    return response.data.data;
  },
  startProject: (type: string, theme: string, staffIds: string[]) => post("/runs/active/projects", { type, theme, staff_ids: staffIds }),
  ship: () => post("/runs/active/ship"),
  pickItem: (index: number) => post("/runs/active/item", { index }),
  abandon: () => post("/runs/active/abandon"),
  async setOptOut(optOut: boolean): Promise<boolean> {
    const response = await api.put<ApiResponse<{ opt_out: boolean }>>("/startup-story/opt-out", { opt_out: optOut });
    return response.data.data.opt_out;
  },
  async leaderboard(tab: "weekly" | "fame"): Promise<StartupLeaderboardEntry[]> {
    const response = await api.get<ApiResponse<StartupLeaderboardEntry[]>>("/startup-story/leaderboard", { params: { tab } });
    return response.data.data;
  },
};
