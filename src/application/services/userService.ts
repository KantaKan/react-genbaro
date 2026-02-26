import { api } from "../../infrastructure/api";
import type { User, GetAllUsersResponse, ApiResponse, UserData } from "../../domain/types";

export const userService = {
  async getUserById(userId: string): Promise<UserData> {
    const response = await api.get<ApiResponse<UserData>>(`/users/${userId}`);
    return response.data.data;
  },

  async getAllUsers(): Promise<User[]> {
    const response = await api.get<GetAllUsersResponse>("admin/users");
    return response.data.data.users;
  },

  async getUsersByCohort(cohort: string): Promise<User[]> {
    const response = await api.get<GetAllUsersResponse>(`admin/users?cohort=${cohort}`);
    return response.data.data.users;
  },

  async getUsersByBarometer(barometer: string): Promise<User[]> {
    const response = await api.get<User[]>(`admin/users/barometer/${barometer}`);
    return response.data;
  },
};

export const getAllUsers = userService.getAllUsers;
export const getCohort = userService.getUsersByCohort;
export const getUsersByBarometer = userService.getUsersByBarometer;

export default userService;
