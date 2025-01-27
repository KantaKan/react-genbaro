import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./lib/api";
import { jwtDecode } from "jwt-decode";

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
}

interface JWTPayload {
  id: string;
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

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const decodedToken = jwtDecode<JWTPayload>(token);

      const response = await api.get<UserData>(`/users/${decodedToken.id}`);

      if (!response.data) {
        throw new Error("No user data received");
      }

      setUserData(response.data);
      setUserId(decodedToken.id);
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
        const token = localStorage.getItem("authToken");
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
          localStorage.removeItem("authToken");
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
