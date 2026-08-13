"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQueryClient } from "react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Plus, BookOpen, CheckCircle } from "lucide-react";

import { useReflections, type Reflection } from "@/hooks/use-reflections";
import { useStreakCalculation } from "@/hooks/use-streak-calculation";
import { reflectionZones, calculateZoneStats, findDominantZone } from "./reflection-zones";
import { StreakIcon, GrowthBar, ComfortZoneMessage } from "./streak-components";
import { getNextTierProgress, getMilestoneForStreak, getRandomStreakQuote } from "@/lib/streak-milestones";
import { getPlantVariant } from "@/lib/plant-variants";
import { ReflectionsTable } from "./reflections-table";
import FeedbackForm from "./linear-feedback-form";
import { AchievementsSection } from "./achievements-section";
import LearnerGenmateGardenWidget from "./learner-genmate-garden-widget";
import { FertilizerInventoryButton } from "./fertilizer-inventory-button";
import { PlantPalettePicker } from "./plant-palette-picker";
import { api } from "@/lib/api";
import type { Badge } from "@/lib/types";
import type { FertilizerLogEntry } from "@/domain/types";

// Define the User interface
interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  cohort_number: number;
  role: string;
  zoom_name: string;
  project_group: string;
  genmate_group: string;
  badges?: Badge[];
  fertilizer_balance?: number;
  growth_points?: number;
  fertilizer_log?: FertilizerLogEntry[];
  selected_palette?: string;
  selected_species?: string;
  selected_pot?: string;
  selected_leaf?: string;
  selected_flower?: string;
  selected_stem?: string;
}

interface ReflectionsDashboardProps {
  userId: string;
  initialReflections?: Reflection[];
  onReflectionSubmit?: () => Promise<void>;
}

const getGreeting = (hour: number) => {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
};

const zoneCount = (zoneStats: ReturnType<typeof calculateZoneStats>, zoneId: string) => {
  if (zoneId === "comfort") return zoneStats.comfort;
  if (zoneId === "stretch-enjoying") return zoneStats.stretchEnjoying;
  if (zoneId === "stretch-overwhelmed") return zoneStats.stretchOverwhelmed;
  return zoneStats.panic;
};

