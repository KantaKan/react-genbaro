"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Plus, BookOpen, Search, FlameIcon as Fire } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import FeedbackForm from "./feedback-form";
import { useUserData } from "@/UserDataContext";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { ReflectionPreview } from "./reflection-preview";
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from "./ui/alert-dialog";
import { Skeleton } from "./ui/skeleton";
import { ZoneStatCard } from "./zone-stat-card";

// Types
interface TechSession {
  happy: string;
  improve: string;
}

interface NonTechSession {
  happy: string;
  improve: string;
}

interface ReflectionData {
  barometer: string;
  tech_sessions: TechSession;
  non_tech_sessions: NonTechSession;
}

interface Reflection {
  id?: string; // Add ID for deletion
  user_id: string;
  date: string;
  reflection: ReflectionData;
}

// Update reflectionZones array with new colors
const reflectionZones = [
  { id: "comfort", label: "Comfort Zone", bgColor: "bg-emerald-500", emoji: "😸" },
  { id: "stretch-enjoying", label: "Stretch zone - Enjoying the challenges", bgColor: "bg-amber-500", emoji: "😺" },
  { id: "stretch-overwhelmed", label: "Stretch zone - Overwhelmed", bgColor: "bg-red-500", emoji: "😿" },
  { id: "panic", label: "Panic Zone", bgColor: "bg-violet-500", emoji: "🙀" },
] as const;

type ReflectionZone = (typeof reflectionZones)[number];

const getColorForBarometer = (barometer: string) => {
  const zone = reflectionZones.find((zone) => zone.label === barometer);
  return zone ? `${zone.bgColor}` : "";
};

// Add this function to calculate zone statistics
const calculateZoneStats = (reflections: Reflection[]) => {
  const stats = {
    comfort: 0,
    stretchEnjoying: 0,
    stretchOverwhelmed: 0,
    panic: 0,
    total: reflections.length,
  };

  reflections.forEach((reflection) => {
    const zone = reflectionZones.find((zone) => zone.label === reflection.reflection.barometer);
    if (zone) {
      if (zone.id === "comfort") stats.comfort++;
      if (zone.id === "stretch-enjoying") stats.stretchEnjoying++;
      if (zone.id === "stretch-overwhelmed") stats.stretchOverwhelmed++;
      if (zone.id === "panic") stats.panic++;
    }
  });

  return stats;
};

// Add this function to find the dominant zone
const findDominantZone = (stats: ReturnType<typeof calculateZoneStats>) => {
  const zoneCounts = [
    { id: "comfort", count: stats.comfort },
    { id: "stretch-enjoying", count: stats.stretchEnjoying }, // Fixed typo from stretchEnjoyed
    { id: "stretch-overwhelmed", count: stats.stretchOverwhelmed },
    { id: "panic", count: stats.panic },
  ];

  const sortedZones = zoneCounts.sort((a, b) => b.count - a.count);
  return sortedZones[0].id;
};

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

