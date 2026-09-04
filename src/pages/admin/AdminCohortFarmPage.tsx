import React, { Suspense, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkeletonWarm } from "@/components/loading-skeleton";
import { getCohortGarden } from "@/lib/api";
import { mapGenmateMembers, toFarmMembers } from "@/lib/genmate-garden";
import { PlantTile } from "@/components/genmate-garden";
import { useWebglSupported } from "@/hooks/use-webgl-support";

const GenmateField = React.lazy(() =>
  import("@/components/farm/GenmateField").then((mod) => ({ default: mod.GenmateField }))
);

type ViewMode = "grid" | "farm";
const COHORT_OPTIONS = ["9", "10", "11", "12", "13", "14"];

/**
 * The admin equivalent of the learner's cohort-wide field
 * (`CohortGenmateGardenPage.tsx`) — same flattened "everyone in one field"
 * view, same `getCohortGarden` endpoint (already admin-bypass-enabled via
 * `enforceCohortAccess`), just with a cohort picker instead of the learner's
 * own `cohort_number` since an admin has no home cohort of their own.
 *
 * Deliberately a separate page from `/admin/garden`, which keeps its
 * existing per-genmate-group stacked-card view unchanged — this page is
 * "one whole cohort together," not a replacement for that one.
 */
export function AdminCohortFarmPage() {
  const [cohortNumber, setCohortNumber] = useState(COHORT_OPTIONS[COHORT_OPTIONS.length - 1]);
  const [view, setView] = useState<ViewMode>("grid");
  const webglSupported = useWebglSupported();

  const { data, isLoading, isError, refetch } = useQuery(
    ["cohortGarden", cohortNumber],
    () => getCohortGarden(Number(cohortNumber))
  );

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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Sprout className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          <h1 className="text-3xl font-bold">Cohort Field</h1>
        </div>
        <Select value={cohortNumber} onValueChange={setCohortNumber}>
          <SelectTrigger className="w-[180px] cursor-pointer" aria-label="Select cohort">
            <SelectValue placeholder="Select Cohort" />
          </SelectTrigger>
          <SelectContent>
            {COHORT_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                Cohort {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-muted-foreground max-w-2xl">
        Every learner in the selected cohort, standing together on one field — the same view
        learners get for their own cohort, picked here by cohort number.
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
            <CardTitle className="text-lg">Couldn't load this cohort's field</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Something went wrong while fetching Cohort {cohortNumber}. Try again.
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
              Cohort {cohortNumber}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No learners found for this cohort yet.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && members.length > 0 && (
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
      )}
    </div>
  );
}
