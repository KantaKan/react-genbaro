import { api } from "../../infrastructure/api";
import type { Cohort, Stamp } from "@/lib/stamp";

export interface UpdateCohortPayload {
  name?: string;
  lockAt?: string;
  isLocked?: boolean;
}

export const stampService = {
  async listCohorts(): Promise<Cohort[]> {
    const response = await api.get("/cohorts");
    return response.data.data;
  },

  async getCohortInfo(cohortNumber: number): Promise<Cohort> {
    const response = await api.get(`/cohorts/${cohortNumber}`);
    return response.data.data;
  },

  async getCohortStamps(cohortNumber: number): Promise<Stamp[]> {
    const response = await api.get(`/cohorts/${cohortNumber}/stamps`);
    return response.data.data;
  },

  async createStamp(file: File): Promise<Stamp> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post("/stamps", formData);
    return response.data.data;
  },

  async updateCohort(cohortNumber: number, payload: UpdateCohortPayload): Promise<Cohort> {
    const response = await api.put(`/admin/cohorts/${cohortNumber}`, payload);
    return response.data.data;
  },

  async uploadPoster(cohortNumber: number, file: Blob): Promise<Cohort> {
    const formData = new FormData();
    formData.append("image", file, "poster.png");
    const response = await api.post(`/admin/cohorts/${cohortNumber}/poster`, formData);
    return response.data.data;
  },

  async clearCohortStamps(cohortNumber: number): Promise<void> {
    await api.delete(`/admin/cohorts/${cohortNumber}/stamps`);
  },

  async deleteStamp(cohortNumber: number, stampId: string): Promise<void> {
    await api.delete(`/admin/cohorts/${cohortNumber}/stamps/${stampId}`);
  },
};

export const listCohorts = stampService.listCohorts;
export const getCohortInfo = stampService.getCohortInfo;
export const getCohortStamps = stampService.getCohortStamps;
export const createStamp = stampService.createStamp;
export const updateCohort = stampService.updateCohort;
export const uploadPoster = stampService.uploadPoster;
export const clearCohortStamps = stampService.clearCohortStamps;
export const deleteStamp = stampService.deleteStamp;

export default stampService;
