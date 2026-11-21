import { api } from "../../infrastructure/api";
import type { ApiResponse, CosmeticCatalogItem, CosmeticCollection } from "../../domain/types";
import type { CharacterCosmeticSlot } from "../../domain/types/cosmetic";

export const characterCosmeticService = {
  async catalog(): Promise<CosmeticCatalogItem[]> {
    const response = await api.get<ApiResponse<CosmeticCatalogItem[]>>("/character-cosmetics/catalog");
    return response.data.data;
  },
  async collection(): Promise<CosmeticCollection> {
    const response = await api.get<ApiResponse<CosmeticCollection>>("/character-cosmetics/collection");
    return response.data.data;
  },
  async adminCollection(userId: string): Promise<CosmeticCollection> {
    const response = await api.get<ApiResponse<CosmeticCollection>>(`/admin/users/${userId}/character-cosmetics`);
    return response.data.data;
  },
  async grant(userId: string, cosmeticId: string): Promise<{ granted: boolean }> {
    const response = await api.post<ApiResponse<{ granted: boolean }>>(
      `/admin/users/${userId}/character-cosmetics/${encodeURIComponent(cosmeticId)}`,
      { message: "" },
    );
    return response.data.data;
  },
  async equip(slot: CharacterCosmeticSlot, cosmeticId: string): Promise<void> {
    await api.put(`/character-cosmetics/equipment/${slot}`, { cosmetic_id: cosmeticId });
  },
  async unequip(slot: CharacterCosmeticSlot): Promise<void> {
    await api.delete(`/character-cosmetics/equipment/${slot}`);
  },
};
