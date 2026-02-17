import "./App.css";

import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/theme-provider";
import { Login } from "./components/auth/login";
import { SignUp } from "./components/auth/signup";
import { AuthProvider, useAuth } from "./AuthContext";
import UserDataProvider from "./UserDataContext";
import { AdminTablePage } from "./components/AdminTablePage";
import { AdminUsersPage } from "./pages/admin-users-page";
import UserReflectionsPage from "./pages/UserReflectionsPage";
import TalkBoardPage from "./pages/talk-board-page";
import PostPage from "./pages/PostPage";
import ReflectionsPage from "./pages/user-reflection";
import ToolsPage from "./pages/ToolPage";
import SpinWheelPage from "./pages/SpinWheelPage";
import WeeklySummaryPage from "./pages/weekly-summary-page";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminLayout } from "./routes/layouts/AdminLayout";
import { AuthedPageLayout } from "./routes/layouts/AuthedPageLayout";
import { LearnerLayout } from "./routes/layouts/LearnerLayout";
import { AppErrorBanner } from "./components/AppErrorBanner";
import { useAuthActions } from "./features/auth/useAuthActions";

function AppContent() {
  const { isAuthenticated, error } = useAuth();
  const { handleLogin, handleSignUp, homeRoute } = useAuthActions();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {error && <AppErrorBanner error={error} />}

        <Routes>
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/signupxdd"
            element={
              !isAuthenticated ? (
                <SignUp
                  onSignUp={async (
                    first_name,
                    last_name,
                    email,
                    password,
                    cohort_number,
                    jsd_number,
                    project_group,
                    genmate_group,
                    zoom_name
                  ) =>
                    handleSignUp({
                      first_name,
                      last_name,
                      email,
                      password,
                      cohort_number,
                      jsd_number,
                      project_group,
                      genmate_group,
                      zoom_name,
                    })
                  }
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="table" element={<AdminTablePage />} />
            <Route path="table/:id" element={<UserReflectionsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="weekly-summary" element={<WeeklySummaryPage />} />
          </Route>

          <Route path="/learner" element={<LearnerLayout />}>
            <Route index element={<ReflectionsPage />} />
          </Route>

          <Route
            element={<AuthedPageLayout allowedRoles={["admin", "learner"]} />}
          >
            <Route path="/talk-board" element={<TalkBoardPage />} />
            <Route path="/talk-board/:postId" element={<PostPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/tools/spin-wheel" element={<SpinWheelPage />} />
          </Route>

          <Route
            path="/"
            element={
              <Navigate to={homeRoute} replace />
            }
          />
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
