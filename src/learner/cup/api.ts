import { api } from "@/infrastructure/api";
import type { MyCup } from "./types";

export const cupApi = {
  me: async (): Promise<MyCup> => (await api.get("/cup/me")).data.data,
};
