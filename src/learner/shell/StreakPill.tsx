import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";
import { SeedlingPlant } from "@/components/streak-components";
import { useClock } from "../checkin/useClock";
import { OPENS_AT } from "../reflections/TonightCard";
import { useMyPlant } from "../lib/useMyPlant";


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

/** Reflection streak, always visible in the learner top bar: your plant and its nights. Opens Reflections. */
export function StreakPill() {
  const plant = useMyPlant();
  const now = useClock(60_000);
  if (!plant.ready) return null;
  const pill = streakPill({ streak: plant.nights, writtenToday: plant.writtenToday, open: now >= OPENS_AT });

  return (
    <Link
      to="/learner/reflections"
      title={pill.text}
      aria-label={`Reflection streak: ${pill.text}`}
      className={`flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 text-body font-semibold ring-1 transition hover:-translate-y-px ${TONE[pill.tone]}`}
    >
      {plant.appearance ? <SeedlingPlant appearance={plant.appearance} showParticles={false} className="h-6 w-6" /> : <Sprout className="h-4 w-4" strokeWidth={2} />}
      <span className="tabular-nums">{pill.count}</span>
      <span className="hidden font-medium sm:inline">{pill.count > 0 ? (pill.tone === "due" ? "· write tonight to keep it" : pill.count === 1 ? "night" : "nights") : "· start tonight"}</span>
      {pill.tone === "due" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 sm:hidden" />}
    </Link>
  );
}
