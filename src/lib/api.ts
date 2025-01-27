import axios, { AxiosError } from "axios";
import type { Todo, CreateTodoInput, UpdateTodoInput } from "./types";
// Retrieve the token from localStorage (or sessionStorage, depending on your setup)
const getAuthToken = () => localStorage.getItem("authToken");

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:3000/", // Fallback to localhost if env var is not set
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Dynamically add the token to the header for each request
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getReflectionsByWeek = async (): Promise<WeeklyReflection[]> => {
  const response = await api.get<WeeklyReflection[]>("admin/users/reflections/weekly");
  return response.data;
};

export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("admin/users");
  return response.data;
};

export const getUsersByBarometer = async (barometer: string): Promise<User[]> => {
  const response = await api.get<User[]>(`admin/users/barometer/${barometer}`);
  return response.data;
};

// POST reflection API
export const createReflection = async (userId: string, reflectionData: CreateReflectionPayload) => {
  const response = await api.post(`/${userId}/reflections`, reflectionData);
  return response.data;
};

export const getBarometerData = async (timeRange: string): Promise<BarometerData[]> => {
  const response = await api.get<BarometerData[]>(`admin/reflections/chartday?timeRange=${timeRange}`);
  return response.data;
};

// Define the registration interface
interface RegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  cohort_number: string;
  jsd_number: string;
}

export const register = async (userData: RegistrationData) => {
  try {
    console.log("Sending registration data:", userData);

    const response = await api.post("/register", userData);

    console.log("Registration response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Registration error details:", {
      data: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      requestData: userData,
    });
    throw error;
  }
};
