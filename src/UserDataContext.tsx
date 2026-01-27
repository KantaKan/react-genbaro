import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./lib/api";
import { jwtDecode } from "jwt-decode";
import type { Badge } from "./lib/types";
import Cookies from "js-cookie";

// Types
interface TechSession {
  session_name: string[];
  happy: string;
  improve: string;
}

interface NonTechSession {
  session_name: string[];
  happy: string;
  improve: string;
}

interface ReflectionData {
  barometer: string;
  tech_sessions: TechSession;
  non_tech_sessions: NonTechSession;
}

interface Reflection {
  day: string;
  user_id: string;
  date: string;
  createdAt: string;
  reflection: ReflectionData;
}

interface UserData {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  cohort_number: number;
  jsd_number: string;
  role: string;
  reflections: Reflection[];
  badges?: Badge[];
}

interface JWTPayload {
  user_id: string; // <-- changed from id to user_id
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

interface UserDataContextType {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  refetchUserData: () => Promise<void>;
  userId: string;
  clearUserData: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = Cookies.get("authToken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const decodedToken = jwtDecode<JWTPayload>(token);

      if (!decodedToken.user_id) {
        throw new Error("User ID not found in token");
      }

      const response = await api.get<ApiResponse<UserData>>(`/users/${decodedToken.user_id}`);

      if (!response.data || !response.data.data) {
        throw new Error("No user data received or invalid format");
      }
      setUserData(response.data.data);
      setUserId(decodedToken.user_id);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch user data");
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const refetchUserData = async () => {
    await fetchUserData();
  };

  const clearUserData = () => {
    setUserData(null);
    setLoading(false);
    setError(null);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Set up request interceptor for auth
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = Cookies.get("authToken");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          Cookies.remove("authToken");
          setUserData(null);
          setError("Session expired. Please log in again.");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return <UserDataContext.Provider value={{ userData, loading, error, refetchUserData, userId, clearUserData }}>{children}</UserDataContext.Provider>;
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
};

export default UserDataProvider;
