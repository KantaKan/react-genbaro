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
  xp_next?: number;
  burnout?: number;
  perks?: string[];
  wildcard?: string;
  wildcard_desc?: string;
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
  cloud_bill?: number;
  overload?: number;
  postmortem?: string;
}

export interface StartupInfra {
  servers: { cpu: number; ram: number }[];
  db: string;
  parts?: string[];
  replicas?: number;
}

export interface StartupLoad {
  app: number;
  app_cap: number;
  db: number;
  db_cap: number;
  next_server: number;
  next_replica: number;
}

export interface StartupInfraItem {
  id: string;
  branch: string;
  fixes: string;
  name: string;
  act: number;
  price: number;
  bill: number;
  what: string;
  need: string;
  effect: string;
  thai: string;
}

export interface StartupInfraCatalog {
  upgrade: number[];
  items: StartupInfraItem[];
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
  desks?: number[];
  desk_limit?: number;
  candidates?: StartupDev[];
  items?: string[];
  item_offer?: string[];
  project?: StartupProject;
  last_result?: StartupResult;
  score: number;
  version: number;
  max_act?: number;
  endless?: boolean;
  next_boss?: string;
  next_pass_mark?: number;
  oss?: boolean;
  pitches?: StartupPitch[];
  world_event?: string;
  boss_gimmick?: string;
  pending_perk?: { dev_id: string; offer: string[] };
  pending_event?: { id: string; title?: string; options: string[] };
  next_bugs?: number;
  next_power?: number;
  next_traffic?: number;
  boss_visits?: number;
  boss_visiting?: boolean;
  infra?: StartupInfra;
  load?: StartupLoad;
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

export interface StartupPerk {
  id: string;
  name: string;
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
  kind: "founder" | "item" | "skin" | "wildcard";
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
  perks?: StartupPerk[];
  oss_unlocked?: boolean;
  combo_ratings?: Record<string, string>;
  desk_prices?: StartupDeskPrices;
  infra?: StartupInfraCatalog;
  opt_out: boolean;
}

export interface StartupDeskPrices {
  base: number;
  step: number;
  upgrade: number[];
  max_tier: number;
  tier_act: number[];
}

export type StartupBoardTab = "deepest" | "weekly" | "fame";

export interface StartupLeaderboardEntry {
  owner_id: string;
  name: string;
  score?: number;
  fame?: number;
  max_act?: number;
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
  buyDesk: () => post("/runs/active/desks"),
  upgradeDesk: (index: number) => post("/runs/active/desks/upgrade", { index }),
  infra: (action: string, index = 0, id = "") => post("/runs/active/infra", { action, index, id }),
  async dismiss(staffId: string): Promise<StartupRun> {
    const response = await api.delete<ApiResponse<StartupRun>>(`/startup-story/runs/active/staff/${encodeURIComponent(staffId)}`);
    return response.data.data;
  },
  startProject: (type: string, theme: string, staffIds: string[]) => post("/runs/active/projects", { type, theme, staff_ids: staffIds }),
  startProjectPitch: (pitchIndex: number, staffIds: string[]) => post("/runs/active/projects", { pitch_index: pitchIndex, staff_ids: staffIds }),
  ship: () => post("/runs/active/ship"),
  pickItem: (index: number) => post("/runs/active/item", { index }),
  abandon: () => post("/runs/active/abandon"),
  async setOptOut(optOut: boolean): Promise<boolean> {
    const response = await api.put<ApiResponse<{ opt_out: boolean }>>("/startup-story/opt-out", { opt_out: optOut });
    return response.data.data.opt_out;
  },
  pickPerk: (index: number) => post("/runs/active/perk", { index }),
  pickEvent: (index: number) => post("/runs/active/event", { index }),
  ipoChoice: (keepGoing: boolean) => post("/runs/active/ipo-choice", { keep_going: keepGoing }),
  async leaderboard(tab: StartupBoardTab): Promise<StartupLeaderboardEntry[]> {
    const response = await api.get<ApiResponse<StartupLeaderboardEntry[]>>("/startup-story/leaderboard", { params: { tab } });
    return response.data.data;
  },
};
