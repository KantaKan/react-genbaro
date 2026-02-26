import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

import { userService } from "../services/userService";
import { getAuthToken } from "../../infrastructure/storage";
import type { UserData, UserDataContextType, JWTPayload } from "../../domain/types";

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

      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const decodedToken = jwtDecode<JWTPayload>(token);

      if (!decodedToken.user_id) {
        throw new Error("User ID not found in token");
      }

      const data = await userService.getUserById(decodedToken.user_id);
      setUserData(data);
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

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authToken" && !e.newValue) {
        clearUserData();
        setError("Session expired. Please log in again.");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <UserDataContext.Provider
      value={{ userData, loading, error, refetchUserData, userId, clearUserData }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
};

export default UserDataProvider;
