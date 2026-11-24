import axios from "axios";
import { getAuthToken } from "../storage/token";

export const api = axios.create({
  // Same origin: Vercel (and Vite in dev) forward /api to the backend, so the httpOnly session
  // cookie is first-party everywhere, including Safari.
  baseURL: "/api/",
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
