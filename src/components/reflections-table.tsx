"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageSquareText, ChevronRight, X } from "lucide-react";
import type { Reflection } from "@/hooks/use-reflections";
import { reflectionZones } from "./reflection-zones";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReflectionsTableProps {
  reflections: Reflection[];
  todaysReflection?: Reflection;
  isAdmin?: boolean;
  userId?: string;
}

export const ReflectionsTable = ({ reflections, isAdmin = false }: ReflectionsTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [openReflection, setOpenReflection] = useState<Reflection | null>(null);

  const getRowId = (reflection: Reflection, index: number) => (reflection._id ? `${reflection._id}-${index}` : `unknown-${index}`);

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
          (reflection.reflection.barometer || "").toLowerCase().includes(query),
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

    return filtered.sort((a, b) => new Date(b.day || b.date).getTime() - new Date(a.day || a.date).getTime());
  }, [reflections, searchQuery, timeFilter]);

  const zoneStats = useMemo(() => {
    const stats = reflections.reduce(
      (acc, reflection) => {
        const zone = reflectionZones.find((z) => z.label === reflection.reflection.barometer);
        if (zone) {
          acc[zone.id] = (acc[zone.id] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
    return stats;
  }, [reflections]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return "Today";
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getZone = (reflection: Reflection) => {
    const barometerValue = reflection.reflection.barometer || "";
    return reflectionZones.find(
      (z) => z.label.toLowerCase() === barometerValue.toLowerCase() || z.aliases?.some((alias) => alias.toLowerCase() === barometerValue.toLowerCase()),
    );
  };

  const isSameDay = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const getPreviewLine = (reflection: Reflection) => {
    const tech = reflection.reflection.tech_sessions.happy || reflection.reflection.tech_sessions.improve;
    const nonTech = reflection.reflection.non_tech_sessions.happy || reflection.reflection.non_tech_sessions.improve;
    return [tech, nonTech].filter(Boolean).join(" · ") || "—";
  };

  return (
    <div className="space-y-3">
      {/* Stats + Search & Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {filteredReflections.length} {filteredReflections.length === 1 ? "reflection" : "reflections"}
        </span>
        <div className="flex gap-1">
          {reflectionZones.slice(0, 4).map((zone) => {
            const count = zoneStats[zone.id] || 0;
            if (count === 0) return null;
            return (
              <span key={zone.id} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {zone.emoji} {count}
              </span>
            );
          })}
        </div>

        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reflections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Tabs value={timeFilter} onValueChange={setTimeFilter}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
            <TabsTrigger value="month" className="text-xs px-3">Month</TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-3">Week</TabsTrigger>
            <TabsTrigger value="today" className="text-xs px-3">Today</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      {filteredReflections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-2">No reflections found</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setTimeFilter("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="rounded-md border bg-card divide-y overflow-hidden">
          <AnimatePresence>
            {filteredReflections.map((reflection, index) => {
              const rowDate = reflection.day || reflection.date;
              const isToday = isSameDay(rowDate);
              const zone = getZone(reflection);

              return (
                <motion.div
                  key={getRowId(reflection, index)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  onClick={() => setOpenReflection(reflection)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenReflection(reflection);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`flex items-center gap-3 py-2 px-3 cursor-pointer transition-colors hover:bg-muted/50 ${isToday ? "bg-amber-500/5" : ""}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${zone?.bgColor || "bg-muted-foreground"}`} />
                  <span className="text-sm text-muted-foreground w-[92px] shrink-0 whitespace-nowrap">
                    {formatDate(rowDate)}
                    {isToday && <span className="ml-1.5 text-[10px] font-semibold text-amber-600">TODAY</span>}
                  </span>
                  <span className="text-sm font-medium w-[150px] shrink-0 truncate">
                    {zone?.emoji || "❓"} {(zone?.label || reflection.reflection.barometer || "—").split(" - ")[0]}
                  </span>
                  <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">{getPreviewLine(reflection)}</span>
                  {!isAdmin && reflection.admin_feedback && (
                    <MessageSquareText className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-label="Has admin feedback" />
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!openReflection} onOpenChange={(open) => !open && setOpenReflection(null)}>
        <DialogContent className="sm:max-w-[600px]">
          {openReflection && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  {formatDate(openReflection.day || openReflection.date)}
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <span className="text-lg">{getZone(openReflection)?.emoji || "❓"}</span>
                    {getZone(openReflection)?.label || openReflection.reflection.barometer || "—"}
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Tech Session</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-green-700 text-xs font-medium">Went well</span>
                      <p>{openReflection.reflection.tech_sessions.happy || "—"}</p>
                    </div>
                    <div>
                      <span className="text-amber-700 text-xs font-medium">To improve</span>
                      <p>{openReflection.reflection.tech_sessions.improve || "—"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Non-Tech Session</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-green-700 text-xs font-medium">Went well</span>
                      <p>{openReflection.reflection.non_tech_sessions.happy || "—"}</p>
                    </div>
                    <div>
                      <span className="text-amber-700 text-xs font-medium">To improve</span>
                      <p>{openReflection.reflection.non_tech_sessions.improve || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {!isAdmin && openReflection.admin_feedback && (
                <div className="mt-1 pt-3 border-t border-black/10">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <MessageSquareText className="h-3.5 w-3.5" /> Admin Feedback
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{openReflection.admin_feedback}</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
