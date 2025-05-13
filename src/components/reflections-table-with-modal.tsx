"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Plus, BookOpen, Search, FlameIcon as Fire, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import FeedbackForm from "./feedback-form";
import { useUserData } from "@/UserDataContext";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { ReflectionPreview } from "./reflection-preview";
import { AlertDialogContent, AlertDialogAction, AlertDialogCancel, AlertDialog } from "./ui/alert-dialog";

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

// Add interface for streak data
interface StreakData {
  currentStreak: number;
  oldStreak: number;
  lastActiveDate: Date | null;
  hasCurrentStreak: boolean;
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
    { id: "stretch-enjoying", count: stats.stretchEnjoying },
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

// Animated fire component for streak
const FireBar = ({ value, max = 100 }: { value: number; max?: number }) => {
  const progress = (value / max) * 100;
  const controls = useAnimation();
  const fireRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    controls.start({
      width: `${progress}%`,
      transition: { duration: 1, ease: "easeOut" },
    });

    // Animate fire particles
    if (fireRef.current && value > 0) {
      const particles = Array.from({ length: Math.min(value, 10) }, () => {
        const particle = document.createElement("div");
        particle.className = "absolute bottom-0 rounded-full bg-orange-500 opacity-70";
        particle.style.width = `${Math.random() * 6 + 4}px`;
        particle.style.height = `${Math.random() * 6 + 4}px`;
        particle.style.left = `${Math.random() * 100}%`;
        return particle;
      });

      particles.forEach((particle) => {
        fireRef.current?.appendChild(particle);

        // Animate each particle
        const animation = particle.animate(
          [
            {
              transform: `translateY(0) scale(1)`,
              opacity: 0.7,
            },
            {
              transform: `translateY(-${Math.random() * 20 + 10}px) scale(${Math.random() * 0.5 + 0.5})`,
              opacity: 0,
            },
          ],
          {
            duration: Math.random() * 1000 + 1000,
            iterations: Number.POSITIVE_INFINITY,
          }
        );

        return () => {
          animation.cancel();
          particle.remove();
        };
      });

      return () => {
        particles.forEach((p) => p.remove());
      };
    }
  }, [controls, progress, value]);

  return (
    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500" initial={{ width: 0 }} animate={controls} />
      <div ref={fireRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
    </div>
  );
};

// Animated streak counter
const StreakCounter = ({ count }: { count: number }) => {
  const prevCount = useRef(0);
  const countAnimation = useAnimation();

  useEffect(() => {
    if (count !== prevCount.current) {
      countAnimation.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.5 },
      });
      prevCount.current = count;
    }
  }, [count, countAnimation]);

  return (
    <motion.div className="flex items-center gap-1" animate={countAnimation}>
      <Fire className="h-4 w-4 text-orange-500" />
      <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {count} day streak
      </motion.span>
    </motion.div>
  );
};

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", updateMousePosition);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);

  return mousePosition;
};

const pulseAnimation = {
  "0%": { boxShadow: "0 0 0 0 rgba(var(--primary), 0.7)" },
  "70%": { boxShadow: "0 0 0 10px rgba(var(--primary), 0)" },
  "100%": { boxShadow: "0 0 0 0 rgba(var(--primary), 0)" },
};

const BarometerVisual = ({ zone, isCurrent = false }: { zone: ReflectionZone; isCurrent?: boolean }) => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      },
    });
  }, [controls]);

  return (
    <motion.div
      className={`flex items-center gap-2 p-2 rounded-md ${zone.bgColor} bg-opacity-20 transition-all duration-300 ${isCurrent ? "ring-2 ring-primary ring-opacity-50" : ""}`}
      animate={controls}
      whileHover={{
        scale: 1.1,
        backgroundColor: `var(--${zone.bgColor.replace("bg-", "")})`,
        backgroundOpacity: 0.3,
      }}
      css={isCurrent ? { animation: `${pulseAnimation} 2s infinite` } : {}}
    >
      <motion.span
        className="text-xl"
        animate={{
          rotate: [0, 10, 0, -10, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
        }}
      >
        {zone.emoji}
      </motion.span>
      <span className="font-medium text-sm">{zone.label}</span>
    </motion.div>
  );
};

