"use client";

import React, { Suspense, useMemo, useState, type MouseEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SkeletonWarm } from "@/components/loading-skeleton";
import { BoardReactionPicker } from "@/components/board-reaction-picker";
import { BoardReactionSummary } from "@/components/board-reaction-summary";
import { api } from "@/lib/api";
import { toFarmMembers } from "@/lib/genmate-garden";
import { useWebglSupported } from "@/hooks/use-webgl-support";
import { useHolidayDates } from "@/hooks/use-holiday-dates";
import { resolvePlantAppearance, type PlantAppearance } from "@/lib/plant-appearance";
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
import { useUserData } from "@/UserDataContext";
import { careEnergyService } from "@/application/services/careEnergyService";
import { SeedlingPlant } from "@/components/streak-components";
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
  equipped_cosmetics?: Partial<Record<"palette" | "pot" | "aura" | "particle" | "accessory" | "mutation", string>>;
}

interface AdminUsersResponse {
  data: {
    users: GardenUser[];
  };
}

export interface GardenMember {
  user: GardenUser;
  streakData: ReturnType<typeof calculateStreakData>;
  appearance: PlantAppearance;
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

// three.js only loads once an admin flips to Farm — same lazy boundary as
// the learner-facing garden pages.
const GenmateField = React.lazy(() =>
  import("@/components/farm/GenmateField").then((mod) => ({ default: mod.GenmateField }))
);

type ViewMode = "grid" | "farm";

export function GenmateGarden({ cohort }: GenmateGardenProps) {
  const holidayDates = useHolidayDates();
  const [view, setView] = useState<ViewMode>("grid");
  const webglSupported = useWebglSupported();
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

      const streakData = calculateStreakData(user.reflections ?? [], new Set(), holidayDates);
      const displayStreak = getDisplayStreak(streakData);
      const tier = getPlantTier(getEffectivePlantDays(streakData.bestStreak, user.growth_points ?? 0));
      const member: GardenMember = {
        user,
        streakData,
        appearance: resolvePlantAppearance({
          userId: user._id,
          tier,
          active: streakData.hasCurrentStreak,
          growthPoints: user.growth_points ?? 0,
          overrides: {
            palette: user.selected_palette,
            species: user.selected_species,
            pot: user.selected_pot,
            leaf: user.selected_leaf,
            flower: user.selected_flower,
            stem: user.selected_stem,
          },
          cosmetics: user.equipped_cosmetics,
        }),
        displayStreak,
        tier,
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
  }, [users, holidayDates]);

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

