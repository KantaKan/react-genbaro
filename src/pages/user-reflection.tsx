"use client";

import { useUserData } from "@/UserDataContext";
import ReflectionsDashboard from "@/components/reflections-dashboard";
import { SkeletonWarm } from "@/components/loading-skeleton";

export default function ReflectionsPage() {
  const { userData, loading, error, refetchUserData } = useUserData();

  if (loading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <SkeletonWarm className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 space-y-3 paper-texture">
              <SkeletonWarm className="h-5 w-2/5" />
              <SkeletonWarm className="h-4 w-full" />
              <SkeletonWarm className="h-4 w-3/4" />
            </div>
          ))}
        </div>
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
