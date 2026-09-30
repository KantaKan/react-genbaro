import { api } from "../../infrastructure/api";
import type { ApiResponse, CosmeticRarity, TeacherGiftBox } from "../../domain/types";
import type { GiftBoxOdds, GiftBoxOpenResult, GiftBoxRecipient, GiftBoxRewardPool } from "../../domain/types/gift-box";

export interface CohortGiftBoxResult {
  total: number;
  created: number;
  existing: number;
  failures: Array<{ user_id: string; error: string }>;
}

export interface GiftBoxAudiencePreview {
  cohort: number;
  team?: string;
  total: number;
}

export const giftBoxService = {
  async list(): Promise<TeacherGiftBox[]> {
    const response = await api.get<ApiResponse<TeacherGiftBox[]>>("/gift-boxes");
    return response.data.data;
  },

  async grant(userId: string, minimumRarity: CosmeticRarity, message: string, rewardPool?: GiftBoxRewardPool): Promise<TeacherGiftBox> {
    const response = await api.post<ApiResponse<TeacherGiftBox>>(`/admin/users/${userId}/gift-boxes`, {
      minimum_rarity: minimumRarity,
      message,
      reward_pool: rewardPool ?? "",
    });
    return response.data.data;
  },

  async open(boxId: string): Promise<GiftBoxOpenResult> {
    const response = await api.post<ApiResponse<GiftBoxOpenResult>>(`/gift-boxes/${boxId}/open`);
    return response.data.data;
  },

  async odds(boxId: string): Promise<GiftBoxOdds> {
    const response = await api.get<ApiResponse<GiftBoxOdds>>(`/gift-boxes/${boxId}/odds`);
    return response.data.data;
  },

  async recipients(query: string): Promise<GiftBoxRecipient[]> {
    const response = await api.get<ApiResponse<GiftBoxRecipient[]>>("/gift-boxes/recipients", { params: { query } });
    return response.data.data;
  },

  async transfer(boxId: string, recipientId: string): Promise<TeacherGiftBox> {
    const response = await api.post<ApiResponse<TeacherGiftBox>>(`/gift-boxes/${boxId}/transfer`, { recipient_id: recipientId });
    return response.data.data;
  },

  async reconcileMilestones(userId: string): Promise<TeacherGiftBox[]> {
    const response = await api.post<ApiResponse<TeacherGiftBox[]>>(`/users/${userId}/reflection-rewards/reconcile`);
    return response.data.data;
  },

  async grantCohort(cohort: number, minimumRarity: CosmeticRarity, message: string, idempotencyKey: string): Promise<CohortGiftBoxResult> {
    return this.grantAudience(cohort, "", minimumRarity, message, idempotencyKey, "");
  },

  async previewAudience(cohort: number, team: string): Promise<GiftBoxAudiencePreview> {
    const response = await api.get<ApiResponse<GiftBoxAudiencePreview>>(`/admin/cohorts/${cohort}/gift-boxes/recipients`, { params: { team } });
    return response.data.data;
  },

  async grantAudience(cohort: number, team: string, minimumRarity: CosmeticRarity, message: string, idempotencyKey: string, rewardPool: "" | GiftBoxRewardPool): Promise<CohortGiftBoxResult> {
    const response = await api.post<ApiResponse<CohortGiftBoxResult>>(`/admin/cohorts/${cohort}/gift-boxes`, {
      minimum_rarity: minimumRarity,
      message,
      idempotency_key: idempotencyKey,
      team,
      reward_pool: rewardPool,
    });
    return response.data.data;
  },
};
