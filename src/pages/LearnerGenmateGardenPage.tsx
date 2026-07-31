import React, { useMemo } from "react";
import { useQuery } from "react-query";
import { Sprout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonWarm } from "@/components/loading-skeleton";
import { getMyGenmateGarden } from "@/lib/api";
import { mapGenmateMembers } from "@/lib/genmate-garden";
import { PlantTile } from "@/components/genmate-garden";

const LearnerGenmateGardenPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery(
    ["learnerGenmateGarden"],
    getMyGenmateGarden
  );

  const members = useMemo(() => mapGenmateMembers(data ?? []), [data]);

  const averageStreak =
    members.length > 0
      ? members.reduce((sum, m) => sum + m.displayStreak, 0) / members.length
      : 0;

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Sprout className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-3xl font-bold">Genmate Garden</h1>
      </div>

      <p className="text-muted-foreground max-w-2xl">
        Your genmate group, grown through reflection streaks. Cheer your genmates on as their plants grow! 🔥
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
            <CardTitle className="text-lg">Couldn't load the garden</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Something went wrong while fetching your genmate garden. Try again.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => refetch()}
            >
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
              Genmate Garden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You don't have a genmate group assigned yet. Once you do, your garden will bloom here!
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && members.length > 0 && (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-muted-foreground">
            {members[0].user.genmate_group} · {members.length} members · avg{" "}
            {averageStreak.toFixed(1)} days
          </p>

          <Card className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {members[0].user.genmate_group}
                </CardTitle>
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {members.length} members · avg {averageStreak.toFixed(1)} days
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {members.map((member) => (
                  <PlantTile key={member.user._id} member={member} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LearnerGenmateGardenPage;
