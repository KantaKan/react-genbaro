import { api } from "../../infrastructure/api";
import type {
  WeeklyReflection,
  BarometerData,
  CreateReflectionPayload,
} from "../../domain/types";

export const reflectionService = {
  async getWeeklyReflections(): Promise<WeeklyReflection[]> {
    const response = await api.get<WeeklyReflection[]>("admin/users/reflections/weekly");
    return response.data;
  },

  async createReflection(userId: string, reflectionData: CreateReflectionPayload): Promise<void> {
    await api.post(`users/${userId}/reflections`, reflectionData);
  },

  async getBarometerData(timeRange: string, cohort?: string): Promise<BarometerData[]> {
    let url = `admin/reflections/chartday?timeRange=${timeRange}`;
    if (cohort) {
      url += `&cohort=${cohort}`;
    }
    const response = await api.get<BarometerData[]>(url);
    return response.data;
  },
};

export const getWeeklyReflections = reflectionService.getWeeklyReflections;
export const createReflection = reflectionService.createReflection;
export const getBarometerData = reflectionService.getBarometerData;

export default reflectionService;
