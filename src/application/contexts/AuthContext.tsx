import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";

import { authService } from "../services/authService";
import { getAuthToken, getUserRole, getUserId, setUserRole, setUserId } from "../../infrastructure/storage";
import { isUserRole, type UserRole, type AuthState } from "../../domain/types";

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!(getAuthToken()));
  const [userRole, setUserRoleState] = useState<UserRole | null>(() => {
    const saved = getUserRole();
    return saved && isUserRole(saved) ? saved : null;
  });
  const [userId, setUserIdState] = useState<string | null>(() => getUserId() ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      const token = getAuthToken();
      if (token) {
        try {
          const { role, userId: fetchedUserId } = await authService.verifyToken(token);

          if (!isUserRole(role)) {
            throw new Error("Invalid role in response");
          }

          setIsAuthenticated(true);
          setUserRoleState(role);
          setUserIdState(fetchedUserId);
          setUserRole(role);
          setUserId(fetchedUserId);
        } catch (error: any) {
          console.error("[AuthContext] Token verification failed:", error.message);
          Cookies.remove("authToken");
          setIsAuthenticated(false);
          setUserRoleState(null);
          setUserIdState(null);
          setError(error.message || "Token verification failed.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email: string, password: string): Promise<UserRole> => {
    try {
      const { role, userId } = await authService.login({ email, password });
      setIsAuthenticated(true);
      setUserRoleState(role);
      setUserIdState(userId);
      setError(null);
      return role;
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please check your credentials.");
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserRoleState(null);
    setUserIdState(null);
    setError(null);
  };

  const value: AuthContextType = {
    isAuthenticated,
    userRole,
    userId,
    error,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
