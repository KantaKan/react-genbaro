import { useMemo, useState } from "react";
import { Flame, Sparkles, Stamp, Users } from "lucide-react";
import { useQuery } from "react-query";
import { useAuth } from "@/AuthContext";
import { useUserData } from "@/application/contexts/UserDataContext";
import { PageError, PageLoading } from "@/components/page-state";
import { ClearStamps } from "@/components/stamp/clear-stamps";
import { CohortBoard } from "@/components/stamp/cohort-board";
import { PosterExport } from "@/components/stamp/poster-export";
import { StampDefs } from "@/components/stamp/stamp-defs";
import { UploadStampButton } from "@/components/stamp/upload-stamp-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCohortInfo, getCohortStamps, listCohorts } from "@/lib/api";

export default function StampBoardPage() {
  const { userRole, userId } = useAuth();
  const { userData, loading: userDataLoading } = useUserData();
  const isAdmin = userRole === "admin";

  const cohortsQuery = useQuery(["stampCohorts"], () => listCohorts(), {
    enabled: isAdmin,
  });

  const defaultCohort = useMemo(() => {
    if (userData?.cohort_number && userData.cohort_number > 0) {
      return userData.cohort_number;
    }
    const first = cohortsQuery.data?.[0];
    return first ? first.cohortNumber : undefined;
  }, [userData, cohortsQuery.data]);

  const [selectedCohort, setSelectedCohort] = useState<number | undefined>(undefined);
  const cohortNumber = selectedCohort ?? defaultCohort;

  const cohortQuery = useQuery(
    ["stampCohort", cohortNumber],
    () => getCohortInfo(cohortNumber as number),
    { enabled: !!cohortNumber }
  );
  const stampsQuery = useQuery(
    ["stampBoard", cohortNumber],
    () => getCohortStamps(cohortNumber as number),
    { enabled: !!cohortNumber }
  );

  if (userDataLoading) {
    return <PageLoading label="Loading your stamp board" />;
  }

  if (!cohortNumber) {
    return (
      <PageError
        title="No cohort found"
        message="We couldn't figure out your cohort. Please try again later."
      />
    );
  }

  if (cohortQuery.isLoading || stampsQuery.isLoading) {
    return <PageLoading label="Loading stamps" />;
  }

  if (cohortQuery.isError || stampsQuery.isError) {
    return (
      <PageError
        title="Couldn't load the stamp board"
        message="Please try again in a moment."
      />
    );
  }

  const cohort = cohortQuery.data;
  const stamps = stampsQuery.data ?? [];
  const isLocked = cohort?.isLocked ?? false;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const stampedToday = stamps.filter((stamp) => new Date(stamp.createdAt) >= todayStart).length;
  const uniqueStampers = new Set(stamps.map((stamp) => stamp.ownerId)).size;
  const stampsToMilestone = 10 - (stamps.length % 10);
  const milestoneProgress = ((stamps.length % 10) / 10) * 100;

  return (
    <div className="container mx-auto py-10">
      <StampDefs />
      <div className="flex flex-wrap justify-between items-end mb-4 gap-4">
        <div>
          <h1 className="font-handwriting text-5xl text-foreground leading-none">Stamp Board</h1>
          <p className="text-muted-foreground mt-2">
            {isLocked
              ? "This board is closed — here's everything you stamped together."
              : "Paste a stamp onto your cohort's shared canvas."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Select
              value={String(cohortNumber)}
              onValueChange={(value) => setSelectedCohort(Number(value))}
            >
              <SelectTrigger className="w-[150px] cursor-pointer" aria-label="Select cohort">
                <SelectValue placeholder="Select Cohort" />
              </SelectTrigger>
              <SelectContent>
                {(cohortsQuery.data ?? []).map((item) => (
                  <SelectItem key={item.cohortNumber} value={String(item.cohortNumber)}>
                    Cohort {item.cohortNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {!isLocked && <UploadStampButton cohortNumber={cohortNumber} />}
          <PosterExport cohortNumber={cohortNumber} stamps={stamps} />
          {isAdmin && <ClearStamps cohortNumber={cohortNumber} />}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
          <Stamp className="h-3.5 w-3.5 text-primary" />
          <strong className="text-foreground">{stamps.length}</strong> total
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-primary" />
          <strong className="text-foreground">{uniqueStampers}</strong> stampers
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-amber-500" />
          <strong className="text-foreground">{stampedToday}</strong> stamped today
        </span>
        {stamps.length > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${milestoneProgress}%` }}
              />
            </div>
            {stampsToMilestone} to next milestone
          </span>
        )}
      </div>

      <CohortBoard stamps={stamps} isLocked={isLocked} canDelete={isAdmin} userId={userId} />
    </div>
  );
}
