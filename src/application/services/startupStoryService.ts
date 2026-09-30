import { api } from "@/infrastructure/api";
import type { ApiResponse } from "@/domain/types";

export type StartupStage = "founder" | "hub" | "developing" | "ended";

export interface StartupDev {
  id: string;
  name: string;
  title: string;
  sprite: string;
  perk?: string;
  frontend: number;
  backend: number;
  design: number;
  debug: number;
  salary: number;
}

export interface StartupProject {
  type: string;
  theme: string;
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
  mode: "free" | "ranked";
  status: "active" | "ended";
  outcome?: string;
  stage: StartupStage;
  project_index: number;
  money: number;
  fans: number;
  founder_offer?: StartupDev[];
  staff: StartupDev[];
  project?: StartupProject;
  last_result?: StartupResult;
  score: number;
  version: number;
}

export interface StartupStudio {
  _id: string;
  fame: number;
}

export interface StartupOverview {
  studio: StartupStudio;
  run: StartupRun | null;
  server_time: string;
  types: string[];
  themes: string[];
}

export const startupStoryService = {
  async overview(): Promise<StartupOverview> {
    const response = await api.get<ApiResponse<StartupOverview>>("/startup-story");
    return response.data.data;
  },
  async startRun(mode: "free" | "ranked"): Promise<StartupRun> {
    const response = await api.post<ApiResponse<StartupRun>>("/startup-story/runs", { mode });
    return response.data.data;
  },
  async pickFounder(index: number): Promise<StartupRun> {
    const response = await api.post<ApiResponse<StartupRun>>("/startup-story/runs/active/founder", { index });
    return response.data.data;
  },
  async startProject(type: string, theme: string, staffIds: string[]): Promise<StartupRun> {
    const response = await api.post<ApiResponse<StartupRun>>("/startup-story/runs/active/projects", { type, theme, staff_ids: staffIds });
    return response.data.data;
  },
  async ship(): Promise<StartupRun> {
    const response = await api.post<ApiResponse<StartupRun>>("/startup-story/runs/active/ship");
    return response.data.data;
  },
};
