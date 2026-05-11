import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/AuthContext";
import UserProfilePage from "./UserProfilePage";

const MyProfileWrapper: React.FC = () => {
  const { userId } = useAuth();

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  // Reuse the UserProfilePage but force it to the current user's ID
  // We'll wrap it so the useParams is overridden or we just redirect
  return <Navigate to={`/profile/${userId}`} replace />;
};

export default MyProfileWrapper;