// Add this helper function to convert Tailwind color names to hex values
const getColorHex = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    "emerald-500": "10b981",
    "amber-500": "f59e0b",
    "red-500": "ef4444",
    "violet-500": "8b5cf6",
    // Add more colors as needed
  };

  return colorMap[colorName] || "888888"; // Default gray if color not found
};

// Replace the LiquidWave component with this updated version that properly handles colors in light mode
const LiquidWave = ({ color, percentage }: { color: string; percentage: number }) => {
  // Extract the color name from the bg-color class
  const colorName = color.replace("bg-", "");

  return (
    <div className="relative h-16 w-full overflow-hidden rounded-b-lg">
      <div className={`absolute bottom-0 left-0 right-0 ${color} bg-opacity-30`} style={{ height: `${percentage}%` }}>
        <motion.div
          className="absolute top-0 left-0 w-[200%] h-8"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' opacity='.25' fill='%23${getColorHex(
              colorName
            )}'%3E%3C/path%3E%3Cpath d='M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z' opacity='.5' fill='%23${getColorHex(
              colorName
            )}'%3E%3C/path%3E%3Cpath d='M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z' fill='%23${getColorHex(
              colorName
            )}'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
          animate={{
            x: ["-50%", "0%"],
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            ease: "linear",
          }}
        />
      </div>
    </div>
  );
};

const ZoneStatCard = ({ zone, stats, isDominant, isCurrent }: { zone: ReflectionZone; stats: { count: number; total: number }; isDominant: boolean; isCurrent: boolean }) => {
  const cardRef = useRef(null);
  const { x, y } = useMousePosition();
  const [tiltValues, setTiltValues] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (cardRef.current) {
      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;

      const tiltX = (y - cardCenterY) / 20;
      const tiltY = (cardCenterX - x) / 20;

      setTiltValues({ x: tiltX, y: tiltY });
    }
  }, [x, y]);

  return (
    <motion.div
      ref={cardRef}
      style={{
        transform: `perspective(1000px) rotateX(${tiltValues.x}deg) rotateY(${tiltValues.y}deg)`,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`overflow-hidden ${isDominant ? "border-primary" : ""} ${isCurrent ? "ring-2 ring-primary" : ""}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${zone.bgColor} text-white`}>{zone.emoji}</div>
              <h3 className="font-medium">{zone.label}</h3>
            </div>
            {isDominant && (
              <Badge variant="outline" className="bg-primary/10">
                Dominant
              </Badge>
            )}
            {isCurrent && (
              <Badge variant="outline" className="bg-secondary/10">
                Today
              </Badge>
            )}
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">{stats.count}</div>
            <div className="text-sm text-muted-foreground">{((stats.count / stats.total) * 100).toFixed(0)}% of reflections</div>
          </div>
          <LiquidWave color={zone.bgColor} percentage={(stats.count / stats.total) * 100} />
        </CardContent>
      </Card>
    </motion.div>
  );
};

const HOLIDAYS = [
  new Date("2025-04-07"), // Specific holiday
  // Thai holidays (add more as needed)
  new Date("2025-04-13"), // Songkran Day 1
  new Date("2025-04-14"), // Songkran Day 2
  new Date("2025-04-15"), // Songkran Day 3
  new Date("2025-05-01"), // Songkran Day 2
  new Date("2025-05-05"), // Songkran Day 3
  new Date("2025-05-12"), // Add more holidays here...
].map((date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
});

// Helper function to check if a date is a holiday
const isHoliday = (date: Date): boolean => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return HOLIDAYS.some((holiday) => holiday.getTime() === normalizedDate.getTime());
};

