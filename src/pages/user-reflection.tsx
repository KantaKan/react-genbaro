"use client";

import { useUserData } from "@/UserDataContext";
import ReflectionsDashboard from "@/components/reflections-dashboard";
import { SkeletonCard } from "@/components/loading-skeleton";

export default function ReflectionsPage() {
  const { userData, loading, error, refetchUserData } = useUserData();

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <SkeletonCard count={3} />
      </div>
    );
  }

  if (error || !userData?._id) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center text-destructive">Error: Unable to load user data</div>
      </div>
    );
  }

  // Pass the user ID and reflections data directly
  return <ReflectionsDashboard userId={userData._id} initialReflections={userData.reflections || []} onReflectionSubmit={refetchUserData} />;
}
