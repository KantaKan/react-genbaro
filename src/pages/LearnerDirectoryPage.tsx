import React from "react";
import { AllUsers } from "@/components/AllUsers";
import { Users } from "lucide-react";

const LearnerDirectoryPage: React.FC = () => {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Learner Directory</h1>
      </div>
      <p className="text-muted-foreground">
        Browse and discover your fellow learners. Click on a name to view their profile, see their badges, and leave a recommendation!
      </p>
      <AllUsers />
    </div>
  );
};

export default LearnerDirectoryPage;
