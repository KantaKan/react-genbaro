import "./App.css";

import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/theme-provider";
import { Login } from "./components/auth/login";
import { SignUp } from "./components/auth/signup";
import BaroChart from "./components/BigBaroChart";
import { AuthProvider, useAuth } from "./AuthContext";
import Page from "./app/dashboard/page";
import UserDataProvider, { useUserData } from "./UserDataContext";
import { api } from "./lib/api";
import { AdminTablePage } from "./components/AdminTablePage";
import { AdminUsersPage } from "./pages/admin-users-page";
import UserReflectionsPage from "./pages/UserReflectionsPage";
import TalkBoardPage from "./pages/talk-board-page";
import PostPage from "./pages/PostPage";
import ReflectionsPage from "./pages/user-reflection";
import SplashCursor from "./components/SplashCursor";
import { DashboardMetrics } from "./components/dashboard-metrics";
import LatestWeeklySummary from "./components/latest-weekly-summary";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function AdminDashboard() {
  const [selectedCohort, setSelectedCohort] = useState<string | undefined>(undefined);

  return (
    <div className="flex flex-col gap-6 overflow-hidden p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of learner progress and reflection data</p>
        </div>
        <Select value={selectedCohort} onValueChange={(value) => setSelectedCohort(value === "all" ? undefined : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Cohort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cohorts</SelectItem>
            <SelectItem value="9">Cohort 9</SelectItem>
            <SelectItem value="10">Cohort 10</SelectItem>
            <SelectItem value="11">Cohort 11</SelectItem>
            <SelectItem value="12">Cohort 12</SelectItem>
            <SelectItem value="13">Cohort 13</SelectItem>
            <SelectItem value="14">Cohort 14</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <DashboardMetrics cohort={selectedCohort} />
      
      <BaroChart cohort={selectedCohort} />
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

import WeeklySummaryPage from "./pages/weekly-summary-page";
function AppContent() {
  const { isAuthenticated, userRole, error, login } = useAuth();
  const { refetchUserData } = useUserData();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    try {
      const role = await login(email, password);
      await refetchUserData();
      navigate(role === "learner" ? "/learner" : "/admin");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleSignUp = async (first_name: string, last_name: string, email: string, password: string, cohort_number: number, jsd_number: string, project_group: string, genmate_group: string, zoom_name: string) => {
    try {
      const response = await api.post("register", {
        first_name,
        last_name,
        email,
        password,
        cohort_number,
        jsd_number,
        project_group,
        genmate_group,
        zoom_name,
      });

      if (response.data.token) {
        navigate("/login");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: unknown) {
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
          <Route path="/signupxdd" element={!isAuthenticated ? <SignUp onSignUp={handleSignUp} /> : <Navigate to="/" replace />} />

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
            path="/admin/table/:id"
            element={
              <Page>
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UserReflectionsPage />
                </ProtectedRoute>
              </Page>
            }
          />

          <Route
            path="/admin/users"
            element={
              <Page>
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminUsersPage />
                </ProtectedRoute>
              </Page>
            }
          />
          <Route
            path="/admin/weekly-summary"
            element={
              <Page>
                <ProtectedRoute allowedRoles={["admin"]}>
                  <WeeklySummaryPage />
                </ProtectedRoute>
              </Page>
            }
          />

          <Route
            path="/learner"
            element={
              <ProtectedRoute allowedRoles={["learner"]}>
                <SplashCursor />
                <Page>
                  <div className="flex flex-col gap-8 p-6">
                    <ReflectionsPage />
                  </div>
                </Page>
              </ProtectedRoute>
            }
          />

          <Route
            path="/talk-board"
            element={
              <ProtectedRoute allowedRoles={["admin", "learner"]}>
                <Page>
                  <TalkBoardPage />
                </Page>
              </ProtectedRoute>
            }
          />

          <Route
            path="/talk-board/:postId"
            element={
              <ProtectedRoute allowedRoles={["admin", "learner"]}>
                <Page>
                  <PostPage />
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