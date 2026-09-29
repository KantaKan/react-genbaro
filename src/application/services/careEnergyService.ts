import type { ApiResponse, CareEnergyActionResponse, CareEnergyGrantPayload, CareEnergyLogEntry } from "@/domain/types";
import { api } from "@/infrastructure/api";

export interface CareEnergyState {
  balance: number;
  log: CareEnergyLogEntry[];
  character_care_count: number;
  last_cared_at?: string;
}

export interface CharacterCareResult {
  effect: "happy-hop";
  state: CareEnergyState;
}

export const careEnergyService = {
  async grant(userId: string, payload: CareEnergyGrantPayload): Promise<void> {
    await api.post<CareEnergyActionResponse>(`/admin/users/${userId}/care-energy`, payload);
  },
  async bulkGrant(userIds: string[], payload: CareEnergyGrantPayload): Promise<void> {
    await api.post("/admin/care-energy/bulk", { userIds, ...payload });
  },
  async protect(userId: string, date: string): Promise<void> {
    await api.post<CareEnergyActionResponse>(`/users/${userId}/care-energy/protect`, { date });
  },
  async feed(userId: string, quantity = 1): Promise<void> {
    await api.post<CareEnergyActionResponse>(`/users/${userId}/care-energy/feed`, { quantity });
  },
  async gift(userId: string, quantity = 1): Promise<void> {
    await api.post<CareEnergyActionResponse>(`/users/${userId}/care-energy/gift`, { quantity });
  },
  async rescue(userId: string, date: string): Promise<void> {
    await api.post<CareEnergyActionResponse>(`/users/${userId}/care-energy/rescue`, { date });
  },
  async state(userId: string): Promise<CareEnergyState> {
    const response = await api.get<ApiResponse<CareEnergyState>>(`/users/${userId}/care-energy`);
    return response.data.data;
  },
  async careForCharacter(userId: string): Promise<CharacterCareResult> {
    const response = await api.post<ApiResponse<CharacterCareResult>>(`/users/${userId}/care-energy/character-care`);
    return response.data.data;
  },
};

export default careEnergyService;
