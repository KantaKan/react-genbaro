import { api } from "../../infrastructure/api";
import type { FertilizerActionResponse, FertilizerGrantPayload } from "../../domain/types";

export const fertilizerService = {
  async grant(userId: string, payload: FertilizerGrantPayload): Promise<void> {
    await api.post<FertilizerActionResponse>(`/admin/users/${userId}/fertilizer`, payload);
  },

  async bulkGrant(userIds: string[], payload: FertilizerGrantPayload): Promise<void> {
    await api.post(`/admin/fertilizer/bulk`, { userIds, ...payload });
  },

  async protect(userId: string, date: string): Promise<void> {
    await api.post<FertilizerActionResponse>(`/users/${userId}/fertilizer/protect`, { date });
  },

  async feed(userId: string, quantity = 1): Promise<void> {
    await api.post<FertilizerActionResponse>(`/users/${userId}/fertilizer/feed`, { quantity });
  },
};

export default fertilizerService;
