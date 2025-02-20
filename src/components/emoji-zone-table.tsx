"use client";

import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { api } from "../lib/api";
import { StatisticsBadges } from "./statistics-badges";
import { UserStatsTooltip } from "./user-stats-tooltip";

export type Zone = "comfort" | "stretch-enjoying" | "stretch-overwhelmed" | "panic" | "no-data" | "weekend";

const zones = [
  {
    id: "comfort",
    label: "Comfort Zone",
    bgColor: "bg-green-500",
    emoji: "😊",
    description: "Where you feel safe and in control. Tasks are easy and familiar.",
  },
  {
    id: "stretch-enjoying",
    label: "Stretch zone - Enjoying the challenges",
    bgColor: "bg-yellow-500",
    emoji: "🤔",
    description: "Pushing your boundaries, feeling challenged but excited.",
  },
  {
    id: "stretch-overwhelmed",
    label: "Stretch Zone - Overwhelmed",
    bgColor: "bg-orange-500",
    emoji: "😰",
    description: "Feeling stressed, but still learning and growing.",
  },
  {
    id: "panic",
    label: "Panic Zone",
    bgColor: "bg-red-500",
    emoji: "😱",
    description: "Feeling extreme stress or fear. Learning is difficult here.",
  },
  {
    id: "no-data",
    label: "No Data",
    bgColor: "bg-gray-200",
    emoji: "❌",
    description: "Insufficient information to categorize the experience.",
  },
  {
    id: "weekend",
    label: "Weekend",
    bgColor: "bg-blue-300",
    emoji: "🏖️",
    description: "Weekend day, no data collection.",
  },
];

interface Entry {
  date: string;
  zone: Zone;
}

interface TableData {
  zoomname: string;
  entries: Entry[] | null;
}

interface ApiResponse {
  status: string;
  message: string;
  data: TableData[];
}

interface FilterControls {
  startDate: Date | null;
  endDate: Date | null;
  selectedZones: Zone[];
  userSearch: string;
  showWeekends: boolean;
}

const zoneToEmoji: Record<Zone, { emoji: string; className: string }> = zones.reduce((acc, zone) => {
  acc[zone.id as Zone] = { emoji: zone.emoji, className: zone.bgColor };
  return acc;
}, {} as Record<Zone, { emoji: string; className: string }>);

const isWeekend = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date.getDay() === 0 || date.getDay() === 6; // 0 is Sunday, 6 is Saturday
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDayColor = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDay();
  switch (day) {
    case 1:
      return "bg-blue-300"; // Monday - lighter blue
    case 2:
      return "bg-green-300"; // Tuesday - lighter green
    case 3:
      return "bg-yellow-300"; // Wednesday - lighter yellow
    case 4:
      return "bg-orange-300"; // Thursday - lighter orange
    case 5:
      return "bg-pink-300"; // Friday - lighter pink
    default:
      return "bg-gray-300"; // Weekend - lighter gray
  }
};

const getDayName = (dateString: string): string => {
  const date = new Date(dateString);
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dayNumber = String(date.getDate()).padStart(2, "0");
  return `${dayName} ${dayNumber}`;
};