// Function to check if a date is a valid workday (not weekend, not holiday)
const isValidWorkday = (date: Date): boolean => {
  return !isWeekend(date) && !isHoliday(date);
};

// Function to get the previous valid workday
const getPreviousWorkday = (date: Date): Date => {
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);

  while (!isValidWorkday(prevDate)) {
    prevDate.setDate(prevDate.getDate() - 1);
  }

  return prevDate;
};

// Update the StreakIcon component to properly display the previous streak value
const StreakIcon = ({ streakData }: { streakData: StreakData }) => {
  const { currentStreak, oldStreak, hasCurrentStreak } = streakData;

  // Display the streak value - if there's no current streak but there is an old streak, show the old streak
  const displayStreak = hasCurrentStreak ? currentStreak : oldStreak > 0 ? oldStreak : 0;

  return (
    <div className="flex items-center gap-2">
      {/* Current streak (colored if active, gray if showing previous) */}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }} className="flex items-center gap-1">
        <Fire className={`h-5 w-5 ${hasCurrentStreak ? "text-orange-500" : oldStreak > 0 ? "text-gray-500" : "text-gray-400"}`} />
        <span className={`text-sm font-medium ${hasCurrentStreak ? "" : oldStreak > 0 ? "text-gray-500" : "text-gray-400"}`}>{displayStreak}</span>
        {!hasCurrentStreak && oldStreak > 0 && <span className="text-xs text-gray-500 ml-1">(previous)</span>}
      </motion.div>
    </div>
  );
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
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    oldStreak: 0,
    lastActiveDate: null,
    hasCurrentStreak: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);

  // Calculate streak with both current and old streak tracking
  useEffect(() => {
    if (reflections.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort dates in descending order (newest first)
    const sortedDates = reflections.map((r) => new Date(r.date)).sort((a, b) => b.getTime() - a.getTime());

    // Initialize streak data
    let currentStreak = 0;
    let oldStreak = 0;
    let lastActiveDate: Date | null = null;
    let hasCurrentStreak = false;
    let streakBroken = false;

    // Check if today has a reflection or is a holiday
    const hasTodayReflection =
      sortedDates.some((date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }) || isHoliday(today);

    // If today is a weekend, check if the last workday has a reflection
    let currentDate = new Date(today);
    if (isWeekend(today)) {
      // Find the last workday
      while (isWeekend(currentDate)) {
        currentDate.setDate(currentDate.getDate() - 1);
      }

      // Check if the last workday has a reflection or is a holiday
      const hasLastWorkdayReflection =
        sortedDates.some((date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === currentDate.getTime();
        }) || isHoliday(currentDate);

      // If the last workday has a reflection, we have a current streak
      if (hasLastWorkdayReflection) {
        hasCurrentStreak = true;
      }
    } else {
      // If today is not a weekend, check if today has a reflection
      hasCurrentStreak = hasTodayReflection;
    }

    // Start counting from today or the last workday
    currentDate = isWeekend(today) ? getPreviousWorkday(today) : today;

    // Count consecutive workdays with reflections for current streak
    if (hasCurrentStreak) {
      // Count today if it has a reflection and is not a weekend
      if (hasTodayReflection && !isWeekend(today)) {
        currentStreak = 1;
        lastActiveDate = new Date(today);
      }

      // Continue counting backwards from previous workday
      let checkDate = getPreviousWorkday(currentDate);

      while (true) {
        // Skip weekends and holidays
        if (isWeekend(checkDate)) {
          checkDate = getPreviousWorkday(checkDate);
          continue;
        }

        // Check if this date has a reflection or is a holiday
        const hasReflectionOnDate =
          sortedDates.some((date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === checkDate.getTime();
          }) || isHoliday(checkDate);

        if (hasReflectionOnDate) {
          currentStreak++;
          if (!lastActiveDate) lastActiveDate = new Date(checkDate);
          checkDate = getPreviousWorkday(checkDate);
        } else {
          // Found a gap, stop counting current streak
          streakBroken = true;
          break;
        }
      }

      // If we found a gap, start counting the old streak
      if (streakBroken) {
        // Skip the gap day
        checkDate = getPreviousWorkday(checkDate);

        // Count consecutive days before the gap
        while (true) {
          // Skip weekends and holidays
          if (isWeekend(checkDate)) {
            checkDate = getPreviousWorkday(checkDate);
            continue;
          }

          // Check if this date has a reflection or is a holiday
          const hasReflectionOnDate =
            sortedDates.some((date) => {
              const d = new Date(date);
              d.setHours(0, 0, 0, 0);
              return d.getTime() === checkDate.getTime();
            }) || isHoliday(checkDate);

          if (hasReflectionOnDate) {
            oldStreak++;
            checkDate = getPreviousWorkday(checkDate);
          } else {
            // End of old streak
            break;
          }
        }
      }
    } else {
      // No current streak, check for old streak
      // Skip today since we know there's no reflection
      let checkDate = getPreviousWorkday(today);

      // Count consecutive days for old streak
      while (true) {
        // Skip weekends and holidays
        if (isWeekend(checkDate)) {
          checkDate = getPreviousWorkday(checkDate);
          continue;
        }

        // Check if this date has a reflection or is a holiday
        const hasReflectionOnDate =
          sortedDates.some((date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === checkDate.getTime();
          }) || isHoliday(checkDate);

        if (hasReflectionOnDate) {
          if (!lastActiveDate) lastActiveDate = new Date(checkDate);
          oldStreak++;
          checkDate = getPreviousWorkday(checkDate);
        } else {
          // End of old streak
          break;
        }
      }
    }

    // Update streak data
    setStreakData({
      currentStreak: hasCurrentStreak ? currentStreak : 0,
      oldStreak,
      lastActiveDate,
      hasCurrentStreak,
    });

    // Trigger streak animation if current streak is greater than 0
    if (hasCurrentStreak && currentStreak > 0) {
      setShowStreakAnimation(true);
      const timer = setTimeout(() => setShowStreakAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [reflections]);

  // Memoize sort function
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

  // Filter reflections based on search and time
  const filteredReflections = useMemo(() => {
    let filtered = [...reflections];

    // Apply search filter
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
        filtered = filtered.filter((reflection) => {
          const date = new Date(reflection.date);
          return date >= weekAgo;
        });
        break;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        filtered = filtered.filter((reflection) => {
          const date = new Date(reflection.date);
          return date >= monthAgo;
        });
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
        setFormData(null);
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
        console.error("Error posting reflection:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [hasReflection, setHasReflection] = useState(false);

  useEffect(() => {
    const checkHasReflectionToday = (reflections: Reflection[]): boolean => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // First check if there's an actual reflection for today
      const hasReflection = reflections.some((reflection) => {
        const reflectionDate = new Date(reflection.date);
        reflectionDate.setHours(0, 0, 0, 0);
        return reflectionDate.getTime() === today.getTime();
      });

      // If there's no reflection, check if today is a holiday (which would have auto-filled data)
      if (!hasReflection) {
        return isHoliday(today);
      }

      return hasReflection;
    };

    setHasReflection(checkHasReflectionToday(reflections));
  }, [reflections]);

  const getTodaysReflection = (): Reflection | undefined => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reflections.find((r) => {
      const reflectionDate = new Date(r.date);
      reflectionDate.setHours(0, 0, 0, 0);
      return reflectionDate.getTime() === today.getTime();
    });
  };

  if (loading) {
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
          <motion.div
            className="h-96 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg"
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
      </div>
    );
  }

  if (error)
    return (
      <div className="container mx-auto py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
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
        </motion.div>
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 rounded-lg border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            {/* Update the hero section to include the streak icon (around line 600) */}
            {/* Replace the existing streak badge with our new component */}
            <div className="flex items-center gap-3">
              <motion.h1 className="text-3xl font-bold" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                Daily Reflections
              </motion.h1>
              <StreakIcon streakData={streakData} />
            </div>
            {/* Update the hero section text to match the design in the image */}
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                if (!open && formData !== null) {
                  setShowCloseWarning(true);
                } else {
                  setIsDialogOpen(open);
                  if (open) {
                    setFormData(null); // Reset form data when opening
                  }
                }
              }}
            >
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: hasReflection ? 1 : 1.03 }} whileTap={{ scale: hasReflection ? 1 : 0.97 }}>
                  {/* Update the "Add Daily Reflection" button to show the streak icon (around line 650) */}
                  <Button size="lg" className={`shadow-lg relative ${!hasReflection ? "bg-gradient-to-r from-primary to-primary" : ""}`} disabled={hasReflection || isLoading}>
                    {isLoading ? (
                      <motion.div className="absolute inset-0 flex items-center justify-center bg-primary rounded-md overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <motion.div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} />
                      </motion.div>
                    ) : (
                      <>
                        <Plus className="mr-2 h-5 w-5" />
                        {hasReflection ? "Reflection Added Today" : "Add Daily Reflection"}
                        {!hasReflection && (
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
              <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Daily Reflection</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto">
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
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="outline" size="lg">
                    <BookOpen className="mr-2 h-5 w-5" />
                    About zones
                  </Button>
                </motion.div>
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
                        <Fire className="h-4 w-4 text-orange-500" />
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

      {/* Streak History Card - Show when there's an old streak but no current streak */}
      {!streakData.hasCurrentStreak && streakData.oldStreak > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-8">
          <Card className="overflow-hidden border border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-gray-700 flex items-center gap-2">
                <Fire className="h-5 w-5 text-gray-400" />
                Previous Streak
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-600">
                    Your last streak was {streakData.oldStreak} day{streakData.oldStreak !== 1 ? "s" : ""}
                  </p>
                  {streakData.lastActiveDate && <p className="text-sm text-gray-500">Last active: {streakData.lastActiveDate.toLocaleDateString()}</p>}
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(true)} disabled={hasReflection} className="group">
                      <Plus className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                      {hasReflection ? "Reflection Added Today" : "Add Today's Reflection"}
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
                  key={reflection.id || `${reflection.user_id}-${reflection.date}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group"
                  whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                >
                  {!hiddenColumns.includes("Date") && <TableCell className="whitespace-normal py-4 group-hover:text-primary transition-colors">{new Date(reflection.date).toLocaleDateString()}</TableCell>}
                  {!hiddenColumns.includes("Tech Happy") && <TableCell className="whitespace-normal py-4">{reflection.reflection.tech_sessions.happy}</TableCell>}
                  {!hiddenColumns.includes("Tech Improve") && <TableCell className="whitespace-normal py-4">{reflection.reflection.tech_sessions.improve}</TableCell>}
                  {!hiddenColumns.includes("Non-Tech Happy") && <TableCell className="whitespace-normal py-4">{reflection.reflection.non_tech_sessions.happy}</TableCell>}
                  {!hiddenColumns.includes("Non-Tech Improve") && <TableCell className="whitespace-normal py-4">{reflection.reflection.non_tech_sessions.improve}</TableCell>}
                  {!hiddenColumns.includes("Barometer") && (
                    <TableCell>
                      {(() => {
                        const zone = reflectionZones.find((z) => z.label === reflection.reflection.barometer);
                        const isCurrent = todaysReflection?.reflection.barometer === reflection.reflection.barometer;
                        return zone ? <BarometerVisual zone={zone} isCurrent={isCurrent} /> : reflection.reflection.barometer;
                      })()}
                    </TableCell>
                  )}
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={!!selectedReflection} onOpenChange={() => setSelectedReflection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reflection Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">{selectedReflection && <ReflectionPreview reflection={selectedReflection} />}</div>
        </DialogContent>
      </Dialog>

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
                  setFormData(null);
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
