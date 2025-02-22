"use client";

import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
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
];

const getColorForBarometer = (barometer: string) => {
  const zone = reflectionZones.find((zone) => zone.label === barometer);
  return zone ? `${zone.bgColor}` : "";
};

const showTodaysReflectionDialog = (reflection: Reflection) => {
  // Implement a dialog to show today's reflection
  // You can use the Dialog component from your UI library
  // This is a placeholder function
  console.log("Showing today's reflection:", reflection);
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
    { id: "stretch-enjoying", count: stats.stretchEnjoying },
    { id: "stretch-overwhelmed", count: stats.stretchOverwhelmed },
    { id: "panic", count: stats.panic },
  ];

  const sortedZones = zoneCounts.sort((a, b) => b.count - a.count);
  return sortedZones[0].id;
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

  useEffect(() => {
    if (userData?.data?.reflections) {
      setReflections(userData.data.reflections);
    }
  }, [userData]);

  const toggleColumn = (columnId: string) => {
    setHiddenColumns((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]));
  };

  const sortedReflections = useMemo(() => {
    const sortableReflections = [...reflections];
    sortableReflections.sort((a, b) => {
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
    return sortableReflections;
  }, [reflections, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  const handleSubmit = async (newReflection: Reflection) => {
    try {
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
        if (!(error instanceof TypeError && error.message.includes("refreshUserData"))) {
          toast.error("Failed to submit reflection. Please try again later.");
        }
      }
      console.error("Error posting reflection:", error);
      if (!(error instanceof TypeError && error.message.includes("refreshUserData"))) {
        throw error;
      }
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

  if (loading)
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between mb-4">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {Array(6)
                .fill(null)
                .map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-6 w-full" />
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5)
              .fill(null)
              .map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array(6)
                    .fill(null)
                    .map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  const zoneStats = calculateZoneStats(reflections);
  const dominantZoneId = findDominantZone(zoneStats);
  const todaysReflection = getTodaysReflection();
  const currentZone = todaysReflection ? reflectionZones.find((zone) => zone.label === todaysReflection.reflection.barometer) : null;

  return (
    <div className="container mx-auto py-10">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Hero section for Add Reflection */}
      <div className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 rounded-lg border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Daily Reflections</h1>
            <p className="text-muted-foreground">Track your learning journey and growth over time</p>
          </div>
          <div className="flex items-center gap-3">
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
                <Button size="lg" className="shadow-lg" disabled={hasReflection}>
                  <Plus className="mr-2 h-5 w-5" />
                  {hasReflection ? "Reflection Added Today" : "Add Daily Reflection"}
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
                />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  <BookOpen className="mr-2 h-5 w-5" />
                  About Zones
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Understanding Learning Zones</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 p-4">
                  <img src="/baronzone.png" alt="Learning Barometer Zones" className="w-full rounded-lg shadow-md" />
                  <div className="grid gap-4 mt-4">
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
          </div>
        </div>
      </div>

      {/* Zone Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {reflectionZones.map((zone) => {
          const isDominant = zone.id === dominantZoneId;
          const isCurrent = currentZone?.id === zone.id;
          const stats = {
            count: zone.id === "comfort" ? zoneStats.comfort : zone.id === "stretch-enjoying" ? zoneStats.stretchEnjoying : zone.id === "stretch-overwhelmed" ? zoneStats.stretchOverwhelmed : zoneStats.panic,
            total: zoneStats.total,
          };

          return <ZoneStatCard key={zone.id} zone={zone} stats={stats} isDominant={isDominant} isCurrent={isCurrent} />;
        })}
      </div>

      {/* Today's Reflection Card */}
      {todaysReflection && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Today's Reflection</h2>
                <p className="text-sm text-muted-foreground">
                  You're in the {currentZone?.label} {currentZone?.emoji}
                </p>
              </div>
              <ReflectionPreview reflection={todaysReflection} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Controls */}
      <div className="flex justify-between mb-4">
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
      <Table>
        <TableHeader>
          <TableRow>
            {!hiddenColumns.includes("Date") && (
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort("date")}>
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
          {sortedReflections.map((reflection, index) => (
            <TableRow key={`${reflection.user_id}-${reflection.date}-${index}`}>
              {!hiddenColumns.includes("Date") && <TableCell>{new Date(reflection.date).toLocaleDateString()}</TableCell>}
              {!hiddenColumns.includes("Tech Happy") && <TableCell>{reflection.reflection.tech_sessions.happy}</TableCell>}
              {!hiddenColumns.includes("Tech Improve") && <TableCell>{reflection.reflection.tech_sessions.improve}</TableCell>}
              {!hiddenColumns.includes("Non-Tech Happy") && <TableCell>{reflection.reflection.non_tech_sessions.happy}</TableCell>}
              {!hiddenColumns.includes("Non-Tech Improve") && <TableCell>{reflection.reflection.non_tech_sessions.improve}</TableCell>}
              {!hiddenColumns.includes("Barometer") && <TableCell className={getColorForBarometer(reflection.reflection.barometer)}>{reflection.reflection.barometer}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
