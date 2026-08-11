"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SkeletonWarm } from "@/components/loading-skeleton";
import { BoardReactionPicker } from "@/components/board-reaction-picker";
import { BoardReactionSummary } from "@/components/board-reaction-summary";
import { api } from "@/lib/api";
import { getPlantVariant } from "@/lib/plant-variants";
import {
  getPlantTier,
  getPlantTierConfig,
  getMilestoneForStreak,
  streakMilestones,
  getEffectivePlantDays,
} from "@/lib/streak-milestones";
import {
  calculateStreakData,
  getDisplayStreak,
} from "@/hooks/use-streak-calculation";
import type { Reflection } from "@/hooks/use-reflections";
import type { ProfileReaction } from "@/domain/types";
import { addPlantReaction } from "@/application/services/userService";
import { useAuth } from "@/AuthContext";
import { SeedlingPlant } from "@/components/streak-components";
import { getUserAvatarUrl, getAvatarFallback } from "@/lib/avatar";
import { formatDate } from "@/lib/utils";

export interface GardenUser {
  _id: string;
  first_name: string;
  last_name: string;
  cohort_number: number;
  genmate_group?: string;
  reflections?: Reflection[];
  growth_points?: number;
  plant_reactions?: ProfileReaction[];
  selected_palette?: string;
  selected_species?: string;
  selected_pot?: string;
  selected_leaf?: string;
  selected_flower?: string;
  selected_stem?: string;
}

interface AdminUsersResponse {
  data: {
    users: GardenUser[];
  };
}

export interface GardenMember {
  user: GardenUser;
  streakData: ReturnType<typeof calculateStreakData>;
  variant: ReturnType<typeof getPlantVariant>;
  displayStreak: number;
  tier: ReturnType<typeof getPlantTier>;
  growthPoints?: number;
}

export interface GardenGroup {
  name: string;
  members: GardenMember[];
  averageStreak: number;
}

interface GenmateGardenProps {
  cohort?: string;
}

