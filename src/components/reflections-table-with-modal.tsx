import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import FeedbackForm from "./feedback-form";
import { useUserData } from "@/UserDataContext";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { ReflectionPreview } from "./reflection-preview";
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from "./ui/alert-dialog";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader } from "./ui/card";

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

const reflectionZones = [
  { id: "comfort", label: "Comfort Zone", bgColor: "bg-green-500" },
  { id: "stretch-enjoying", label: "Stretch zone - Enjoying the challenges", bgColor: "bg-yellow-500" },
  { id: "stretch-overwhelmed", label: "Stretch zone - Overwhelmed", bgColor: "bg-red-500" },
  { id: "panic", label: "Panic Zone", bgColor: "bg-purple-500" },
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
        <Skeleton className="h-10 w-40 mb-4" />

        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index}>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-md">
          <div className="border-b">
            <div className="flex p-4">
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="h-6 flex-1 mr-2" />
              ))}
            </div>
          </div>
          {[...Array(5)].map((_, rowIndex) => (
            <div key={rowIndex} className="flex p-4 border-b last:border-b-0">
              {[...Array(6)].map((_, cellIndex) => (
                <Skeleton key={cellIndex} className="h-4 flex-1 mr-2" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  const todaysReflection = getTodaysReflection();

  return (
    <div className="container mx-auto py-10">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex justify-between mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["Date", "Tech Happy", "Tech Improve", "Non-Tech Happy", "Non-Tech Improve", "Barometer"].map((column) => (
              <DropdownMenuCheckboxItem key={column} className="capitalize" checked={!hiddenColumns.includes(column)} onCheckedChange={() => toggleColumn(column)}>
                {column}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex gap-2">
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
              <Button disabled={hasReflection}>
                <Plus className="mr-2 h-4 w-4" /> Add Reflection
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[70vw] w-[70vw] h-[70vh] overflow-y-auto">
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
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-center">Learning Barometer Zones</h2>
                <img
                  src="/baronzone.png
                "
                  alt="Learning Barometer Zones"
                  className="w-full rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {todaysReflection && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded-r shadow-md flex items-center justify-between">
          <div>
            <p className="font-bold">Daily Reflection Complete! 🎉</p>
            <p className="text-sm">You've already submitted your reflection for today. Great job staying consistent!</p>
          </div>
          <ReflectionPreview reflection={todaysReflection} />
        </div>
      )}
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
