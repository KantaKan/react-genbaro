import { api } from "@/infrastructure/api";
import type { CupAward, GroupScore, MyCup } from "./types";

export const cupApi = {
  me: async (): Promise<MyCup> => (await api.get("/cup/me")).data.data,
};

export interface AwardInput {
  cohort: number;
  group: string;
  category: "coding" | "soft" | "helping";
  points: number;
  reason: string;
}

export const adminCupApi = {
  standings: async (cohort: number): Promise<{ week: string; standings: GroupScore[]; awards: CupAward[] }> =>
    (await api.get(`/admin/cup/standings?cohort=${cohort}`)).data.data,
  award: async (a: AwardInput) => (await api.post("/admin/cup/awards", a)).data.data as CupAward,
  remove: async (id: string) => {
    await api.delete(`/admin/cup/awards/${id}`);
  },
};
