import { api } from "../../infrastructure/api";
import type { User, GetAllUsersResponse, ApiResponse, UserData } from "../../domain/types";

export const userService = {
  async getUserById(userId: string): Promise<UserData> {
    const response = await api.get<ApiResponse<UserData>>(`/users/${userId}`);
    return response.data.data;
  },

  async getAllUsers(): Promise<User[]> {
    const response = await api.get<GetAllUsersResponse>("/users");
    return response.data.data.users;
  },

  async getUsersByCohort(cohort: string): Promise<User[]> {
    const response = await api.get<GetAllUsersResponse>(`/users?cohort=${cohort}`);
    return response.data.data.users;
  },

  async getUsersByBarometer(barometer: string): Promise<User[]> {
    const response = await api.get<User[]>(`admin/users/barometer/${barometer}`);
    return response.data;
  },

  async addProfileComment(userId: string, payload: { content: string; zoomName: string; cohort: number; parentId?: string }): Promise<void> {
    await api.post(`/users/${userId}/profile/comments`, payload);
  },

  async addProfileReaction(userId: string, payload: { type: string; value: string }): Promise<void> {
    await api.post(`/users/${userId}/profile/reactions`, payload);
  },

  async updateUserPersonalDetails(userId: string, payload: { bio?: string; social_links?: SocialLinks; pinned_badge_ids?: string[] }): Promise<void> {
    await api.put(`/users/${userId}/personal-details`, payload);
  },
};

export const getAllUsers = userService.getAllUsers;
export const getCohort = userService.getUsersByCohort;
export const getUsersByBarometer = userService.getUsersByBarometer;
export const addProfileComment = userService.addProfileComment;
export const addProfileReaction = userService.addProfileReaction;
export const getUserById = userService.getUserById;
export const updateUserPersonalDetails = userService.updateUserPersonalDetails;

export default userService;
