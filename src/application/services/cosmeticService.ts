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
};

export default cosmeticService;
