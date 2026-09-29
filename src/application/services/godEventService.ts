import { api } from "@/infrastructure/api";
import type { ApiResponse } from "@/domain/types";
import type { BaroCharacter } from "./baroCharacterService";

export type GodEventPreset = "star_rain" | "god_entrance" | "character_parade";

export interface GodEvent {
  id: string;
  preset: GodEventPreset;
  caption: string;
  cohort: number;
  cast_by: string;
  character?: BaroCharacter;
  created_at: string;
  active_until: string;
  active: boolean;
}

export const godEventService = {
  async list(): Promise<GodEvent[]> {
    const response = await api.get<ApiResponse<GodEvent[]>>("/god-events");
    return response.data.data;
  },
  async cast(preset: GodEventPreset, caption: string, cohort: number): Promise<GodEvent> {
    const response = await api.post<ApiResponse<GodEvent>>("/admin/god-events", { preset, caption, cohort });
    return response.data.data;
  },
};
