import React from "react";
import { AllUsers } from "@/components/AllUsers";
import { Users } from "lucide-react";
import { useAuth } from "@/AuthContext";
import { useUserData } from "@/application/contexts/UserDataContext";

const LearnerDirectoryPage: React.FC = () => {
  const { userRole } = useAuth();
  const { userData } = useUserData();
  const isAdmin = userRole === "admin";
  const currentCohort = userData?.cohort_number;

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Learner Directory</h1>
      </div>
      
      {isAdmin ? (
        <p className="text-muted-foreground max-w-2xl">
          Browse and manage learners across all cohorts. You can filter by cohort, view social profiles, and manage learner details.
        </p>
      ) : (
        <p className="text-muted-foreground max-w-2xl">
          Browse and discover your fellow learners in <span className="text-primary font-bold">Cohort {currentCohort}</span>. Click on a name to view their profile, see their badges, and leave a recommendation!
        </p>
      )}

      <AllUsers />
    </div>
  );
};

export default LearnerDirectoryPage;
