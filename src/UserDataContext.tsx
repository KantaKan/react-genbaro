import React, { createContext, useContext, useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { api } from "./lib/api";
import * as jwt_decode from "jwt-decode";

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

interface Reflection {
  day: string;
  user_id: string;
  date: string;
  reflection: {
    tech_sessions: TechSession;
    non_tech_sessions: NonTechSession;
    barometer: string;
  };
}

interface UserData {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  cohort_number: number;
  reflections: Reflection[];
  role: string;
}

interface UserDataContextType {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  refetchUserData: () => Promise<void>;
}

// Context
const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Retrieve the token from localStorage using the correct key 'authToken'
      const token = localStorage.getItem("authToken");

      if (!token) {
        throw new Error("No token found in localStorage");
      }

      // Decode the token to get the payload
      const decodedToken: any = jwt_decode(token);

      // Extract the id from the decoded token
      const id = decodedToken.id;

      // Fetch user data using the extracted id
      const response = await api.get<UserData>(`/users/${id}`);
      setUserData(response.data); // Update state with fetched data
    } catch (err) {
      const error = err as AxiosError;
      setError(error.response?.data?.message || error.message || "An error occurred while fetching user data");
    } finally {
      setLoading(false); // Set loading to false once the API call is done
    }
  };

  const refetchUserData = async () => {
    setLoading(true); // Make sure loading is set to true before refetch
    await fetchUserData();
  };

  useEffect(() => {
    fetchUserData(); // Initial data fetch when the component mounts
  }, []);

  // Optional: Add request interceptor for authentication
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        // Get token from localStorage or wherever you store it
        const token = localStorage.getItem("authToken"); // Ensure correct key is used here
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  const value = {
    userData,
    loading,
    error,
    refetchUserData,
  };

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
};

// Custom hook for using the context
export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
};

export default UserDataProvider;