const FilterBar = ({ filters, setFilters }: { filters: FilterControls; setFilters: (filters: FilterControls) => void }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.startDate ? formatDate(filters.startDate) : "Start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={filters.startDate || undefined} onSelect={(date) => setFilters({ ...filters, startDate: date })} disabled={{ after: new Date() }} initialFocus />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.endDate ? formatDate(filters.endDate) : "End date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={filters.endDate || undefined} onSelect={(date) => setFilters({ ...filters, endDate: date })} disabled={{ after: new Date() }} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <Select value={filters.selectedZones.join(",")} onValueChange={(value) => setFilters({ ...filters, selectedZones: value.split(",").filter(Boolean) as Zone[] })}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="Select zones to show" />
        </SelectTrigger>
        <SelectContent>
          {zones.map((zone) => (
            <SelectItem key={zone.id} value={zone.id}>
              <span className="flex items-center gap-2">
                {zone.emoji} {zone.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input className="w-[240px]" placeholder="Search users..." value={filters.userSearch} onChange={(e) => setFilters({ ...filters, userSearch: e.target.value })} />

      <Button variant="outline" className={filters.showWeekends ? "bg-blue-100" : ""} onClick={() => setFilters({ ...filters, showWeekends: !filters.showWeekends })}>
        {filters.showWeekends ? "Hide Weekends" : "Show Weekends"}
      </Button>

      <Button
        variant="outline"
        onClick={() =>
          setFilters({
            startDate: null,
            endDate: null,
            selectedZones: [],
            userSearch: "",
            showWeekends: true,
          })
        }
      >
        Reset Filters
      </Button>
    </div>
  );
};

export default function EmojiZoneTable() {
  const [data, setData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allDates, setAllDates] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterControls>({
    startDate: null,
    endDate: null,
    selectedZones: [],
    userSearch: "",
    showWeekends: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const axiosResponse = await api.get("/admin/emoji-zone-table");
      const response: ApiResponse = axiosResponse.data;

      if (response.status === "success") {
        let earliestDate = new Date();
        if (response.data.length > 0 && response.data[0].entries && response.data[0].entries.length > 0) {
          earliestDate = new Date(response.data[0].entries[0].date);
        }

        response.data.forEach((user) => {
          user.entries?.forEach((entry) => {
            const entryDate = new Date(entry.date);
            if (entryDate < earliestDate) {
              earliestDate = entryDate;
            }
          });
        });

        const currentDate = new Date();
        const combinedDates: string[] = [];
        for (let d = earliestDate; d <= currentDate; d.setDate(d.getDate() + 1)) {
          combinedDates.push(formatDate(new Date(d)));
        }

        setAllDates(combinedDates);
        setData(response.data);
      } else {
        setError(response.message || "Failed to fetch data");
      }
    } catch (err) {
      setError("An error occurred while fetching data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((user) => {
      if (!user.zoomname) return false;
      return user.zoomname.toLowerCase().includes(filters.userSearch.toLowerCase());
    });
  }, [data, filters.userSearch]);

  const filteredDates = allDates.filter((date) => {
    const dateObj = new Date(date);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

    if (!filters.showWeekends && isWeekend) return false;

    if (filters.startDate && dateObj < filters.startDate) return false;
    if (filters.endDate && dateObj > filters.endDate) return false;

    return true;
  });

  const validUsers = useMemo(() => filteredData.filter((user) => user.zoomname), [filteredData]);

  const sortedUsers = useMemo(
    () =>
      [...validUsers].sort((a, b) => {
        const aNum = Number.parseInt(a.zoomname.split("_")[0], 10);
        const bNum = Number.parseInt(b.zoomname.split("_")[0], 10);
        return aNum - bNum;
      }),
    [validUsers]
  );

  const calculateZoneStats = (users: TableData[], dates: string[]) => {
    const stats = new Map<Zone, number>();
    let total = 0;

    users.forEach((user) => {
      dates.forEach((date) => {
        const entry = user.entries?.find((e) => e.date === date);
        const zone = isWeekend(date) ? "weekend" : entry?.zone || "no-data";
        stats.set(zone, (stats.get(zone) || 0) + 1);
        total++;
      });
    });

    return {
      stats: Array.from(stats.entries()).map(([zone, count]) => ({
        zone,
        count,
        percentage: (count / total) * 100,
      })),
      total,
    };
  };

  const calculateUserStats = (user: TableData, dates: string[]) => {
    const zoneCount = new Map<Zone, number>();
    let totalEntries = 0;

    dates.forEach((date) => {
      const entry = user.entries?.find((e) => e.date === date);
      const zone = isWeekend(date) ? "weekend" : entry?.zone || "no-data";
      zoneCount.set(zone, (zoneCount.get(zone) || 0) + 1);
      totalEntries++;
    });

    const zoneBreakdown = Array.from(zoneCount.entries())
      .map(([zone, count]) => ({
        zone,
        count,
        percentage: (count / totalEntries) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      username: user.zoomname,
      totalEntries,
      zoneBreakdown,
      mostFrequentZone: zoneBreakdown[0],
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data.length) {
    return (
      <Alert>
        <AlertDescription>No data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Emoji Zone Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <FilterBar filters={filters} setFilters={setFilters} />
        {validUsers.length > 0 ? (
          <>
            <StatisticsBadges stats={calculateZoneStats(sortedUsers, filteredDates).stats} total={calculateZoneStats(sortedUsers, filteredDates).total} zones={zones} />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 w-full min-w-32 h-12 font-medium border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">Date</TableHead>
                    {sortedUsers.map((user) => (
                      <TableHead key={user.zoomname} className="w-32 max-w-[85px] h-12 text-center border-r overflow-hidden text-ellipsis whitespace-nowrap">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>{user.zoomname}</TooltipTrigger>
                            <UserStatsTooltip stats={calculateUserStats(user, filteredDates)} zones={zones} />
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDates.map((date) => (
                    <TableRow key={date}>
                      <TableCell className={`sticky left-0 z-10 w-full min-w-32 h-12 font-medium border-r ${getDayColor(date)}`}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="w-full text-left">{getDayName(date)}</TooltipTrigger>
                            <TooltipContent>
                              <p>{date}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      {sortedUsers.map((user) => {
                        const entry = user.entries?.find((e) => e.date === date);
                        let zoneData;

                        if (isWeekend(date)) {
                          zoneData = zoneToEmoji["weekend"];
                        } else {
                          zoneData = entry ? zoneToEmoji[entry.zone] : zoneToEmoji["no-data"];
                        }

                        if (filters.selectedZones.length > 0 && entry && !filters.selectedZones.includes(entry.zone)) {
                          return (
                            <TableCell key={`${date}-${user.zoomname}`} className="w-32 max-w-[85px] h-12 text-center border-r overflow-hidden text-ellipsis whitespace-nowrap bg-gray-100">
                              -
                            </TableCell>
                          );
                        }

                        return (
                          <TableCell key={`${date}-${user.zoomname}`} className={`w-32 max-w-[85px] h-12 text-center border-r overflow-hidden text-ellipsis whitespace-nowrap ${zoneData.className}`}>
                            <span
                              role="img"
                              aria-label={`${isWeekend(date) ? "weekend" : entry?.zone || "no-data"} zone`}
                              className="text-lg"
                              title={`${user.zoomname}: ${isWeekend(date) ? "Weekend" : zones.find((z) => z.id === entry?.zone)?.label || "No Data"}`}
                            >
                              {zoneData.emoji}
                            </span>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-muted-foreground mb-4">No users found matching "{filters.userSearch}"</p>
            <Button variant="outline" onClick={() => setFilters((prev) => ({ ...prev, userSearch: "" }))}>
              Clear search
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