  const handleFarmContextLost = () => {
    setView("grid");
    toast.error("3D view lost — showing the grid instead");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {cohort ? `Cohort ${cohort}` : "All cohorts"} · {groupedLearnerCount} learners across {groups.length} genmate group{groups.length === 1 ? "" : "s"}
        </p>
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
            {view === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {group.members.map((member) => (
                  <PlantTile key={member.user._id} member={member} />
                ))}
              </div>
            ) : (
              <Suspense fallback={<SkeletonWarm className="aspect-[4/3] w-full rounded-xl" />}>
                <GenmateField
                  members={toFarmMembers(group.members)}
                  onContextLost={handleFarmContextLost}
                  renderDetails={(memberId) => {
                    const member = group.members.find((candidate) => candidate.user._id === memberId);
                    return member ? <PlantTile member={member} /> : null;
                  }}
                />
              </Suspense>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PlantTile({ member }: { member: GardenMember }) {
  const { user, streakData, appearance, displayStreak, tier } = member;
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unknown learner";
  const nextMilestone = streakMilestones.find((m) => m.days > displayStreak) ?? null;
  const daysToNext = nextMilestone ? nextMilestone.days - displayStreak : 0;
  const tierConfig = getPlantTierConfig(tier);

  const { userId: currentUserId } = useAuth();
  const queryClient = useQueryClient();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [pendingCareAction, setPendingCareAction] = useState<"gift" | "rescue" | null>(null);
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

  const { userData, refetchUserData } = useUserData();
  const myBalance = userData?.care_energy_balance ?? 0;
  const isSelf = user._id === currentUserId;
  // Backend allows gift/rescue for anyone in the caller's cohort (see
  // resolveGenmate in user_handler.go), not just the caller's genmate
  // subgroup - match that here or the buttons show for targets the
  // server will reject.
  const sameCohort =
    !!userData?.cohort_number && userData.cohort_number === user.cohort_number;

  const giftMutation = useMutation(() => careEnergyService.gift(user._id, 1), {
    onSuccess: () => {
      queryClient.invalidateQueries(["learnerGenmateGarden"]);
      queryClient.invalidateQueries(["adminGenmateGarden"]);
      void refetchUserData();
      toast.success(`Sent care to ${user.first_name ?? "your genmate"} 🌱`);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Couldn't send Care Energy. Please try again.";
      toast.error(message);
    },
  });

  const rescueDate = streakData.eligibleProtectDate;

  const rescueMutation = useMutation(
    () => careEnergyService.rescue(user._id, rescueDate as string),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["learnerGenmateGarden"]);
        queryClient.invalidateQueries(["adminGenmateGarden"]);
        void refetchUserData();
        toast.success(
          `Rescued ${rescueDate} for ${user.first_name ?? "your genmate"} — their streak is safe!`
        );
      },
      onError: (error: unknown) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Couldn't rescue that day. Please try again.";
        toast.error(message);
      },
    }
  );

  const handleCheer = (event: MouseEvent, reaction: string) => {
    event.preventDefault();
    cheerMutation.mutate({ type: "emoji", value: reaction });
    setShowReactionPicker(false);
  };

  return (
    <>
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${fullName}, ${displayStreak > 0 ? `${displayStreak}-day streak` : "no active streak"}`}
          className="flex flex-col items-center gap-1.5 cursor-pointer rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserAvatar userId={user._id} firstName={user.first_name} lastName={user.last_name} className="h-7 w-7" />
          <SeedlingPlant
            appearance={appearance}
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
            <UserAvatar userId={user._id} firstName={user.first_name} lastName={user.last_name} className="h-10 w-10" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{fullName}</span>
              <span className="text-xs text-muted-foreground">
                {user.cohort_number ? `Cohort ${user.cohort_number}` : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SeedlingPlant
              appearance={appearance}
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
            {!isSelf && sameCohort && (
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-full"
                disabled={giftMutation.isLoading || myBalance < 1}
                onClick={() => setPendingCareAction("gift")}
              >
                💛 Send care · 1 → +10 growth
              </Button>
            )}
            {!isSelf && sameCohort && (
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-full"
                disabled={rescueMutation.isLoading || myBalance < 1 || !rescueDate}
                onClick={() => setPendingCareAction("rescue")}
              >
                {rescueDate
                  ? `🛡️ Rescue ${rescueDate} · costs you 1`
                  : "🛡️ No missed day to rescue"}
              </Button>
            )}
            {!isSelf && sameCohort && myBalance < 1 && (
              <p className="text-center text-xs text-muted-foreground">
                You have no Care Energy left.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
    <AlertDialog open={pendingCareAction !== null} onOpenChange={(open) => !open && setPendingCareAction(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pendingCareAction === "rescue" ? `Rescue ${fullName}?` : `Send care to ${fullName}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingCareAction === "rescue"
              ? `Spend 1 Care Energy to protect ${rescueDate ?? "their missed day"}. This supports their streak.`
              : "Spend 1 Care Energy to send this learner +10 growth."}
            {` You have ${myBalance} Care Energy.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Care Energy</AlertDialogCancel>
          <AlertDialogAction
            disabled={myBalance < 1 || giftMutation.isLoading || rescueMutation.isLoading || (pendingCareAction === "rescue" && !rescueDate)}
            onClick={() => {
              if (pendingCareAction === "gift") giftMutation.mutate();
              if (pendingCareAction === "rescue" && rescueDate) rescueMutation.mutate();
              setPendingCareAction(null);
            }}
          >
            Confirm · spend 1 Care Energy
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
