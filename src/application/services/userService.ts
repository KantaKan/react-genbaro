import { api } from "../../infrastructure/api";
import type {
  User,
  GetAllUsersResponse,
  ApiResponse,
  UserData,
  GenmateGardenMember,
  GenmateGardenResponse,
  SocialLinks,
} from "../../domain/types";

export const userService = {
  async getUserById(userId: string): Promise<UserData> {
    const response = await api.get<ApiResponse<UserData>>(`/users/${userId}`);
    return response.data.data;
  },

  async getMyGenmateGarden(): Promise<GenmateGardenMember[]> {
    const response = await api.get<GenmateGardenResponse>("/users/genmate-garden");
    return response.data.data.users;
  },

  async getAllUsers(): Promise<User[]> {
    const response = await api.get<GetAllUsersResponse>("/users");
    return response.data.data.users;
  },

  async getUsersByCohort(cohort: string): Promise<User[]> {
    const response = await api.get<GetAllUsersResponse>(`/users?cohort=${cohort}`);
    return response.data.data.users;
  },

  async addProfileComment(userId: string, payload: { content: string; parentId?: string }): Promise<void> {
    await api.post(`/users/${userId}/profile/comments`, payload);
  },

  async addProfileReaction(userId: string, payload: { type: string; value: string }): Promise<void> {
    await api.post(`/users/${userId}/profile/reactions`, payload);
  },

  async addPlantReaction(userId: string, payload: { type: string; value: string }): Promise<void> {
    await api.post(`/users/${userId}/plant/reactions`, payload);
  },

  async updateUserPersonalDetails(userId: string, payload: { bio?: string; social_links?: SocialLinks; pinned_badge_ids?: string[]; selected_palette?: string }): Promise<void> {
    await api.put(`/users/${userId}/personal-details`, payload);
  },

  async deleteUserById(userId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
  },

  async updatePlantOverride(
    userId: string,
    payload: { palette?: string; species?: string; pot?: string; leaf?: string; flower?: string; stem?: string }
  ): Promise<void> {
    await api.patch(`/admin/users/${userId}/plant`, payload);
  },

  async updateUser(userId: string, payload: Partial<User>): Promise<void> {
    await api.put(`/users/${userId}`, payload);
  },

  async deleteProfileComment(userId: string, commentId: string): Promise<void> {
    await api.delete(`/users/${userId}/profile/comments/${commentId}`);
  },
};

export const getAllUsers = userService.getAllUsers;
export const getCohort = userService.getUsersByCohort;
export const getMyGenmateGarden = userService.getMyGenmateGarden;
export const addProfileComment = userService.addProfileComment;
export const addProfileReaction = userService.addProfileReaction;
export const addPlantReaction = userService.addPlantReaction;
export const getUserById = userService.getUserById;
export const updateUserPersonalDetails = userService.updateUserPersonalDetails;
export const deleteUserById = userService.deleteUserById;
export const updatePlantOverride = userService.updatePlantOverride;
export const updateUser = userService.updateUser;
export const deleteProfileComment = userService.deleteProfileComment;

export default userService;
