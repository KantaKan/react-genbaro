import { api } from "../../infrastructure/api";
import type { ApiResponse, CosmeticCatalogItem, CosmeticCollection } from "../../domain/types";

export const cosmeticService = {
  async getCatalog(): Promise<CosmeticCatalogItem[]> {
    const response = await api.get<ApiResponse<CosmeticCatalogItem[]>>("/plant-cosmetics/catalog");
    return response.data.data;
  },

  async getCollection(): Promise<CosmeticCollection> {
    const response = await api.get<ApiResponse<CosmeticCollection>>("/plant-cosmetics/collection");
    return response.data.data;
  },

  async getAdminCollection(userId: string): Promise<CosmeticCollection> {
    const response = await api.get<ApiResponse<CosmeticCollection>>(`/admin/users/${userId}/cosmetics`);
    return response.data.data;
  },

  async grantExact(userId: string, cosmeticId: string, message: string): Promise<{ granted: boolean }> {
    const response = await api.post<ApiResponse<{ granted: boolean }>>(
      `/admin/users/${userId}/cosmetics/${encodeURIComponent(cosmeticId)}`,
      { message },
    );
    return response.data.data;
  },

  async revoke(userId: string, cosmeticId: string): Promise<{ revoked: boolean }> {
    const response = await api.delete<ApiResponse<{ revoked: boolean }>>(
      `/admin/users/${userId}/cosmetics/${encodeURIComponent(cosmeticId)}`,
    );
    return response.data.data;
  },
};

export default cosmeticService;
