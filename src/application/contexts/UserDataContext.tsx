import React, { createContext, useContext, useState, useEffect } from "react";

import { userService } from "../services/userService";
import { getUserId } from "../../infrastructure/storage";
import type { UserData, UserDataContextType } from "../../domain/types";

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");

  const fetchUserData = async () => {
    const id = getUserId();
    if (!id) {
      setUserData(null);
      setUserId("");
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await userService.getUserById(id);
      setUserData(data);
      setUserId(id);
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
      if (e.key === "userId" && !e.newValue) {
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
