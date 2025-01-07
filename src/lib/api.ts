import axios, { AxiosError } from "axios";

// Retrieve the token from localStorage (or sessionStorage, depending on your setup)
const getAuthToken = () => localStorage.getItem("authToken");

export const api = axios.create({
  baseURL: "http://127.0.0.1:3000/", // Adjust this if your API has a different base URL
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
