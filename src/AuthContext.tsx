import React, { createContext, useState, useContext, useEffect } from "react";

import { api } from "./lib/api";

type AuthContextType = {
  isAuthenticated: boolean;
  userRole: string | null;
  userId: string | null;
  error: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  logout: () => void;
};

// ... (VerifyTokenResponse remains the same)

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("authToken"));
  const [userRole, setUserRole] = useState<string | null>(() => localStorage.getItem("userRole"));
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem("userId"));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const response = await api.get<VerifyTokenResponse>("/api/verify-token", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data.status === "success") {
            const role = response.data.data.role || "";
            const fetchedUserId = response.data.data.userId || "";

            if (!role || role === "invalidRole") {
              throw new Error("Invalid role in response");
            }

            setIsAuthenticated(true);
            setUserRole(role);
            setUserId(fetchedUserId);
            localStorage.setItem("userRole", role);
            localStorage.setItem("userId", fetchedUserId);
          } else {
            throw new Error("Token verification failed: Invalid status in response");
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("authToken");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userId");
          setIsAuthenticated(false);
          setUserRole(null);
          setUserId(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    try {
      const response = await api.post("/login", { email, password });

      if (response.data?.data?.token) {
        const role = response.data.data.role || "learner";
        const token = response.data.data.token;
        const fetchedUserId = response.data.data.userId || ""; // Assuming userId is returned on login

        // Set token first
        localStorage.setItem("authToken", token);
        localStorage.setItem("userRole", role);
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