export default function ReflectionsTableWithModal() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({
    key: "date",
    direction: "descending",
  });

  const { userData, loading, error, refreshUserData } = useUserData();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [formData, setFormData] = useState<{
    categoryInputs: Record<string, string>;
    comfortLevel: string;
  } | null>(null);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate streak
  useEffect(() => {
    if (reflections.length === 0) return;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If today is a weekend, we'll count from the last Friday
    while (isWeekend(today)) {
      today.setDate(today.getDate() - 1);
    }

    const sortedDates = reflections.map((r) => new Date(r.date)).sort((a, b) => b.getTime() - a.getTime());

    const currentDate = new Date(today);
    let expectedWorkDays = 0;

    while (expectedWorkDays < sortedDates.length) {
      if (!isWeekend(currentDate)) {
        const hasReflectionOnDate = sortedDates.some((date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === currentDate.getTime();
        });

        if (hasReflectionOnDate) {
          streak++;
        } else {
          break;
        }
        expectedWorkDays++;
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }

    setStreakCount(streak);
  }, [reflections]);

  // Memoize sort function
  const sortReflections = useCallback(
    (reflectionsToSort: Reflection[]) => {
      return [...reflectionsToSort].sort((a, b) => {
        const extractValue = (item: Reflection, key: string) => {
          if (key === "date") return new Date(item.date).getTime();
          if (key.startsWith("tech_sessions")) return item.reflection.tech_sessions[key.split(".")[1] as keyof TechSession] || "";
          if (key.startsWith("non_tech_sessions")) return item.reflection.non_tech_sessions[key.split(".")[1] as keyof NonTechSession] || "";
          return item.reflection[key as keyof ReflectionData] || "";
        };

        const aValue = extractValue(a, sortConfig.key);
        const bValue = extractValue(b, sortConfig.key);

        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    },
    [sortConfig]
  );

  // Filter reflections based on search and time
  const filteredReflections = useMemo(() => {
    let filtered = [...reflections];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (reflection) =>
          reflection.reflection.tech_sessions.happy.toLowerCase().includes(query) ||
          reflection.reflection.tech_sessions.improve.toLowerCase().includes(query) ||
          reflection.reflection.non_tech_sessions.happy.toLowerCase().includes(query) ||
          reflection.reflection.non_tech_sessions.improve.toLowerCase().includes(query) ||
          reflection.reflection.barometer.toLowerCase().includes(query)
      );
    }

    // Apply time filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (timeFilter) {
      case "today":
        filtered = filtered.filter((reflection) => {
          const date = new Date(reflection.date);
          date.setHours(0, 0, 0, 0);
          return date.getTime() === today.getTime();
        });
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        filtered = filtered.filter((reflection) => new Date(reflection.date) >= weekAgo);
        break;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        filtered = filtered.filter((reflection) => new Date(reflection.date) >= monthAgo);
        break;
    }

    // Apply sorting
    return sortReflections(filtered);
  }, [reflections, searchQuery, timeFilter, sortReflections]);

  useEffect(() => {
    if (userData?.data?.reflections) {
      setReflections(userData.data.reflections);
    }
  }, [userData]);

  const toggleColumn = (columnId: string) => {
    setHiddenColumns((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]));
  };

  const requestSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  const handleSubmit = async (newReflection: Reflection) => {
    try {
      setIsLoading(true);
      const response = await api.post(`users/${newReflection.user_id}/reflections`, newReflection);
      if (response.data) {
        setReflections((prev) => [...prev, newReflection]);
        setIsDialogOpen(false);
        if (typeof refreshUserData === "function") {
          await refreshUserData();
        }
        toast.success("Reflection submitted successfully!");
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("You have already submitted a reflection today. Please try again tomorrow.");
      } else {
        toast.error("Failed to submit reflection. Please try again later.");
      }
      console.error("Error posting reflection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasReflectionToday = (reflections: Reflection[]): boolean => {
    const today = new Date().toLocaleDateString("en-US"); // Format: "M/D/YYYY"
    return reflections.some((reflection) => new Date(reflection.date).toLocaleDateString("en-US") === today);
  };

  const hasReflection = hasReflectionToday(reflections);

  const getTodaysReflection = (): Reflection | undefined => {
    const today = new Date().toDateString();
    return reflections.find((r) => new Date(r.date).toDateString() === today);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4)
              .fill(null)
              .map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="container mx-auto py-10">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <h2 className="text-lg font-semibold">Error Loading Reflections</h2>
              <p>{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  if (typeof refreshUserData === "function") {
                    refreshUserData();
                  }
                }}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  const zoneStats = calculateZoneStats(reflections);
  const dominantZoneId = findDominantZone(zoneStats);
  const todaysReflection = getTodaysReflection();
  const currentZone = todaysReflection ? reflectionZones.find((zone) => zone.label === todaysReflection.reflection.barometer) : null;

  return (
    <div className="container mx-auto py-10">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      {/* Hero section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 rounded-lg border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Daily Reflections</h1>
              {streakCount > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Fire className="h-4 w-4 text-orange-500" />
                  {streakCount} day streak
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {streakCount > 0 ? (
                <>
                  🎯 You've been reflecting consistently for {streakCount} day{streakCount !== 1 ? "s" : ""}
                </>
              ) : (
                "Track your learning journey during work days"
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                if (!open && formData) {
                  setShowCloseWarning(true);
                } else {
                  setIsDialogOpen(open);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg relative" disabled={hasReflection || isLoading}>
                  {isLoading ? (
                    <motion.div className="absolute inset-0 flex items-center justify-center bg-primary" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                    </motion.div>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" />
                      {hasReflection ? "Reflection Added Today" : "Add Daily Reflection"}
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[70vw] w-[70vw] h-[70vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Daily Reflection</DialogTitle>
                </DialogHeader>
                <FeedbackForm
                  initialData={formData}
                  onSubmit={handleSubmit}
                  onChange={setFormData}
                  onSuccess={() => {
                    setFormData(null);
                    setIsDialogOpen(false);
                  }}
                  isLoading={isLoading}
                />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  <BookOpen className="mr-2 h-5 w-5" />
                  About zones
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
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
        </div>
      </motion.div>

      {/* Zone Statistics */}
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
              <motion.div key={zone.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.1 }} layout>
                <ZoneStatCard zone={zone} stats={stats} isDominant={isDominant} isCurrent={isCurrent} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Today's Reflection */}
      {todaysReflection && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Today's Reflection</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-lg">
                    You're in the {currentZone?.label} {currentZone?.emoji}
                  </p>
                  <div className="flex items-center gap-2">
                    <Progress value={streakCount * 10} className="w-32" />
                    <span className="text-sm text-muted-foreground">{streakCount} day streak</span>
                  </div>
                </div>
                <ReflectionPreview reflection={todaysReflection} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reflections..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-full sm:w-[200px]" />
          </div>
          <Tabs value={timeFilter} onValueChange={setTimeFilter} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Visible Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {["Date", "Tech Happy", "Tech Improve", "Non-Tech Happy", "Non-Tech Improve", "Barometer"].map((column) => (
                <DropdownMenuCheckboxItem key={column} className="capitalize" checked={!hiddenColumns.includes(column)} onCheckedChange={() => toggleColumn(column)}>
                  {column}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table className="[&_td]:align-top">
          <TableHeader>
            <TableRow>
              {!hiddenColumns.includes("Date") && (
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("date")} className="font-semibold h-auto py-4">
                    Date
                    {sortConfig.key === "date" && (sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                  </Button>
                </TableHead>
              )}
              {!hiddenColumns.includes("Tech Happy") && <TableHead>Tech Happy</TableHead>}
              {!hiddenColumns.includes("Tech Improve") && <TableHead>Tech Improve</TableHead>}
              {!hiddenColumns.includes("Non-Tech Happy") && <TableHead>Non-Tech Happy</TableHead>}
              {!hiddenColumns.includes("Non-Tech Improve") && <TableHead>Non-Tech Improve</TableHead>}
              {!hiddenColumns.includes("Barometer") && <TableHead>Barometer</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReflections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">No reflections found</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setTimeFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredReflections.map((reflection, index) => (
                <TableRow key={`${reflection.user_id}-${reflection.date}-${index}`}>
                  {!hiddenColumns.includes("Date") && <TableCell className="whitespace-normal py-4">{new Date(reflection.date).toLocaleDateString()}</TableCell>}
                  {!hiddenColumns.includes("Tech Happy") && <TableCell className="whitespace-normal py-4">{reflection.reflection.tech_sessions.happy}</TableCell>}
                  {!hiddenColumns.includes("Tech Improve") && <TableCell className="whitespace-normal py-4">{reflection.reflection.tech_sessions.improve}</TableCell>}
                  {!hiddenColumns.includes("Non-Tech Happy") && <TableCell className="whitespace-normal py-4">{reflection.reflection.non_tech_sessions.happy}</TableCell>}
                  {!hiddenColumns.includes("Non-Tech Improve") && <TableCell className="whitespace-normal py-4">{reflection.reflection.non_tech_sessions.improve}</TableCell>}
                  {!hiddenColumns.includes("Barometer") && (
                    <TableCell>
                      <Badge variant="secondary" className={`${getColorForBarometer(reflection.reflection.barometer)} bg-opacity-15`}>
                        {reflection.reflection.barometer}
                      </Badge>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedReflection} onOpenChange={() => setSelectedReflection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reflection Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">{selectedReflection && <ReflectionPreview reflection={selectedReflection} />}</div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Alert */}
      <AlertDialog open={showCloseWarning} onOpenChange={setShowCloseWarning}>
        <AlertDialogContent>
          <div className="text-center space-y-4">
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
                  setFormData(null);
                  setShowCloseWarning(false);
                  setIsDialogOpen(false);
                }}
              >
                Discard Changes
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