export function GenmateGarden({ cohort }: GenmateGardenProps) {
  const { data, isLoading, isError, refetch } = useQuery<AdminUsersResponse>(
    ["adminGenmateGarden", cohort],
    () =>
      api
        .get(
          `/admin/users${cohort ? `?cohort=${cohort}&role=learner&limit=1000` : "?role=learner&limit=1000"}`
        )
        .then((res) => res.data),
    { enabled: true }
  );

  const users = useMemo(() => data?.data?.users ?? [], [data]);

  const groups: GardenGroup[] = useMemo(() => {
    const byGroup = new Map<string, GardenMember[]>();

    for (const user of users) {
      if (!user.genmate_group) continue;

      const streakData = calculateStreakData(user.reflections ?? []);
      const displayStreak = getDisplayStreak(streakData);
      const member: GardenMember = {
        user,
        streakData,
        variant: getPlantVariant(user._id, {
          palette: user.selected_palette,
          species: user.selected_species,
          pot: user.selected_pot,
          leaf: user.selected_leaf,
          flower: user.selected_flower,
          stem: user.selected_stem,
        }),
        displayStreak,
        tier: getPlantTier(getEffectivePlantDays(displayStreak, user.growth_points ?? 0)),
        growthPoints: user.growth_points ?? 0,
      };

      const list = byGroup.get(user.genmate_group);
      if (list) {
        list.push(member);
      } else {
        byGroup.set(user.genmate_group, [member]);
      }
    }

    const result: GardenGroup[] = [];
    for (const [name, members] of byGroup.entries()) {
      members.sort((a, b) => b.displayStreak - a.displayStreak);
      const averageStreak =
        members.length > 0
          ? members.reduce((sum, m) => sum + m.displayStreak, 0) / members.length
          : 0;
      result.push({ name, members, averageStreak });
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const groupedLearnerCount = groups.reduce((sum, g) => sum + g.members.length, 0);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <SkeletonWarm className="h-6 w-40" />
          <SkeletonWarm className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <SkeletonWarm className="h-24 w-24 rounded-xl" />
                <SkeletonWarm className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Couldn't load the garden</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching learners. Try again.
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
    );
  }

  if (groups.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">
            <Sprout className="mr-2 inline-block h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Genmate Garden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {users.length === 0
              ? "No learners found for this cohort yet."
              : "No learners have a genmate group assigned yet."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {cohort ? `Cohort ${cohort}` : "All cohorts"} · {groupedLearnerCount} learners across {groups.length} genmate group{groups.length === 1 ? "" : "s"}
      </p>

      {groups.map((group) => (
        <Card key={group.name} className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{group.name}</CardTitle>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {group.members.length} members · avg {group.averageStreak.toFixed(1)} days
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {group.members.map((member) => (
                <PlantTile key={member.user._id} member={member} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PlantTile({ member }: { member: GardenMember }) {
  const { user, streakData, variant, displayStreak, tier, growthPoints } = member;
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unknown learner";
  const nextMilestone = streakMilestones.find((m) => m.days > displayStreak) ?? null;
  const daysToNext = nextMilestone ? nextMilestone.days - displayStreak : 0;
  const tierConfig = getPlantTierConfig(tier);

  const { userId: currentUserId } = useAuth();
  const queryClient = useQueryClient();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const plantReactions = user.plant_reactions ?? [];
  const currentReaction = plantReactions.find((r) => r.userId === currentUserId);

  const cheerMutation = useMutation(
    (payload: { type: string; value: string }) => addPlantReaction(user._id, payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["learnerGenmateGarden"]);
        queryClient.invalidateQueries(["adminGenmateGarden"]);
      },
      onError: () => {
        toast.error("Couldn't cheer that plant. Please try again.");
      },
    }
  );

  const handleCheer = (event: MouseEvent, reaction: string) => {
    event.preventDefault();
    cheerMutation.mutate({ type: "emoji", value: reaction });
    setShowReactionPicker(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${fullName}, ${displayStreak > 0 ? `${displayStreak}-day streak` : "no active streak"}`}
          className="flex flex-col items-center gap-1.5 cursor-pointer rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage
              src={getUserAvatarUrl(user.first_name, user.last_name)}
              alt={fullName}
            />
            <AvatarFallback className="text-[10px]">
              {getAvatarFallback(user.first_name, user.last_name)}
            </AvatarFallback>
          </Avatar>
          <SeedlingPlant
            tier={tier}
            active={streakData.hasCurrentStreak}
            variant={variant}
            growthPoints={growthPoints}
            showParticles={false}
            className="h-16 w-14 flex-shrink-0"
          />
          <span className="max-w-full truncate text-xs font-medium">
            {user.first_name}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {displayStreak > 0 ? `${displayStreak} day${displayStreak === 1 ? "" : "s"}` : "—"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={getUserAvatarUrl(user.first_name, user.last_name)}
                alt={fullName}
              />
              <AvatarFallback>
                {getAvatarFallback(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{fullName}</span>
              <span className="text-xs text-muted-foreground">
                {user.cohort_number ? `Cohort ${user.cohort_number}` : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SeedlingPlant
              tier={tier}
              active={streakData.hasCurrentStreak}
              variant={variant}
              growthPoints={growthPoints}
              className="h-14 w-12 flex-shrink-0"
            />
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="font-semibold tabular-nums">
                {displayStreak} day{displayStreak === 1 ? "" : "s"}
                {streakData.hasCurrentStreak ? " 🔥" : ""}
              </span>
              <span className="text-xs capitalize text-muted-foreground">
                {tierConfig.name}
              </span>
            </div>
          </div>

          <dl className="flex flex-col gap-1.5 border-t pt-3 text-sm">
            {streakData.hasCurrentStreak && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Current streak</dt>
                <dd className="tabular-nums">{streakData.currentStreak} days</dd>
              </div>
            )}
            {streakData.oldStreak > 0 && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Previous streak</dt>
                <dd className="tabular-nums">{streakData.oldStreak} days</dd>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Last active</dt>
              <dd>
                {streakData.lastActiveDate
                  ? formatDate(streakData.lastActiveDate)
                  : "Never"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Reflections</dt>
              <dd className="tabular-nums">{user.reflections?.length ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Next milestone</dt>
              <dd>
                {nextMilestone ? (
                  <span className="tabular-nums">
                    {nextMilestone.days} days ({daysToNext} to go)
                  </span>
                ) : (
                  <span>{getMilestoneForStreak(displayStreak)?.emoji ?? "🌱"} Reached the top!</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2 border-t pt-3">
            <div className="flex items-center justify-between gap-2">
              <BoardReactionSummary
                reactions={plantReactions.map((r) => ({
                  ...r,
                  id: r.id || "",
                  userId: r.userId || "",
                  type: (r.type === "image" ? "image" : "emoji") as "emoji" | "image",
                }))}
                currentReaction={currentReaction?.value}
                className="flex items-center gap-2"
                itemClassName="flex items-center gap-1"
              />
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={cheerMutation.isLoading}
                  onClick={() => setShowReactionPicker((v) => !v)}
                >
                  🌱 {currentReaction ? "Change cheer" : "Cheer"}
                </Button>
                {showReactionPicker && (
                  <BoardReactionPicker
                    currentReaction={currentReaction?.value}
                    hasReaction={!!currentReaction}
                    onReact={handleCheer}
                    onRemove={() => setShowReactionPicker(false)}
                    className="absolute top-9 right-0 z-50 flex gap-1.5 bg-card p-2 rounded-2xl border shadow-2xl"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