export default function ReflectionsDashboard({ userId, initialReflections = [], onReflectionSubmit }: ReflectionsDashboardProps) {
  const { reflections, isLoading: isLoadingReflections, error: reflectionsError, addReflection, refetch } = useReflections(userId, initialReflections);
  const queryClient = useQueryClient();

  const [user, setUser] = useState<User | null>(null); // New state for user
  const [isLoadingUser, setIsLoadingUser] = useState(false); // New loading state for user
  const [userError, setUserError] = useState<string | null>(null); // New error state for user
  const [zoneInfoOpen, setZoneInfoOpen] = useState(false);

  const protectedDates = useMemo(() => {
    const dates = (user?.fertilizer_log ?? [])
      .filter((entry) => entry.kind === "protect" && entry.relatedDate)
      .map((entry) => entry.relatedDate as string);
    return new Set(dates);
  }, [user?.fertilizer_log]);

  const streakData = useStreakCalculation(reflections, protectedDates);
  const tierProgress = useMemo(
    () => getNextTierProgress(streakData.currentStreak, user?.growth_points ?? 0),
    [streakData.currentStreak, user?.growth_points]
  );

  const plantVariant = useMemo(() => {
    return user
      ? getPlantVariant(user._id, {
          palette: user.selected_palette,
          species: user.selected_species,
          pot: user.selected_pot,
          leaf: user.selected_leaf,
          flower: user.selected_flower,
          stem: user.selected_stem,
        })
      : undefined;
  }, [user]);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setIsLoadingUser(true);
    setUserError(null);
    try {
      const response = await api.get<{ data: User }>(`users/${userId}`);
      setUser(response.data.data);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setUserError("Failed to load user data");
    } finally {
      setIsLoadingUser(false);
    }
  }, [userId]);

  const refreshPlant = useCallback(() => {
    fetchUser();
    queryClient.invalidateQueries(["learnerGenmateGarden"]);
  }, [fetchUser, queryClient]);

  useEffect(() => {
    refetch(); // Refetch reflections
    fetchUser();
  }, [userId, refetch, fetchUser]); // Depend on userId and refetch

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<
    | {
        categoryInputs: Record<string, string>;
        comfortLevel: string;
      }
    | undefined
  >(undefined);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to get local date string (YYYY-MM-DD)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Memoize today's reflection check to prevent re-renders
  const todaysReflection = useMemo(() => {
    const todayString = getLocalDateString(new Date());

    return reflections.find((reflection) => {
      const reflectionDay = reflection.day || reflection.date;
      const reflectionDateString = getLocalDateString(new Date(reflectionDay));

      return reflectionDateString === todayString;
    });
  }, [reflections]);

  // Memoize submission status
  const hasSubmittedToday = useMemo(() => {
    return !!todaysReflection;
  }, [todaysReflection]);

  const handleSubmit = async (newReflection: Omit<Reflection, "_id" | "createdAt" | "day">) => {
    try {
      setIsSubmitting(true);
      await addReflection({
        ...newReflection,
        _id: undefined,
        createdAt: new Date().toISOString(),
        day: getLocalDateString(new Date()),
      });
      setFormData(undefined);
      setIsDialogOpen(false);
      if (onReflectionSubmit) {
        await onReflectionSubmit();
      }
    } catch (err) {
      console.error("Error submitting reflection:", err);
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = useCallback(
    (open: boolean) => {
      // Prevent opening if user has already submitted today
      if (open && hasSubmittedToday) {
        return;
      }

      if (!open && formData !== undefined) {
        setShowCloseWarning(true);
      } else {
        setIsDialogOpen(open);
        if (open) {
          setFormData(undefined);
        }
      }
    },
    [hasSubmittedToday, formData]
  );

  const totalIsLoading = isLoadingReflections || isLoadingUser;
  const totalError = reflectionsError || userError;

  if (totalIsLoading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <div className="h-14 w-full rounded-xl bg-muted/40 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-4">
          <div className="space-y-3">
            <div className="h-20 rounded-lg bg-muted/40 animate-pulse" />
            <div className="h-20 rounded-lg bg-muted/40 animate-pulse" />
          </div>
          <div className="h-64 rounded-lg bg-muted/40 animate-pulse" />
        </div>
      </div>
    );
  }

  if (totalError) {
    return (
      <div className="container mx-auto py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-8">
              <div className="text-center">
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Unable to Load Data
                </h2>
                <p className="text-muted-foreground">{totalError}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const zoneStats = calculateZoneStats(reflections);
  const dominantZone = reflectionZones.find((z) => z.id === findDominantZone(zoneStats));
  const greeting = getGreeting(new Date().getHours());
  const milestone = streakData.hasCurrentStreak && streakData.currentStreak > 0 ? getMilestoneForStreak(streakData.currentStreak) : null;

  return (
    <div className="container mx-auto py-6 space-y-5">
      {/* Hero - the one loud element on the page */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-5 px-6 border-4 border-foreground bg-primary"
        style={{ boxShadow: "6px 6px 0 0 hsl(var(--foreground))" }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="rounded-xl bg-card shadow-sm px-4 py-3">
            <StreakIcon streakData={streakData} variant={plantVariant} growthPoints={user?.growth_points ?? 0} />
          </div>
          <div>
            <p className="text-xl font-medium text-primary-foreground" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {greeting}
              {user?.first_name ? `, ${user.first_name}` : ""}
            </p>
            <div className="text-sm text-primary-foreground/85" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {milestone ? (
                <span className="italic">{milestone.emoji} {milestone.message}</span>
              ) : streakData.hasCurrentStreak && streakData.currentStreak > 0 ? (
                <span className="italic">
                  You've been reflecting consistently for {streakData.currentStreak} day{streakData.currentStreak !== 1 ? "s" : ""}. Keep the momentum going.
                </span>
              ) : streakData.oldStreak > 0 ? (
                <ComfortZoneMessage type="comeback" />
              ) : (
                <span className="italic">Track your learning journey and grow through daily reflection</span>
              )}
            </div>
            {milestone && <p className="text-xs text-primary-foreground/70 italic mt-0.5">{getRandomStreakQuote()}</p>}
          </div>
          {user && (
            <FertilizerInventoryButton
              userId={user._id}
              balance={user.fertilizer_balance ?? 0}
              eligibleProtectDate={streakData.eligibleProtectDate}
              onUsed={refreshPlant}
            />
          )}
          {user && <PlantPalettePicker userId={user._id} selected={user.selected_palette} onSaved={refreshPlant} />}
        </div>

        {hasSubmittedToday ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium border-2 border-neutral-900 bg-neutral-900 text-neutral-50 px-4 py-2">
            <CheckCircle className="h-4 w-4" />
            Completed today
          </span>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <button
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-sm font-medium border-2 border-neutral-900 bg-neutral-900 text-neutral-50 hover:opacity-90 disabled:opacity-70 px-4 py-2"
              >
                {isSubmitting ? (
                  <motion.div className="h-4 w-4 rounded-full border-2 border-t-transparent border-neutral-50" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add reflection
              </button>
            </DialogTrigger>
            <DialogContent className="w-screen h-screen md:w-full md:h-auto sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Daily Reflection</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto">
                <FeedbackForm
                  initialData={formData}
                  onSubmit={handleSubmit}
                  onChange={setFormData}
                  onSuccess={() => {
                    setFormData(undefined);
                    setIsDialogOpen(false);
                  }}
                  isLoading={isSubmitting}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <LearnerGenmateGardenWidget />

      {user && user.badges && user.badges.length > 0 && <AchievementsSection badges={user.badges} />}

      {/* Stat rail + reflection history */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-6">
        <div className="space-y-5">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Growth points</p>
            <p className="text-xl font-semibold mb-2">✨ {user?.growth_points ?? 0}</p>
            <GrowthBar value={tierProgress.current} max={tierProgress.max} />
            <p className="text-[11px] text-muted-foreground mt-1">
              {tierProgress.isMaxTier ? "Max tier 🌟" : `${tierProgress.current}/${tierProgress.max} days to next tier`}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Zone mix</p>
              <button
                type="button"
                onClick={() => setZoneInfoOpen(true)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Learn about zones"
              >
                <BookOpen className="h-3.5 w-3.5" />
              </button>
            </div>
            {zoneStats.total > 0 ? (
              <>
                <div className="flex h-2 overflow-hidden mb-2">
                  {reflectionZones.map((zone) => {
                    const count = zoneCount(zoneStats, zone.id);
                    const percentage = (count / zoneStats.total) * 100;
                    if (percentage === 0) return null;
                    return <div key={zone.id} className={zone.bgColor} style={{ width: `${percentage}%` }} title={`${zone.label}: ${count}`} />;
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Mostly {dominantZone?.label.split(" - ")[0].toLowerCase() || "—"}</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No reflections yet</p>
            )}
          </div>

          {!streakData.hasCurrentStreak && streakData.oldStreak > 0 && (
            <div>
              <ComfortZoneMessage type="comeback" className="text-xs" />
              {streakData.lastActiveDate && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Last active {streakData.lastActiveDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              )}
            </div>
          )}
        </div>

        <ReflectionsTable reflections={reflections} isAdmin={false} />
      </div>

      {/* Zone info dialog */}
      <Dialog open={zoneInfoOpen} onOpenChange={setZoneInfoOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Understanding Learning Zones</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <img src="/baronzone.png" alt="Learning Barometer Zones" className="w-full rounded-lg shadow-md" />
            <div className="grid gap-4">
              {reflectionZones.map((zone) => (
                <Card key={zone.id} className="overflow-hidden">
                  <CardContent className={`p-4 flex items-center gap-4 ${zone.bgColor} bg-opacity-10`}>
                    <div className="text-2xl">{zone.emoji}</div>
                    <div>
                      <h3 className="font-semibold">{zone.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {zone.id === "comfort" && "You're confident and can work independently"}
                        {zone.id === "stretch-enjoying" && "You're challenged but growing and learning"}
                        {zone.id === "stretch-overwhelmed" && "You're finding the challenges difficult"}
                        {zone.id === "panic" && "You're feeling stuck and need support"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog */}
      <AlertDialog open={showCloseWarning} onOpenChange={setShowCloseWarning}>
        <AlertDialogContent>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Unsaved Changes</h3>
            <p>You have unsaved changes. Do you want to continue editing or discard changes?</p>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel
                onClick={() => {
                  setShowCloseWarning(false);
                  setIsDialogOpen(true);
                }}
              >
                Continue Editing
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setFormData(undefined);
                  setShowCloseWarning(false);
                  setIsDialogOpen(false);
                }}
              >
                Discard Changes
              </AlertDialogAction>
            </div>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
