import React, { createContext, useState, useContext, useEffect } from "react";

import { authService } from "../services/authService";
import { clearAllAuthData, getAuthToken, getUserRole, getUserId, setUserRole, setUserId } from "../../infrastructure/storage";
import { isUserRole, type UserRole, type AuthState } from "../../domain/types";

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => void;
  mustChangePassword: boolean;
  passwordChanged: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // The session itself is an httpOnly cookie the page can't see; userId (or an old token) says one may exist.
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!(getUserId() || getAuthToken()));
  const [userRole, setUserRoleState] = useState<UserRole | null>(() => {
    const saved = getUserRole();
    return saved && isUserRole(saved) ? saved : null;
  });
  const [userId, setUserIdState] = useState<string | null>(() => getUserId() ?? null);
  const [error, setError] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      if (getUserId() || getAuthToken()) {
        try {
          const { role, userId: fetchedUserId, mustChangePassword: must } = await authService.verifyToken();

          if (!isUserRole(role)) {
            throw new Error("Invalid role in response");
          }

          setIsAuthenticated(true);
          setUserRoleState(role);
          setUserIdState(fetchedUserId);
          setMustChangePassword(must);
          setUserRole(role);
          setUserId(fetchedUserId);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Token verification failed.";
          console.error("[AuthContext] Token verification failed:", message);
          clearAllAuthData();
          setIsAuthenticated(false);
          setUserRoleState(null);
          setUserIdState(null);
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
      const { role, userId, mustChangePassword: must } = await authService.login({ email, password });
      setMustChangePassword(must);
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
    setMustChangePassword(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    userRole,
    userId,
    error,
    loading,
    login,
    logout,
    mustChangePassword,
    passwordChanged: () => setMustChangePassword(false),
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
