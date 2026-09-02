import { api } from "../../infrastructure/api";
import type { HistoryQuery, HistoryPage } from "../../domain/types/history";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const historyService = {
  async getHistory(params: HistoryQuery = {}): Promise<HistoryPage> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.role) searchParams.set("role", params.role);
    if (params.cohort) searchParams.set("cohort", String(params.cohort));
    if (params.user_id) searchParams.set("user_id", params.user_id);
    if (params.method) searchParams.set("method", params.method);
    if (params.q) searchParams.set("q", params.q);

    const response = await api.get<ApiResponse<HistoryPage>>(`/admin/history?${searchParams.toString()}`);
    return response.data.data;
  },
};

export default historyService;
