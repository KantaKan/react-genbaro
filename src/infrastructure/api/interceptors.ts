import { api } from "./axios";
import { getAuthToken } from "../storage/token";

export const setupInterceptors = () => {
  const requestInterceptor = api.interceptors.request.use(
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

  return () => {
    api.interceptors.request.eject(requestInterceptor);
  };
};

export default setupInterceptors;
