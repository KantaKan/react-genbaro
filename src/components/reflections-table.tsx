"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import type { Reflection, TechSession, NonTechSession, ReflectionData } from "@/hooks/use-reflections";
import { reflectionZones } from "./reflection-zones";
import { BarometerVisual } from "./barometer-visual";
import { FeedbackButton } from "./feedback-button"; // Import the new component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Import Dialog components
import { MessageSquareText } from "lucide-react"; // Import for feedback icon

interface ReflectionsTableProps {
  reflections: Reflection[];
  todaysReflection?: Reflection;
  isAdmin?: boolean; // New prop to indicate if the table is used in an admin context
  userId?: string; // New prop to pass the user ID for feedback
}

export const ReflectionsTable = ({ reflections, todaysReflection, isAdmin = false, userId }: ReflectionsTableProps) => {
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({
    key: "date",
    direction: "descending",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");

  const ALL_REFLECTION_COLUMNS = useMemo(() => {
    const columns = ["Date", "Tech Happy", "Tech Improve", "Non-Tech Happy", "Non-Tech Improve", "Barometer"];
    if (isAdmin) {
      columns.push("Feedback");
    }
    return columns;
  }, [isAdmin]);

  const sortReflections = useCallback(
    (reflectionsToSort: Reflection[]) => {
      return [...reflectionsToSort].sort((a, b) => {
        const extractValue = (item: Reflection, key: string) => {
          if (key === "date") return new Date(item.date).getTime();
          if (key.startsWith("tech_sessions.")) {
            const field = key.split(".")[1] as keyof TechSession;
            return item.reflection.tech_sessions[field] || "";
          }
          if (key.startsWith("non_tech_sessions.")) {
            const field = key.split(".")[1] as keyof NonTechSession;
            return item.reflection.non_tech_sessions[field] || "";
          }
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

  const filteredReflections = useMemo(() => {
    let filtered = [...reflections];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (reflection) =>
          (reflection.reflection.tech_sessions.happy || "").toLowerCase().includes(query) ||
          (reflection.reflection.tech_sessions.improve || "").toLowerCase().includes(query) ||
          (reflection.reflection.non_tech_sessions.happy || "").toLowerCase().includes(query) ||
          (reflection.reflection.non_tech_sessions.improve || "").toLowerCase().includes(query) ||
          (reflection.reflection.barometer || "").toLowerCase().includes(query)
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (timeFilter) {
      case "today":
        filtered = filtered.filter((reflection) => {
          const date = new Date(reflection.day || reflection.date);
          date.setHours(0, 0, 0, 0);
          return date.getTime() === today.getTime();
        });
        break;
      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        filtered = filtered.filter((reflection) => {
          const date = new Date(reflection.day || reflection.date);
          return date >= weekAgo;
        });
        break;
      }
      case "month": {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        filtered = filtered.filter((reflection) => {
          const date = new Date(reflection.day || reflection.date);
          return date >= monthAgo;
        });
        break;
      }
    }

    return sortReflections(filtered);
  }, [reflections, searchQuery, timeFilter, sortReflections]);

  const toggleColumn = (columnId: string) => {
    setHiddenColumns((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]));
  };

  const requestSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  return (
    <div className="space-y-6">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
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
              {ALL_REFLECTION_COLUMNS.map((column) => (
                <DropdownMenuCheckboxItem key={column} className="capitalize" checked={!hiddenColumns.includes(column)} onCheckedChange={() => toggleColumn(column)}>
                  {column}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-md border overflow-x-auto">
        <Table className="[&_td]:align-top">
          <TableHeader>
            <TableRow>
              {!hiddenColumns.includes("Date") && (
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort("date")} className="font-semibold h-auto py-4">
                    Date
                    {sortConfig.key === "date" && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                        {sortConfig.direction === "ascending" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                      </motion.span>
                    )}
                  </Button>
                </TableHead>
              )}
              {!hiddenColumns.includes("Tech Happy") && <TableHead>Tech Happy</TableHead>}
              {!hiddenColumns.includes("Tech Improve") && <TableHead>Tech Improve</TableHead>}
              {!hiddenColumns.includes("Non-Tech Happy") && <TableHead>Non-Tech Happy</TableHead>}
              {!hiddenColumns.includes("Non-Tech Improve") && <TableHead>Non-Tech Improve</TableHead>}
              {!hiddenColumns.includes("Barometer") && <TableHead>Barometer</TableHead>}
              {isAdmin && !hiddenColumns.includes("Feedback") && <TableHead>Feedback</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReflections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-2">
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
                  </motion.div>
                </TableCell>
              </TableRow>
            ) : (
              filteredReflections.map((reflection, index) => (
                <motion.tr
                  key={reflection._id || `${reflection.user_id}-${reflection.date}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group hover:bg-muted/50 transition-colors"
                >
                  {!hiddenColumns.includes("Date") && <TableCell className="whitespace-normal py-4 group-hover:text-primary transition-colors">{new Date(reflection.day || reflection.date).toLocaleDateString()}</TableCell>}
                  {!hiddenColumns.includes("Tech Happy") && <TableCell className="whitespace-normal py-4">{reflection?.reflection?.tech_sessions?.happy || ""}</TableCell>}
                  {!hiddenColumns.includes("Tech Improve") && <TableCell className="whitespace-normal py-4">{reflection?.reflection?.tech_sessions?.improve || ""}</TableCell>}
                  {!hiddenColumns.includes("Non-Tech Happy") && <TableCell className="whitespace-normal py-4">{reflection?.reflection?.non_tech_sessions?.happy || ""}</TableCell>}
                  {!hiddenColumns.includes("Non-Tech Improve") && <TableCell className="whitespace-normal py-4">{reflection?.reflection?.non_tech_sessions?.improve || ""}</TableCell>}
                  {!hiddenColumns.includes("Barometer") && (
                    <TableCell>
                      {(() => {
                        const barometerValue = reflection?.reflection?.barometer || reflection?.barometer || "";
                        const zone = reflectionZones.find((z) =>
                          z.label.toLowerCase() === barometerValue.toLowerCase() ||
                          z.aliases?.some(alias => alias.toLowerCase() === barometerValue.toLowerCase())
                        );
                        if (!zone) {
                          return <span className="text-muted-foreground">{barometerValue}</span>;
                        }
                        return <BarometerVisual barometer={zone.label} />;
                      })()}
                    </TableCell>
                  )}
                  {isAdmin && !hiddenColumns.includes("Feedback") && userId && reflection._id && (
                    <TableCell>
                      <FeedbackButton
                        userId={userId}
                        reflectionId={reflection._id}
                        initialFeedback={reflection.admin_feedback}
                        onFeedbackUpdated={() => { /* Consider a way to refresh reflections if needed */ }}
                      />
                    </TableCell>
                  )}
                  {!isAdmin && !hiddenColumns.includes("Feedback") && reflection.admin_feedback && (
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <MessageSquareText className="h-4 w-4" />
                            <span className="sr-only">View Feedback</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Admin Feedback</DialogTitle>
                          </DialogHeader>
                          <p className="py-4 whitespace-pre-wrap">{reflection.admin_feedback}</p>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  )}
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
};
