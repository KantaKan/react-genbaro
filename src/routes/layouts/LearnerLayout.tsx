import { Outlet } from "react-router-dom";
import Page from "../../app/dashboard/page";
import SplashCursor from "../../components/SplashCursor";
import { ProtectedRoute } from "../ProtectedRoute";
import { LearnerNotificationBanner } from "../../components/learner-notification-banner";

export function LearnerLayout() {
  return (
    <ProtectedRoute allowedRoles={["learner"]}>
      <SplashCursor />
      <Page>
        <div className="flex flex-col gap-8 p-6">
          <LearnerNotificationBanner />
          <Outlet />
        </div>
      </Page>
    </ProtectedRoute>
  );
}

