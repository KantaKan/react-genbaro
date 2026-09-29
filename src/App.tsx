import "./App.css";
import "react-toastify/dist/ReactToastify.css";

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/theme-provider";
import { ToastContainer } from "react-toastify";
import { Login } from "./components/auth/login";
import { SignUp } from "./components/auth/signup";
import { AuthProvider, useAuth } from "./application/contexts/AuthContext";
import UserDataProvider from "./application/contexts/UserDataContext";
import { AdminLayout } from "./routes/layouts/AdminLayout";
import { AuthedPageLayout } from "./routes/layouts/AuthedPageLayout";
import { LearnerLayout } from "./routes/layouts/LearnerLayout";
import { AppErrorBanner } from "./components/AppErrorBanner";
import { useAuthActions } from "./features/auth/useAuthActions";

const AdminTablePage = lazy(() => import("./components/AdminTablePage").then((module) => ({ default: module.AdminTablePage })));
const AdminUsersPage = lazy(() => import("./pages/admin-users-page").then((module) => ({ default: module.AdminUsersPage })));
const UserReflectionsPage = lazy(() => import("./pages/UserReflectionsPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const LearnerDirectoryPage = lazy(() => import("./pages/LearnerDirectoryPage"));
const MyProfileWrapper = lazy(() => import("./pages/MyProfileWrapper"));
const LearnerGenmateGardenPage = lazy(() => import("./pages/LearnerGenmateGardenPage"));
const CohortGenmateGardenPage = lazy(() => import("./pages/CohortGenmateGardenPage"));
const TalkBoardPage = lazy(() => import("./pages/talk-board-page"));
const PostPage = lazy(() => import("./pages/PostPage"));
const StampBoardPage = lazy(() => import("./pages/stamp-board-page"));
const ReflectionsPage = lazy(() => import("./pages/user-reflection"));
const ToolsPage = lazy(() => import("./pages/ToolPage"));
const SpinWheelPage = lazy(() => import("./pages/SpinWheelPage"));
const WeeklySummaryPage = lazy(() => import("./pages/weekly-summary-page"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then((module) => ({ default: module.AdminDashboard })));
const GenmateGardenPage = lazy(() => import("./pages/admin/GenmateGardenPage").then((module) => ({ default: module.GenmateGardenPage })));
const AdminCohortFarmPage = lazy(() => import("./pages/admin/AdminCohortFarmPage").then((module) => ({ default: module.AdminCohortFarmPage })));
const AttendanceShell = lazy(() => import("./components/attendance-shell").then((module) => ({ default: module.AttendanceShell })));
const AttendanceRegisterView = lazy(() => import("./components/attendance-register-view").then((module) => ({ default: module.AttendanceRegisterView })));
const AttendanceAllStudentsView = lazy(() => import("./components/attendance-all-students-view").then((module) => ({ default: module.AttendanceAllStudentsView })));
const AttendanceCalendarView = lazy(() => import("./components/attendance-calendar-view").then((module) => ({ default: module.AttendanceCalendarView })));
const AttendanceLogsView = lazy(() => import("./components/attendance-logs-view").then((module) => ({ default: module.AttendanceLogsView })));
const AttendanceLeaveView = lazy(() => import("./components/attendance-leave-view").then((module) => ({ default: module.AttendanceLeaveView })));
const AttendanceCodeDispatchView = lazy(() => import("./components/attendance/attendance-code-dispatch-view").then((module) => ({ default: module.AttendanceCodeDispatchView })));
const StudentAttendance = lazy(() => import("./components/student-attendance").then((module) => ({ default: module.StudentAttendance })));
const LeaveRequestsTable = lazy(() => import("./components/leave-requests-table").then((module) => ({ default: module.LeaveRequestsTable })));
const StudentAttendanceDetail = lazy(() => import("./pages/student-attendance-detail").then((module) => ({ default: module.StudentAttendanceDetail })));
const AdminNotificationManager = lazy(() => import("./components/admin-notification-manager"));
const AdminHistoryPage = lazy(() => import("./pages/admin-history-page"));
const PlantVisualQaPage = lazy(() => import("./pages/PlantVisualQaPage"));
const BaroCharacterPage = lazy(() => import("./pages/BaroCharacterPage"));
const ShowcaseLawnPage = lazy(() => import("./pages/ShowcaseLawnPage"));

function AppContent() {
  const { isAuthenticated, error } = useAuth();
  const { handleLogin, handleSignUp, homeRoute } = useAuthActions();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {error && <AppErrorBanner error={error} />}

        <Suspense fallback={<div role="status" className="flex min-h-48 items-center justify-center text-sm font-semibold">กำลังโหลดหน้า…</div>}>
        <Routes>
          {import.meta.env.DEV && <Route path="/dev/plant-matrix" element={<PlantVisualQaPage />} />}
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
            <Route path="garden" element={<GenmateGardenPage />} />
            <Route path="cohort-farm" element={<AdminCohortFarmPage />} />
            <Route path="weekly-summary" element={<WeeklySummaryPage />} />
            <Route path="attendance" element={<AttendanceShell />}>
              <Route index element={<Navigate to="register" replace />} />
              <Route path="register" element={<AttendanceRegisterView />} />
              <Route path="code-dispatch" element={<AttendanceCodeDispatchView />} />
              <Route path="all-students" element={<AttendanceAllStudentsView />} />
              <Route path="calendar" element={<AttendanceCalendarView />} />
              <Route path="logs" element={<AttendanceLogsView />} />
              <Route path="leave" element={<AttendanceLeaveView />} />
            </Route>
            <Route path="attendance/student/:id" element={<StudentAttendanceDetail />} />
            <Route path="leave-requests" element={<LeaveRequestsTable />} />
            <Route path="notifications" element={<AdminNotificationManager />} />
            <Route path="history" element={<AdminHistoryPage />} />
          </Route>

          <Route path="/learner" element={<LearnerLayout />}>
            <Route index element={<ReflectionsPage />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="directory" element={<LearnerDirectoryPage />} />
            <Route path="my-profile" element={<MyProfileWrapper />} />
            <Route path="garden" element={<LearnerGenmateGardenPage />} />
            <Route path="cohort-garden" element={<CohortGenmateGardenPage />} />
          </Route>

          <Route
            element={<AuthedPageLayout allowedRoles={["admin", "learner"]} />}
          >
            <Route path="/profile/:id" element={<UserProfilePage />} />
            <Route path="/talk-board" element={<TalkBoardPage />} />
            <Route path="/talk-board/:postId" element={<PostPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/tools/spin-wheel" element={<SpinWheelPage />} />
            <Route path="/stamp-board" element={<StampBoardPage />} />
            <Route path="/character" element={<BaroCharacterPage />} />
            <Route path="/showcase-lawn" element={<ShowcaseLawnPage />} />
          </Route>

          <Route
            path="/"
            element={
              <Navigate to={homeRoute} replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
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
