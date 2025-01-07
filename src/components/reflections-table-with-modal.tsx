import React, { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import FeedbackForm from "./feedback-form";
import { useUserData } from "@/UserDataContext";
import { api } from "@/lib/api";

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
  {
    id: "comfort",
    label: "Comfort Zone",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  {
    id: "stretch-enjoying",
    label: "Stretch zone - Enjoying the challenges",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  {
    id: "stretch-overwhelmed",
    label: "Stretch zone - Overwhelmed",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    id: "panic",
    label: "Panic Zone",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
];

const getColorForBarometer = (barometer: string) => {
  const zone = reflectionZones.find((zone) => zone.label === barometer);
  return zone ? `${zone.color} ${zone.bgColor}` : "";
};

export default function ReflectionsTable() {
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
        await refreshUserData();
      }
    } catch (error) {
      console.error("Error posting reflection:", error);
      throw error;
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto py-10">
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Reflection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[70vw] w-[70vw] h-[70vh] overflow-y-auto">
            <FeedbackForm onSubmit={handleSubmit} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
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
    </div>
  );
}
