"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ChevronDown, ChevronUp, MessageSquareText, X } from "lucide-react";
import type { Reflection } from "@/hooks/use-reflections";
import { reflectionZones } from "./reflection-zones";
import { BarometerVisual } from "./barometer-visual";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ReflectionsTableProps {
  reflections: Reflection[];
  todaysReflection?: Reflection;
  isAdmin?: boolean;
  userId?: string;
}

export const ReflectionsTable = ({ reflections, isAdmin = false }: ReflectionsTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCards(new Set(filteredReflections.map((r, i) => r._id || `${i}`)));
  };

  const collapseAll = () => {
    setExpandedCards(new Set());
  };

  const isAllExpanded = filteredReflections.length > 0 && filteredReflections.every((r, i) => expandedCards.has(r._id || `${i}`));
  const isAllCollapsed = filteredReflections.length > 0 && filteredReflections.every((r, i) => !expandedCards.has(r._id || `${i}`));

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">
          {filteredReflections.length} {filteredReflections.length === 1 ? "reflection" : "reflections"}
        </span>
        <div className="flex gap-1">
          {reflectionZones.slice(0, 4).map((zone) => {
            const count = zoneStats[zone.id] || 0;
            if (count === 0) return null;
            return (
              <span
                key={zone.id}
                className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {zone.emoji} {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Search & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reflections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9"
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
        
        <div className="flex items-center gap-2">
          <Tabs value={timeFilter} onValueChange={setTimeFilter}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-3">Month</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-3">Week</TabsTrigger>
              <TabsTrigger value="today" className="text-xs px-3">Today</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {isAllExpanded ? (
            <Button variant="outline" size="sm" onClick={collapseAll} className="h-9 gap-1">
              <ChevronUp className="h-3 w-3" />
              Collapse
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={expandAll} className="h-9 gap-1">
              <ChevronDown className="h-3 w-3" />
              Expand
            </Button>
          )}
        </div>
      </div>

      {/* Cards List */}
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
        <div className="space-y-2">
          {filteredReflections.map((reflection, index) => {
            const barometerValue = reflection?.reflection?.barometer || "";
            const zone = reflectionZones.find(
              (z) =>
                z.label.toLowerCase() === barometerValue.toLowerCase() ||
                z.aliases?.some((alias) => alias.toLowerCase() === barometerValue.toLowerCase()),
            );
            const cardId = reflection._id || `${index}`;
            const isExpanded = expandedCards.has(cardId);

            const zoneBgColor = zone?.bgColor || "bg-muted";
            const bgOpacityClass = zone ? "bg-opacity-20" : "";

            return (
              <motion.div
                key={cardId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card className={`overflow-hidden ${zoneBgColor} ${bgOpacityClass}`}>
                  {/* Card Header - Always Visible */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => toggleCard(cardId)}
                  >
                    <span className="text-sm font-medium">
                      {formatDate(reflection.day || reflection.date)}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {zone && (
                        <span className="text-sm font-medium">
                          {zone.label}
                        </span>
                      )}
                      <span className="text-lg">
                        {zone?.emoji || "❓"}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Card Content - Expandable */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="pt-0 pb-3 px-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-black/10">
                            {/* Tech Session */}
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Tech Session
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-green-700 text-xs font-medium">Went well</span>
                                  <p>{reflection.reflection.tech_sessions.happy || "—"}</p>
                                </div>
                                <div>
                                  <span className="text-amber-700 text-xs font-medium">To improve</span>
                                  <p>{reflection.reflection.tech_sessions.improve || "—"}</p>
                                </div>
                              </div>
                            </div>

                            {/* Non-Tech Session */}
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Non-Tech Session
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-green-700 text-xs font-medium">Went well</span>
                                  <p>{reflection.reflection.non_tech_sessions.happy || "—"}</p>
                                </div>
                                <div>
                                  <span className="text-amber-700 text-xs font-medium">To improve</span>
                                  <p>{reflection.reflection.non_tech_sessions.improve || "—"}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Admin Feedback */}
                          {!isAdmin && reflection.admin_feedback && (
                            <div className="mt-3 pt-3 border-t border-black/10">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="w-full text-xs bg-white/50">
                                    <MessageSquareText className="h-3 w-3 mr-1" />
                                    View Admin Feedback
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Admin Feedback</DialogTitle>
                                  </DialogHeader>
                                  <p className="py-2 whitespace-pre-wrap text-sm">{reflection.admin_feedback}</p>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
