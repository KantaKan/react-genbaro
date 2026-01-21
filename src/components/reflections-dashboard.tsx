"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Plus, BookOpen, Sparkles, CheckCircle } from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useReflections, type Reflection } from "@/hooks/use-reflections";
import { useStreakCalculation } from "@/hooks/use-streak-calculation";
import { reflectionZones, calculateZoneStats, findDominantZone } from "./reflection-zones";
import { StreakIcon, FireBar } from "./streak-components";
import { ZoneStatCard } from "./zone-stat-card";
import { ReflectionsTable } from "./reflections-table";
import FeedbackForm from "./feedback-form";
import { ReflectionPreview } from "./reflection-preview";
import { SubmissionStatusCard } from "./submission-status-card";
import { AchievementsSection } from "./achievements-section";
import { api } from "@/lib/api";
import type { Badge } from "@/lib/types";
import { PixelBadge } from "./pixel-badge";

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
}

interface ReflectionsDashboardProps {
  userId: string;
  initialReflections?: Reflection[];
  onReflectionSubmit?: () => Promise<void>;
}

export default function ReflectionsDashboard({ userId, initialReflections = [], onReflectionSubmit }: ReflectionsDashboardProps) {
  const { reflections, isLoading: isLoadingReflections, error: reflectionsError, addReflection, refetch } = useReflections(userId, initialReflections);
  const streakData = useStreakCalculation(reflections);

  const [user, setUser] = useState<User | null>(null); // New state for user
  const [isLoadingUser, setIsLoadingUser] = useState(false); // New loading state for user
  const [userError, setUserError] = useState<string | null>(null); // New error state for user

  useEffect(() => {
    refetch(); // Refetch reflections

    const fetchUser = async () => { // New function to fetch user
      if (!userId) return;
      setIsLoadingUser(true);
      setUserError(null);
      try {
        const response = await api.get<any>(`users/${userId}`);
        console.log("User data fetched:", response.data.data);
        console.log("Badges:", response.data.data?.badges);
        setUser(response.data.data);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setUserError("Failed to load user data");
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser(); // Call new fetch user function
  }, [userId, refetch]); // Depend on userId and refetch

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

  // Memoize today's reflection check to prevent re-renders
  const todaysReflection = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return reflections.find((reflection) => {
      const reflectionDate = new Date(reflection.day || reflection.date);
      reflectionDate.setHours(0, 0, 0, 0);
      return reflectionDate.getTime() === today.getTime();
    });
  }, [reflections]);

  // Memoize submission status
  const hasSubmittedToday = useMemo(() => {
    return !!todaysReflection;
  }, [todaysReflection]);

  // Memoize submission date
  const submissionDate = useMemo(() => {
    if (todaysReflection) {
      const today = new Date();
      return today.toISOString().split("T")[0];
    }
    return null;
  }, [todaysReflection]);

  const handleSubmit = async (newReflection: Omit<Reflection, "_id" | "createdAt" | "day">) => {
    try {
      setIsSubmitting(true);
      await addReflection({
        ...newReflection,
        _id: undefined,
        createdAt: new Date().toISOString(),
        day: new Date().toISOString().split("T")[0],
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
      <div className="container mx-auto py-10 space-y-8">
        <div className="space-y-4">
          <div className="h-20 w-full">
            <motion.div
              className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"
              animate={{
                backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4)
              .fill(null)
              .map((_, i) => (
                <motion.div
                  key={i}
                  className="h-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                    delay: i * 0.2,
                  }}
                />
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (totalError) {
    return (
      <div className="container mx-auto py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="border-destructive">
            <CardContent className="p-6">
              <div className="text-center text-destructive">
                <h2 className="text-lg font-semibold">Error Loading Data</h2>
                <p>{totalError}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const zoneStats = calculateZoneStats(reflections);
  const dominantZoneId = findDominantZone(zoneStats);
  const currentZone = todaysReflection ? reflectionZones.find((zone) => zone.label === todaysReflection.reflection.barometer) : null;

  return (
    <div className="container mx-auto py-10">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      {/* Hero section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 rounded-lg border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <motion.h1 className="text-3xl font-bold" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                Daily Reflections
              </motion.h1>
              <StreakIcon streakData={streakData} />
            </div>
            <motion.p className="text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
              {streakData.hasCurrentStreak && streakData.currentStreak > 0 ? (
                <>
                  🎯 You've been reflecting consistently for {streakData.currentStreak} day
                  {streakData.currentStreak !== 1 ? "s" : ""}
                </>
              ) : streakData.oldStreak > 0 ? (
                <>
                  <span className="inline-flex items-center">
                    <span className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">Your last streak was {streakData.oldStreak} days.</span> Add today's reflection to start a new streak!
                  </span>
                </>
              ) : (
                "Track your learning journey during work days"
              )}
            </motion.p>
          </div>
          <div className="flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: hasSubmittedToday ? 1 : 1.03 }} whileTap={{ scale: hasSubmittedToday ? 1 : 0.97 }}>
                  <Button
                    size="lg"
                    className={`shadow-lg relative ${!hasSubmittedToday ? "bg-gradient-to-r from-primary to-primary" : "bg-gray-400 cursor-not-allowed"}`}
                    disabled={hasSubmittedToday || isSubmitting}
                    onClick={(e) => {
                      if (hasSubmittedToday) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <motion.div className="absolute inset-0 flex items-center justify-center bg-primary rounded-md overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <motion.div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} />
                      </motion.div>
                    ) : (
                      <>
                        {hasSubmittedToday ? (
                          <>
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Reflection Completed Today
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-5 w-5" />
                            Add Daily Reflection
                          </>
                        )}
                        {!hasSubmittedToday && (
                          <motion.span
                            className="absolute inset-0 rounded-md bg-white"
                            initial={{ opacity: 0 }}
                            animate={{
                              opacity: [0, 0.1, 0],
                              scale: [1, 1.05, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatType: "reverse",
                            }}
                          />
                        )}
                      </>
                    )}
                  </Button>
                </motion.div>
              </DialogTrigger>
              {/* Only render DialogContent if user hasn't submitted today */}
              {!hasSubmittedToday && (
                <DialogContent className="w-screen h-screen md:w-full md:h-auto sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
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
              )}
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Submission Status Card */}
      <SubmissionStatusCard hasSubmitted={hasSubmittedToday} submissionDate={submissionDate} todaysReflection={todaysReflection} />

      {/* Achievements Section */}
      {user && user.badges && user.badges.length > 0 && (
        <AchievementsSection badges={user.badges} />
      )}

      {/* Zone Statistics */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Your Zone Breakdown</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <BookOpen className="h-4 w-4" />
              <span className="sr-only">About learning zones</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Understanding Learning Zones</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-6">
              <img src="/baronzone.png" alt="Learning Barometer Zones" className="w-full rounded-lg shadow-md" />
              <div className="grid gap-4">
                {reflectionZones.map((zone) => (
                  <motion.div key={zone.id} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Card className="overflow-hidden">
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
                  </motion.div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AnimatePresence mode="wait">
          {reflectionZones.map((zone, index) => {
            const isDominant = zone.id === dominantZoneId;
            const isCurrent = currentZone?.id === zone.id;
            const stats = {
              count: zone.id === "comfort" ? zoneStats.comfort : zone.id === "stretch-enjoying" ? zoneStats.stretchEnjoying : zone.id === "stretch-overwhelmed" ? zoneStats.stretchOverwhelmed : zoneStats.panic,
              total: zoneStats.total,
            };

            return (
              <motion.div key={zone.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.1, duration: 0.4 }} layout>
                <ZoneStatCard zone={zone} stats={stats} isDominant={isDominant} isCurrent={isCurrent} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Today's Reflection */}
      {todaysReflection && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <Card className="overflow-hidden border-2 hover:border-primary/5 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Today's Reflection
                <motion.div animate={{ rotate: [0, 5, 0, -5, 0] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", ease: "easeInOut" }}>
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </motion.div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-4">
                  <motion.p className="text-lg font-medium flex items-center gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
                    You're in the {currentZone?.label}
                    <motion.span
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, 0, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "loop",
                      }}
                    >
                      {currentZone?.emoji}
                    </motion.span>
                  </motion.p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FireBar value={streakData.currentStreak} max={20} />
                      <div className="flex items-center gap-1">
                        <span className="tabular-nums">{streakData.currentStreak} day streak</span>
                      </div>
                    </div>
                    {streakData.currentStreak >= 5 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }} className="text-sm text-emerald-600 font-medium">
                        Great job maintaining your reflection streak! 🎉
                      </motion.div>
                    )}
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full md:w-auto">
                  <ReflectionPreview reflection={todaysReflection} />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Streak History Card */}
      {!streakData.hasCurrentStreak && streakData.oldStreak > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-8">
          <Card className="overflow-hidden border border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-gray-700 flex items-center gap-2">Previous Streak</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-600">
                    Your last streak was {streakData.oldStreak} day{streakData.oldStreak !== 1 ? "s" : ""}
                  </p>
                  {streakData.lastActiveDate && <p className="text-sm text-gray-500">Last active: {streakData.lastActiveDate.toLocaleDateString()}</p>}
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => !hasSubmittedToday && setIsDialogOpen(true)} disabled={hasSubmittedToday} className="group">
                      <Plus className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                      {hasSubmittedToday ? "Reflection Added Today" : "Add Today's Reflection"}
                    </Button>
                  </div>
                </div>
                <div className="w-full md:w-1/3">
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-gray-400" style={{ width: `${(streakData.oldStreak / 20) * 100}%` }} />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>0</span>
                    <span>10</span>
                    <span>20</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reflections Table */}
      <ReflectionsTable reflections={reflections} todaysReflection={todaysReflection} isAdmin={false} />

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
