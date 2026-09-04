import React, { Suspense, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SkeletonWarm } from "@/components/loading-skeleton";
import { getCohortGarden } from "@/lib/api";
import { mapGenmateMembers, toFarmMembers } from "@/lib/genmate-garden";
import { PlantTile } from "@/components/genmate-garden";
import { useWebglSupported } from "@/hooks/use-webgl-support";
import { useUserData } from "@/UserDataContext";

// three.js only loads once a learner flips to Farm for a group — same lazy
// boundary as the genmate farm on LearnerGenmateGardenPage.
const GenmateField = React.lazy(() =>
  import("@/components/farm/GenmateField").then((mod) => ({ default: mod.GenmateField }))
);

type ViewMode = "grid" | "farm";

/**
 * The cohort-wide memory farm (COHORT_FARM_SPEC.md) — every genmate group in
 * the learner's cohort, plus one "Unaffiliated" group for anyone without a
 * genmate_group, flattened into one shared field instead of per-group tabs.
 * The field itself scales its grid to headcount (`gridDimensionsForCount`)
 * instead of the genmate-group-sized 3×3, so a whole cohort doesn't silently
 * lose anyone past the 9th tile.
 */
const CohortGenmateGardenPage: React.FC = () => {
  const { userData } = useUserData();
  const cohortNumber = userData?.cohort_number ?? 0;

  const { data, isLoading, isError, refetch } = useQuery(
    ["cohortGarden", cohortNumber],
    () => getCohortGarden(cohortNumber),
    { enabled: cohortNumber > 0 }
  );

  const [view, setView] = useState<ViewMode>("grid");
  const webglSupported = useWebglSupported();

  const allMembersRaw = useMemo(() => (data ?? []).flatMap((g) => g.members), [data]);
  const members = useMemo(() => mapGenmateMembers(allMembersRaw), [allMembersRaw]);
  const farmMembers = useMemo(() => toFarmMembers(members), [members]);

  const averageStreak =
    members.length > 0
      ? members.reduce((sum, m) => sum + m.displayStreak, 0) / members.length
      : 0;

  const handleFarmContextLost = () => {
    setView("grid");
    toast.error("3D view lost — showing the grid instead");
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Sprout className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-3xl font-bold">Cohort Garden</h1>
      </div>

      <p className="text-muted-foreground max-w-2xl">
        Every learner in your cohort, standing together, grown through reflection streaks — a
        shared memory that keeps growing until the cohort wraps up. 🔥
      </p>

      {isLoading && (
        <Card className="w-full">
          <CardHeader>
            <SkeletonWarm className="h-6 w-40" />
            <SkeletonWarm className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <SkeletonWarm className="h-24 w-24 rounded-xl" />
                  <SkeletonWarm className="h-3 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Couldn't load the cohort garden</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Something went wrong while fetching the cohort garden. Try again.
            </p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && members.length === 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">
              <Sprout className="mr-2 inline-block h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Cohort Garden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No one's in the cohort garden yet — check back once reflections start rolling in.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && members.length > 0 && (
        <div className="flex flex-col gap-6">
          <Card className="w-full">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">Cohort {cohortNumber}</CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {members.length} members · avg {averageStreak.toFixed(1)} days
                  </span>
                  <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
                    <TabsList>
                      <TabsTrigger value="grid">Grid</TabsTrigger>
                      {webglSupported ? (
                        <TabsTrigger value="farm">Farm</TabsTrigger>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <TabsTrigger value="farm" disabled>
                                  Farm
                                </TabsTrigger>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>3D view isn't supported on this device</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {view === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {members.map((member) => (
                    <PlantTile key={member.user._id} member={member} />
                  ))}
                </div>
              ) : (
                <Suspense fallback={<SkeletonWarm className="aspect-[4/3] w-full rounded-xl" />}>
                  <GenmateField members={farmMembers} onContextLost={handleFarmContextLost} />
                </Suspense>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CohortGenmateGardenPage;
