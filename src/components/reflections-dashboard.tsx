"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Plus, BookOpen, Sparkles, CheckCircle } from "lucide-react";

import { useReflections, type Reflection } from "@/hooks/use-reflections";
import { useStreakCalculation } from "@/hooks/use-streak-calculation";
import { reflectionZones, calculateZoneStats, findDominantZone } from "./reflection-zones";
import { StreakIcon, FireBar } from "./streak-components";
import { ZoneStatCard } from "./zone-stat-card";
import { ReflectionsTable } from "./reflections-table";
import FeedbackForm from "./linear-feedback-form";
import { ReflectionPreview } from "./reflection-preview";
import { SubmissionStatusCard } from "./submission-status-card";
import { AchievementsSection } from "./achievements-section";
import { api } from "@/lib/api";
import type { Badge } from "@/lib/types";

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
    const todayString = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    return reflections.find((reflection) => {
      // Check both day and date fields for compatibility
      const reflectionDay = reflection.day || reflection.date;
      const reflectionDateString = new Date(reflectionDay).toISOString().split('T')[0];

      return reflectionDateString === todayString;
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
          <div className="h-24 w-full">
            <motion.div
              className="h-full w-full bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-xl"
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
                  className="h-36 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 rounded-xl"
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
  const dominantZoneId = findDominantZone(zoneStats);
  const currentZone = todaysReflection ? reflectionZones.find((zone) => zone.label === todaysReflection.reflection.barometer) : null;

  return (
    <div className="container mx-auto py-10">
      {/* Hero section - Editorial Style */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }} 
        className="mb-10 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-amber-300/5 to-transparent rounded-2xl -z-10" />
        <div className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <motion.h1 
                  className="text-4xl md:text-5xl font-bold tracking-tight"
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Daily Reflections
                </motion.h1>
                <StreakIcon streakData={streakData} />
              </div>
              <motion.p 
                className="text-lg text-muted-foreground max-w-xl leading-relaxed"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {streakData.hasCurrentStreak && streakData.currentStreak > 0 ? (
                  <>
                    You've been reflecting consistently for <span className="text-primary font-semibold">{streakData.currentStreak} day{streakData.currentStreak !== 1 ? "s" : ""}</span>. Keep the momentum going.
                  </>
                ) : streakData.oldStreak > 0 ? (
                  <>
                    Your last streak was <span className="text-primary font-semibold">{streakData.oldStreak} days</span>. Add today's reflection to start fresh.
                  </>
                ) : (
                  "Track your learning journey and grow through daily reflection"
                )}
              </motion.p>
            </div>
            <div className="flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: hasSubmittedToday ? 1 : 1.02 }}
                    whileTap={{ scale: hasSubmittedToday ? 1 : 0.98 }}
                  >
                    <div className="relative">
                      {/* Warm amber glow effect */}
                      <div
                        className={`absolute -inset-1 rounded-full ${!hasSubmittedToday ? 'block' : 'hidden'}`}
                        style={{
                          background: 'linear-gradient(45deg, #d97706, #f59e0b, #fbbf24, #f59e0b, #d97706)',
                          filter: 'blur(16px)',
                          opacity: '0.5',
                          animation: 'warmGlow 4s ease-in-out infinite',
                        }}
                      />
                      <style>{`
                        @keyframes warmGlow {
                          0%, 100% { opacity: 0.4; transform: scale(1); }
                          50% { opacity: 0.7; transform: scale(1.03); }
                        }
                      `}</style>
                      <Button
                        size="lg"
                        className={`relative shadow-lg font-medium px-6 py-6 text-base ${!hasSubmittedToday ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                        disabled={hasSubmittedToday || isSubmitting}
                        onClick={(e) => {
                          if (hasSubmittedToday || isSubmitting) {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                          }
                        }}
                      >
                      {isSubmitting ? (
                        <motion.div className="absolute inset-0 flex items-center justify-center bg-amber-700 rounded-md overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <motion.div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} />
                        </motion.div>
                      ) : (
                        <>
                          {hasSubmittedToday ? (
                            <>
                              <CheckCircle className="mr-2 h-5 w-5" />
                              <span>Completed for Today</span>
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-5 w-5" />
                              {(() => {
                                const hour = new Date().getHours();
                                if (hour >= 5 && hour < 12) {
                                  return "Add Morning Reflection";
                                } else if (hour >= 12 && hour < 17) {
                                  return "Add Afternoon Reflection";
                                } else if (hour >= 17 && hour < 21) {
                                  return "Add Evening Reflection";
                                } else {
                                  return "Add Night Reflection";
                                }
                              })()}
                            </>
                          )}
                        </>
                      )}
                    </Button>
                    </div>
                  </motion.div>
                </DialogTrigger>
                  {/* DialogContent inside Dialog */}
                  {!hasSubmittedToday && (
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
                  )}
                </Dialog>
              </div>
            </div>
          </div>
        </motion.div>

      {/* Submission Status Card */}
      <SubmissionStatusCard hasSubmitted={hasSubmittedToday} submissionDate={submissionDate} todaysReflection={todaysReflection} />

      {/* Achievements Section - Editorial Header */}
      {user && user.badges && user.badges.length > 0 && (
        <div className="mt-12">
          <h2 
            className="text-2xl md:text-3xl font-bold mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Your Achievements
          </h2>
          <AchievementsSection badges={user.badges} />
        </div>
      )}

      {/* Zone Statistics - Editorial Header */}
      <div className="flex items-center justify-between mb-6 mt-12">
        <h2 
          className="text-2xl md:text-3xl font-bold"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Your Zone Journey
        </h2>
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
        <AnimatePresence>
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

      {/* Today's Reflection - Editorial Card */}
      {todaysReflection && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="mb-10"
        >
          <Card className="overflow-hidden border-2 border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle 
                className="flex items-center gap-3 text-xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-600">
                  ✦
                </span>
                Today's Reflection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-4">
                  <motion.p 
                    className="text-xl font-medium flex items-center gap-3" 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <span className="text-3xl">{currentZone?.emoji}</span>
                    <span>You're in the <span className="text-primary font-semibold">{currentZone?.label}</span> zone</span>
                  </motion.p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <FireBar value={streakData.currentStreak} max={20} />
                      <div className="flex items-center gap-1">
                        <span className="tabular-nums font-medium">{streakData.currentStreak} day streak</span>
                      </div>
                    </div>
                    {streakData.currentStreak >= 5 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: "auto" }} 
                        transition={{ duration: 0.3 }} 
                        className="text-sm text-amber-700 font-medium dark:text-amber-400"
                      >
                        Excellent consistency! Keep reflecting daily.
                      </motion.div>
                    )}
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full md:w-auto">
                  <ReflectionPreview reflection={todaysReflection} />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Streak History Card */}
      {!streakData.hasCurrentStreak && streakData.oldStreak > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.2 }} 
          className="mb-10"
        >
          <Card className="overflow-hidden border border-border/50">
            <CardHeader className="pb-4">
              <CardTitle 
                className="text-xl flex items-center gap-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                <span className="text-muted-foreground">Previous Streak</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Your last streak was <span className="text-primary font-semibold">{streakData.oldStreak} day{streakData.oldStreak !== 1 ? "s" : ""}</span>
                  </p>
                  {streakData.lastActiveDate && (
                    <p className="text-sm text-muted-foreground">
                      Last active: {streakData.lastActiveDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => !hasSubmittedToday && setIsDialogOpen(true)} 
                      disabled={hasSubmittedToday} 
                      className="border-amber-500/30 hover:bg-amber-500/10"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {hasSubmittedToday ? "Added for Today" : "Start New Streak"}
                    </Button>
                  </div>
                </div>
                <div className="w-full md:w-1/3">
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-amber-400" 
                      style={{ width: `${(streakData.oldStreak / 20) * 100}%` }} 
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>0</span>
                    <span>10</span>
                    <span>20 days</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reflections Table - Editorial Header */}
      <div className="mt-12">
        <h2 
          className="text-2xl md:text-3xl font-bold mb-6"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Your Reflection History
        </h2>
        <ReflectionsTable reflections={reflections} todaysReflection={todaysReflection} isAdmin={false} />
      </div>

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
