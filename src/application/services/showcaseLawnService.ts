import { api } from "@/infrastructure/api";
import type { ApiResponse } from "@/domain/types";
import type { BaroCharacter } from "./baroCharacterService";

export interface ShowcaseEntry {
  owner_id: string;
  name: string;
  cohort: number;
  team: string;
  character: BaroCharacter;
  prop?: string;
  message: string;
  updated_at: string;
  hidden?: boolean;
  reactions?: Array<{ emoji: string; count: number; reacted: boolean }>;
}

export const showcaseLawnService = {
  async mine(): Promise<ShowcaseEntry | null> {
    const response = await api.get<ApiResponse<ShowcaseEntry | null>>("/showcase-lawn/me");
    return response.data.data;
  },
  async list(cohort?: number, team?: string, includeHidden = false): Promise<ShowcaseEntry[]> {
    const response = await api.get<ApiResponse<ShowcaseEntry[]>>("/showcase-lawn", {
      params: { ...(cohort ? { cohort } : {}), ...(team ? { team } : {}), ...(includeHidden ? { include_hidden: true } : {}) },
    });
    return response.data.data;
  },
  async save(characterId: string, message: string): Promise<void> {
    await api.put("/showcase-lawn/me", { character_id: characterId, message });
  },
  async remove(): Promise<void> {
    await api.delete("/showcase-lawn/me");
  },
  async react(ownerId: string, emoji: string): Promise<{ reacted: boolean }> {
    const response = await api.post<ApiResponse<{ reacted: boolean }>>(`/showcase-lawn/${ownerId}/reactions`, { emoji });
    return response.data.data;
  },
  async moderate(ownerId: string, hidden: boolean): Promise<void> {
    await api.put(`/admin/showcase-lawn/${ownerId}/moderation`, { hidden });
  },
};
