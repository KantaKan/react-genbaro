import "./App.css";
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/theme-provider";
import { AllUsers } from "./components/AllUsers";
import { Login } from "./components/auth/login";
import { SignUp } from "./components/auth/signup";
import { BaroChart } from "./components/BigBaroChart";

import { FillChart } from "./components/FillChart";
import { GenMateChart } from "./components/PieChart";

import { mockReflections } from "./mockData/reflections";
import { AuthProvider, useAuth } from "./AuthContext";
import Page from "./app/dashboard/page";
import UserDataProvider from "./UserDataContext";

import { api } from "./lib/api";
import ReflectionsTableWithModal from "./components/reflections-table-with-modal";

import { AdminTablePage } from "./components/AdminTablePage";

function AdminDashboard() {
  return (
    <div className="flex flex-col gap-2 overflow-hidden p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <nav className="mb-4">
        <Link to="/admin/table" className="text-blue-500 hover:text-blue-700">
          View Admin Reflections Table
        </Link>
      </nav>
      <div className="flex-1 h-1/2 mb-6">
        <BaroChart />
      </div>
      <div className="flex gap-4 h-full overflow-hidden">
        <div className="w-1/3">
          <h2 className="text-xl font-semibold mb-4">Fill Rate</h2>
          <FillChart />
        </div>
        <div className="w-1/3">
          <h2 className="text-xl font-semibold mb-4">General Metrics</h2>
          <GenMateChart />
        </div>
        <div className="w-1/3">
          <h2 className="text-xl font-semibold mb-4">User List</h2>
          <AllUsers />
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole || "")) {
    console.log(`User role ${userRole} not in allowed roles:`, allowedRoles);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated, userRole, error, login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log("Attempting login...");
      const role = await login(email, password);
      console.log("Login successful, role:", role);
      navigate(role === "learner" ? "/learner" : "/admin");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleSignUp = async (first_name: string, last_name: string, email: string, password: string, cohort_number: string) => {
    try {
      const response = await api.post("register", {
        first_name,
        last_name,
        email,
        password,
        cohort_number,
      });

      console.log("SignUp response:", response.data);

      if (response.status === 201 && response.data.token) {
        await login(email, password);
        navigate(response.data.role === "learner" ? "/learner" : "/admin");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Sign-up error:", err);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} />
          <Route path="/signup" element={!isAuthenticated ? <SignUp onSignUp={handleSignUp} /> : <Navigate to="/" replace />} />

          <Route
            path="/admin"
            element={
              <Page>
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              </Page>
            }
          />

          <Route
            path="/admin/table"
            element={
              <Page>
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminTablePage />
                </ProtectedRoute>
              </Page>
            }
          />

          <Route
            path="/learner"
            element={
              <ProtectedRoute allowedRoles={["learner"]}>
                <Page>
                  <div className="flex flex-col gap-8 p-6">
                    <h1 className="text-3xl font-bold">Learner Dashboard</h1>
                    <ReflectionsTableWithModal />
                  </div>
                </Page>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to={isAuthenticated ? (userRole === "learner" ? "/learner" : "/admin") : "/login"} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <AppContent />
      </UserDataProvider>
    </AuthProvider>
  );
}

export default App;
