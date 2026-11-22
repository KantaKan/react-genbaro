import { useMemo } from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";
import { useUserData } from "@/UserDataContext";
import { useHolidayDates } from "@/hooks/use-holiday-dates";
import { useStreakCalculation } from "@/hooks/use-streak-calculation";
import type { Reflection as HookReflection } from "@/hooks/use-reflections";
import { learnerApi } from "../api";
import { useClock } from "../checkin/useClock";
import { bangkokNow } from "../lib/time";

const OPENS = 16 * 3600 + 45 * 60;
const NONE = new Set<string>();

export type PillTone = "done" | "due" | "calm";

/** What the top-bar streak pill says. "due" = reflections are open and tonight's isn't written yet. */
export function streakPill({ streak, writtenToday, open }: { streak: number; writtenToday: boolean; open: boolean }) {
  const tone: PillTone = writtenToday ? "done" : open ? "due" : "calm";
  if (streak <= 0) return { count: 0, text: "Start a streak tonight", tone };
  if (tone === "due") return { count: streak, text: `${streak} ${streak === 1 ? "night" : "nights"} · write tonight to keep it`, tone };
  return { count: streak, text: `${streak}-night streak`, tone };
}

const TONE: Record<PillTone, string> = {
  done: "bg-green-50 text-green-800 ring-green-200 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-900",
  due: "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900",
  calm: "bg-l-card text-l-ink ring-l-hair",
};

/** Reflection streak, always visible in the learner top bar. Opens the Reflections page. */
export function StreakPill() {
  const { userData } = useUserData();
  const id = userData?._id;
  const reflections = useQuery(["my-reflections", id], () => learnerApi.getMyReflections(id!), { enabled: !!id });
  const holidays = useHolidayDates() ?? NONE;
  const protectedDates = useMemo(
    () => new Set((userData?.care_energy_log ?? []).filter((e) => e.kind === "protect" && e.relatedDate).map((e) => e.relatedDate as string)),
    [userData?.care_energy_log]
  );
  const list = useMemo(() => (reflections.data ?? []) as unknown as HookReflection[], [reflections.data]);
  const s = useStreakCalculation(list, protectedDates, holidays);
  const now = useClock(60_000);
  if (!id || !reflections.isSuccess) return null;

  const today = bangkokNow().date;
  const writtenToday = list.some((r) => (r.day || r.date || "").slice(0, 10) === today);
  const pill = streakPill({ streak: s.hasCurrentStreak ? s.currentStreak : 0, writtenToday, open: now >= OPENS });

  return (
    <Link
      to="/learner/reflections"
      title={pill.text}
      aria-label={`Reflection streak: ${pill.text}`}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1 transition hover:-translate-y-px ${TONE[pill.tone]}`}
    >
      <Sprout className="h-4 w-4" strokeWidth={2} />
      <span className="tabular-nums">{pill.count}</span>
      <span className="hidden font-medium sm:inline">{pill.count > 0 ? (pill.tone === "due" ? "· write tonight to keep it" : pill.count === 1 ? "night" : "nights") : "· start tonight"}</span>
      {pill.tone === "due" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 sm:hidden" />}
    </Link>
  );
}
