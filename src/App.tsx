import "./App.css";

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/theme-provider";
import { IslandToaster } from "./components/IslandToaster";
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
const DirectoryRoute = lazy(() => import("./learner/classmates/DirectoryRoute"));
const BoardPage = lazy(() => import("./learner/board/BoardPage").then((module) => ({ default: module.BoardPage })));
const MyProfilePage = lazy(() => import("./learner/profile/MyProfilePage").then((module) => ({ default: module.MyProfilePage })));
const LearnerGenmateGardenPage = lazy(() => import("./pages/LearnerGenmateGardenPage"));
const CohortGenmateGardenPage = lazy(() => import("./pages/CohortGenmateGardenPage"));
const TalkBoardPage = lazy(() => import("./pages/talk-board-page"));
const PostPage = lazy(() => import("./pages/PostPage"));
const StampBoardPage = lazy(() => import("./pages/stamp-board-page"));
const ReflectionsPage = lazy(() => import("./learner/reflections/ReflectionsPage"));
const TodayPage = lazy(() => import("./learner/today/TodayPage").then((module) => ({ default: module.TodayPage })));
const AttendancePage = lazy(() => import("./learner/attendance/AttendancePage").then((module) => ({ default: module.AttendancePage })));
const ToolsPage = lazy(() => import("./pages/ToolPage"));
const SpinWheelPage = lazy(() => import("./pages/SpinWheelPage"));
const WeeklySummaryPage = lazy(() => import("./admin/reflections/WeeklySummaryPage").then((m) => ({ default: m.WeeklySummaryPage })));
const AdminTodayPage = lazy(() => import("./admin/today/TodayPage").then((m) => ({ default: m.TodayPage })));
const AdminRegisterPage = lazy(() => import("./admin/attendance/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const AdminMonthPage = lazy(() => import("./admin/attendance/MonthPage").then((m) => ({ default: m.MonthPage })));
const AdminRulesPage = lazy(() => import("./admin/cohort/RulesPage").then((m) => ({ default: m.RulesPage })));
const AdminHolidaysPage = lazy(() => import("./admin/cohort/HolidaysPage").then((m) => ({ default: m.HolidaysPage })));
const AdminGroupsPage = lazy(() => import("./admin/cohort/GroupsPage").then((m) => ({ default: m.GroupsPage })));
const AdminExportsPage = lazy(() => import("./admin/cohort/ExportsPage").then((m) => ({ default: m.ExportsPage })));
const AdminActivityPage = lazy(() => import("./admin/cohort/ActivityPage").then((m) => ({ default: m.ActivityPage })));
const AdminAnnouncePage = lazy(() => import("./admin/cohort/AnnouncePage").then((m) => ({ default: m.AnnouncePage })));
const AdminSupportPage = lazy(() => import("./admin/support/SupportPage").then((m) => ({ default: m.SupportPage })));
const AdminLearnersPage = lazy(() => import("./admin/learners/LearnersPage").then((m) => ({ default: m.LearnersPage })));
const AdminProfilePage = lazy(() => import("./admin/learners/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const AdminReflectionsPage = lazy(() => import("./admin/reflections/ReflectionsPage").then((m) => ({ default: m.ReflectionsPage })));
const AdminLeavePage = lazy(() => import("./admin/leave/LeavePage").then((m) => ({ default: m.LeavePage })));
const AdminBoardPage = lazy(() => import("./admin/board/BoardPage").then((m) => ({ default: m.AdminBoardPage })));
const AdminCalendarPage = lazy(() => import("./admin/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const LearnerCalendarPage = lazy(() => import("./learner/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const AdminReportPage = lazy(() => import("./admin/report/ReportPage").then((m) => ({ default: m.ReportPage })));
const AdminSlackPage = lazy(() => import("./admin/slack/SlackPage").then((m) => ({ default: m.SlackPage })));
const AdminTeamPage = lazy(() => import("./admin/team/TeamPage").then((m) => ({ default: m.TeamPage })));
const InvitePage = lazy(() => import("./admin/team/InvitePage").then((m) => ({ default: m.InvitePage })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then((module) => ({ default: module.AdminDashboard })));
const GenmateGardenPage = lazy(() => import("./pages/admin/GenmateGardenPage").then((module) => ({ default: module.GenmateGardenPage })));
const AdminCohortFarmPage = lazy(() => import("./pages/admin/AdminCohortFarmPage").then((module) => ({ default: module.AdminCohortFarmPage })));
const AttendanceShell = lazy(() => import("./components/attendance-shell").then((module) => ({ default: module.AttendanceShell })));
const AttendanceAllStudentsView = lazy(() => import("./components/attendance-all-students-view").then((module) => ({ default: module.AttendanceAllStudentsView })));
const StudentAttendanceDetail = lazy(() => import("./pages/student-attendance-detail").then((module) => ({ default: module.StudentAttendanceDetail })));
const CupAwardsPage = lazy(() => import("./pages/admin/CupAwardsPage"));
const AdminNotificationManager = lazy(() => import("./components/admin-notification-manager"));
const AdminHistoryPage = lazy(() => import("./pages/admin-history-page"));
const PlantVisualQaPage = lazy(() => import("./pages/PlantVisualQaPage"));
const BaroCharacterPage = lazy(() => import("./pages/BaroCharacterPage"));
const ShowcaseLawnPage = lazy(() => import("./pages/ShowcaseLawnPage"));
const StartupStoryPage = lazy(() => import("./pages/StartupStoryPage"));

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
          <Route path="/invite/:token" element={<InvitePage />} />
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
            <Route index element={<AdminTodayPage />} />
            <Route path="overview" element={<AdminDashboard />} />
            <Route path="leave" element={<AdminLeavePage />} />
            <Route path="reflections" element={<AdminReflectionsPage />} />
            <Route path="learners" element={<AdminLearnersPage />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route path="rules" element={<AdminRulesPage />} />
            <Route path="holidays" element={<AdminHolidaysPage />} />
            <Route path="groups" element={<AdminGroupsPage />} />
            <Route path="exports" element={<AdminExportsPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="team" element={<AdminTeamPage />} />
            <Route path="settings/slack" element={<AdminSlackPage />} />
            <Route path="report" element={<AdminReportPage />} />
            <Route path="calendar" element={<AdminCalendarPage />} />
            <Route path="board" element={<AdminBoardPage />} />
            <Route path="announce" element={<AdminAnnouncePage />} />
            <Route path="learners/:id" element={<AdminProfilePage />} />
            <Route path="leave-requests" element={<Navigate to="/admin/leave" replace />} />
            <Route path="table" element={<AdminTablePage />} />
            <Route path="table/:id" element={<UserReflectionsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="garden" element={<GenmateGardenPage />} />
            <Route path="cohort-farm" element={<AdminCohortFarmPage />} />
            <Route path="weekly-summary" element={<WeeklySummaryPage />} />
            <Route path="attendance/register" element={<AdminRegisterPage />} />
            <Route path="attendance/month" element={<AdminMonthPage />} />
            <Route path="attendance" element={<AttendanceShell />}>
              <Route index element={<Navigate to="register" replace />} />
              <Route path="code-dispatch" element={<Navigate to="/admin" replace />} />
              <Route path="all-students" element={<AttendanceAllStudentsView />} />
              <Route path="calendar" element={<Navigate to="/admin/attendance/month" replace />} />
              <Route path="logs" element={<Navigate to="/admin/activity" replace />} />
              <Route path="leave" element={<Navigate to="/admin/leave" replace />} />
            </Route>
            <Route path="attendance/student/:id" element={<StudentAttendanceDetail />} />
            <Route path="notifications" element={<AdminNotificationManager />} />
            <Route path="cup" element={<CupAwardsPage />} />
            <Route path="history" element={<AdminHistoryPage />} />
          </Route>

          <Route path="/learner" element={<LearnerLayout />}>
            <Route index element={<TodayPage />} />
            <Route path="reflections" element={<ReflectionsPage />} />
            <Route path="calendar" element={<LearnerCalendarPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="directory" element={<DirectoryRoute />} />
            <Route path="my-profile" element={<MyProfilePage />} />
            <Route path="board" element={<BoardPage />} />
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
            <Route path="/startup-story" element={<StartupStoryPage />} />
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

        <IslandToaster />
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
