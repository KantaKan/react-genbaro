import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

type AuthContextType = {
  isAuthenticated: boolean;
  userRole: string | null;
  error: string | null;
  loading: boolean; // Add loading state
  login: (email: string, password: string) => Promise<string>;
  logout: () => void;
};

type VerifyTokenResponse = {
  status: string;
  message: string;
  role: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("authToken"));
  const [userRole, setUserRole] = useState<string | null>(() => localStorage.getItem("userRole"));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      axios
        .get<VerifyTokenResponse>("/api/verify-token", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          if (response.data.status === "success") {
            const role = response.data?.role || "learner"; // Default to "learner" if no role is found
            console.log("Token verification successful:", response.data);
            setIsAuthenticated(true);
            setUserRole(role);
            localStorage.setItem("userRole", role); // Store the role in localStorage
          } else {
            throw new Error("Invalid role in response");
          }
        })
        .catch((error) => {
          console.error("Token verification failed:", error);
          localStorage.removeItem("authToken");
          localStorage.removeItem("userRole");
          setIsAuthenticated(false);
          setUserRole(null);
        })
        .finally(() => {
          setLoading(false); // Set loading to false after the request completes
        });
    } else {
      setLoading(false); // If no token is found, stop loading immediately
    }
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    try {
      const response = await fetch("http://127.0.0.1:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      console.log("Login response:", data);

      if (data?.data?.token) {
        const role = data.data.role || "learner"; // Set role to "learner" if empty
        localStorage.setItem("authToken", data.data.token);
        localStorage.setItem("userRole", role);
        setIsAuthenticated(true);
        setUserRole(role);
        setError(null);
        return role; // Return the role
      } else {
        throw new Error("No token in response");
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
    setIsAuthenticated(false);
    setUserRole(null);
    setError(null);
  };

  const value: AuthContextType = {
    isAuthenticated,
    userRole,
    error,
    loading, // Include loading state
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
