import { Outlet } from "react-router-dom";
import { ProtectedRoute } from "../ProtectedRoute";
import { LearnerNotificationBanner } from "../../components/learner-notification-banner";
import { LearnerShell } from "../../learner/shell/LearnerShell";

export function LearnerLayout() {
  return (
    <ProtectedRoute allowedRoles={["learner", "admin"]}>
      <LearnerShell>
        <LearnerNotificationBanner />
        <div className="flex flex-col gap-6">
          <Outlet />
        </div>
      </LearnerShell>
    </ProtectedRoute>
  );
}
