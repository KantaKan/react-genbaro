import { api } from "../../infrastructure/api";
import type { ApiResponse, CosmeticRarity, RewardDrawResult, TeacherGiftBox } from "../../domain/types";

export interface CohortGiftBoxResult {
  total: number;
  created: number;
  existing: number;
  failures: Array<{ user_id: string; error: string }>;
}

export const giftBoxService = {
  async list(): Promise<TeacherGiftBox[]> {
    const response = await api.get<ApiResponse<TeacherGiftBox[]>>("/gift-boxes");
    return response.data.data;
  },

  async grant(userId: string, minimumRarity: CosmeticRarity, message: string): Promise<TeacherGiftBox> {
    const response = await api.post<ApiResponse<TeacherGiftBox>>(`/admin/users/${userId}/gift-boxes`, {
      minimum_rarity: minimumRarity,
      message,
    });
    return response.data.data;
  },

  async open(boxId: string): Promise<RewardDrawResult> {
    const response = await api.post<ApiResponse<RewardDrawResult>>(`/gift-boxes/${boxId}/open`);
    return response.data.data;
  },

  async reconcileMilestones(userId: string): Promise<TeacherGiftBox[]> {
    const response = await api.post<ApiResponse<TeacherGiftBox[]>>(`/users/${userId}/reflection-rewards/reconcile`);
    return response.data.data;
  },

  async grantCohort(cohort: number, minimumRarity: CosmeticRarity, message: string, idempotencyKey: string): Promise<CohortGiftBoxResult> {
    const response = await api.post<ApiResponse<CohortGiftBoxResult>>(`/admin/cohorts/${cohort}/gift-boxes`, {
      minimum_rarity: minimumRarity,
      message,
      idempotency_key: idempotencyKey,
    });
    return response.data.data;
  },
};
