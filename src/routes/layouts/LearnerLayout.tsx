import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Page from "../../app/dashboard/page";
import SplashCursor from "../../components/SplashCursor";
import { ProtectedRoute } from "../ProtectedRoute";
import { LearnerNotificationBanner } from "../../components/learner-notification-banner";

const STORAGE_KEY = "splash-cursor-enabled";

export function LearnerLayout() {
  const [cursorEnabled, setCursorEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setCursorEnabled(stored === "true");
    }
  }, []);

  const toggleCursor = () => {
    const newValue = !cursorEnabled;
    setCursorEnabled(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
  };

  return (
    <ProtectedRoute allowedRoles={["learner"]}>
      {cursorEnabled && <SplashCursor />}
      <Page>
        <div className="flex items-center justify-between">
          <LearnerNotificationBanner />
          <button
            onClick={toggleCursor}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={cursorEnabled ? "Disable mouse effect" : "Enable mouse effect"}
          >
            <span className="text-base">
              {cursorEnabled ? "✨" : "⚫"}
            </span>
            <span className="hidden sm:inline">
              {cursorEnabled ? "Effect On" : "Effect Off"}
            </span>
          </button>
        </div>
        <div className="flex flex-col gap-8 p-6 pt-3">
          <Outlet />
        </div>
      </Page>
    </ProtectedRoute>
  );
}

