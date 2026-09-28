import { api } from "../../infrastructure/api";
import type { ApiResponse, CosmeticRarity, RewardDrawResult, TeacherGiftBox } from "../../domain/types";

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
};
