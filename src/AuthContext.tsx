import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";

import { api, setAuthToken, removeAuthToken } from "./lib/api";
import { isUserRole, type UserRole } from "./types/auth";

type AuthContextType = {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userId: string | null;
  error: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => void;
};

type VerifyTokenResponse = {
  status: string;
  data: {
    role: string;
    userId: string;
  };
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!(Cookies.get("authToken") || localStorage.getItem("authToken")));
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    const saved = Cookies.get("userRole") || localStorage.getItem("userRole");
    return saved && isUserRole(saved) ? saved : null;
  });
  const [userId, setUserId] = useState<string | null>(() => Cookies.get("userId") || localStorage.getItem("userId"));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      const token = Cookies.get("authToken") || localStorage.getItem("authToken");
      console.log("[AuthContext useEffect] Checking for authToken:", token ? "Token present" : "No token");
      if (token) {
        try {
          console.log("[AuthContext useEffect] Attempting to verify token...");
          const response = await api.get<VerifyTokenResponse>("/api/verify-token", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data.status === "success") {
            const role = response.data.data.role || "";
            const fetchedUserId = response.data.data.userId || "";

            if (!isUserRole(role)) {
              throw new Error("Invalid role in response");
            }

            setIsAuthenticated(true);
            setUserRole(role);
            setUserId(fetchedUserId);
            localStorage.setItem("userRole", role);
            localStorage.setItem("userId", fetchedUserId);
            console.log("[AuthContext useEffect] Token verification SUCCESS. User:", fetchedUserId, "Role:", role);
          } else {
            console.error("[AuthContext useEffect] Token verification failed: Invalid status in response", response.data);
            throw new Error("Token verification failed: Invalid status in response");
          }
        } catch (error: any) {
          console.error("[AuthContext useEffect] Token verification failed in catch block:", error.message, error);
          Cookies.remove("authToken");
          Cookies.remove("userRole");
          Cookies.remove("userId");
          setIsAuthenticated(false);
          setUserRole(null);
          setUserId(null);
          setError(error.message || "Token verification failed.");
        } finally {
          setLoading(false);
          console.log("[AuthContext useEffect] Finished verifyToken. IsAuthenticated:", isAuthenticated);
        }
      } else {
        console.log("[AuthContext useEffect] No authToken found, skipping verification.");
        setLoading(false);
      }
    };

    verifyToken();
  }, []); // <-- Empty dependency array means it runs ONLY ONCE on component mount.

  const login = async (email: string, password: string): Promise<UserRole> => {
    try {
      const response = await api.post("/login", { email, password });

      if (response.data?.data?.token) {
        const rawRole = response.data.data.role || "learner";
        if (!isUserRole(rawRole)) {
          throw new Error("Invalid role in login response");
        }
        const role = rawRole;
        const token = response.data.data.token;
        const fetchedUserId = response.data.data.userId || "";

        // Set token in both cookie and localStorage for reliability
        const isProduction = import.meta.env.MODE === "production";
        Cookies.set("authToken", token, { sameSite: isProduction ? "None" : "Lax", secure: isProduction });
        localStorage.setItem("authToken", token);
        console.log("[AuthContext login] authToken set:", token ? "SUCCESS" : "FAILED");
        Cookies.set("userRole", role, { sameSite: isProduction ? "None" : "Lax", secure: isProduction });
        localStorage.setItem("userRole", role);
        Cookies.set("userId", fetchedUserId, { sameSite: isProduction ? "None" : "Lax", secure: isProduction });
        localStorage.setItem("userId", fetchedUserId);

        // Update auth state
        setIsAuthenticated(true);
        setUserRole(role);
        setUserId(fetchedUserId);
        setError(null);

        // Configure axios with new token
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        return role;
      } else {
        throw new Error("No token or userId in response");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please check your credentials.");
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove("authToken");
    Cookies.remove("userRole");
    Cookies.remove("userId");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    setIsAuthenticated(false);
    setUserRole(null);
    setUserId(null);
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
