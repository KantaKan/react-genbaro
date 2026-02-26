import { api } from "../../infrastructure/api";
import type {
  LeaveRequest,
  CreateLeaveRequestPayload,
  AdminCreateLeaveRequestPayload,
  Holiday,
} from "../../domain/types";

export const leaveService = {
  async submitLeaveRequest(payload: CreateLeaveRequestPayload): Promise<LeaveRequest> {
    const response = await api.post("/leave-requests", payload);
    return response.data.data;
  },

  async getMyLeaveRequests(): Promise<LeaveRequest[]> {
    const response = await api.get("/leave-requests/my");
    return response.data.data;
  },

  async getAllLeaveRequests(params?: {
    cohort?: number;
    status?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<LeaveRequest[]> {
    let url = "/admin/leave-requests";
    const queryParams = new URLSearchParams();
    if (params?.cohort) queryParams.append("cohort", params.cohort.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.from_date) queryParams.append("from_date", params.from_date);
    if (params?.to_date) queryParams.append("to_date", params.to_date);
    if (queryParams.toString()) url += `?${queryParams.toString()}`;
    const response = await api.get(url);
    return response.data.data;
  },

  async adminCreateLeaveRequest(payload: AdminCreateLeaveRequestPayload): Promise<LeaveRequest> {
    const response = await api.post("/admin/leave-requests", payload);
    return response.data.data;
  },

  async updateLeaveRequestStatus(
    requestId: string,
    status: "approved" | "rejected",
    review_notes?: string
  ): Promise<LeaveRequest> {
    const response = await api.patch(`/admin/leave-requests/${requestId}`, { status, review_notes });
    return response.data.data;
  },

  async getHolidays(startDate?: string, endDate?: string): Promise<Holiday[]> {
    let url = "/admin/holidays";
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`;
    }
    const response = await api.get(url);
    return response.data.data || [];
  },

  async createHoliday(
    name: string,
    startDate: string,
    endDate: string,
    description?: string
  ): Promise<Holiday> {
    const response = await api.post("/admin/holidays", {
      name,
      start_date: startDate,
      end_date: endDate,
      description,
    });
    return response.data.data;
  },

  async deleteHoliday(holidayId: string): Promise<void> {
    await api.delete(`/admin/holidays/${holidayId}`);
  },
};

export const submitLeaveRequest = leaveService.submitLeaveRequest;
export const getMyLeaveRequests = leaveService.getMyLeaveRequests;
export const getAllLeaveRequests = leaveService.getAllLeaveRequests;
export const adminCreateLeaveRequest = leaveService.adminCreateLeaveRequest;
export const updateLeaveRequestStatus = leaveService.updateLeaveRequestStatus;
export const getHolidays = leaveService.getHolidays;
export const createHoliday = leaveService.createHoliday;
export const deleteHoliday = leaveService.deleteHoliday;

export default leaveService;
