import { api } from "../../infrastructure/api";
import type { Notification, CreateNotificationRequest, UpdateNotificationRequest } from "../../domain/types/notification";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const notificationService = {
  async getActiveNotifications(): Promise<Notification[]> {
    const response = await api.get<ApiResponse<Notification[]>>("/api/notifications");
    return response.data.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.post(`/api/notifications/${notificationId}/read`);
  },

  async getAllNotifications(): Promise<Notification[]> {
    const response = await api.get<ApiResponse<Notification[]>>("/admin/notifications");
    return response.data.data;
  },

  async createNotification(data: CreateNotificationRequest): Promise<Notification> {
    const response = await api.post<ApiResponse<Notification>>("/admin/notifications", data);
    return response.data.data;
  },

  async updateNotification(id: string, data: UpdateNotificationRequest): Promise<void> {
    await api.put(`/admin/notifications/${id}`, data);
  },

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/admin/notifications/${id}`);
  },

  async toggleNotificationActive(id: string, isActive: boolean): Promise<void> {
    await api.put(`/admin/notifications/${id}`, { is_active: isActive });
  },
};

export default notificationService;
