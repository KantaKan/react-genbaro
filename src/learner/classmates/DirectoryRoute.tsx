import { lazy } from "react";
import { useAuth } from "@/application/contexts/AuthContext";
import { ClassmatesPage } from "./ClassmatesPage";

const LearnerDirectoryPage = lazy(() => import("@/pages/LearnerDirectoryPage"));

/** Learners get the new Classmates page; admins keep the cross-cohort directory. */
export default function DirectoryRoute() {
  const { userRole } = useAuth();
  return userRole === "admin" ? <LearnerDirectoryPage /> : <ClassmatesPage />;
}
