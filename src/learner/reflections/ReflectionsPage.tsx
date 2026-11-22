import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, MessageCircle } from "lucide-react";
import { useUserData } from "@/UserDataContext";
import { api } from "@/lib/api";
import { useReflections, type Reflection as HookReflection } from "@/hooks/use-reflections";
import { useHolidayDates } from "@/hooks/use-holiday-dates";
import { useStreakCalculation } from "@/hooks/use-streak-calculation";
import { getEffectivePlantDays, getNextTierProgress, getPlantTier, getPlantTierConfig, type PlantTier } from "@/lib/streak-milestones";
import { reflectionZones } from "@/components/reflection-zones";
import { giftBoxService } from "@/application/services/giftBoxService";
import { TeacherGiftBoxesDialog } from "@/components/teacher-gift-boxes-dialog";
import { CareEnergyInventoryButton } from "@/components/care-energy-inventory-button";
import { PlantPalettePicker } from "@/components/plant-palette-picker";
import { PlantCollectionDialog } from "@/components/plant-collection-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Reflection, User } from "@/domain/types";
import { learnerApi } from "../api";
import { usePageHeader } from "../shell/LearnerShell";
import { useClock } from "../checkin/useClock";
import { bangkokNow } from "../lib/time";
import { BarometerFace, ZONES, type ZoneId } from "../today/BarometerFace";
import { matchesFilter, nightStats, readSeen, toNights, unseenReplies, weekStrip, type Answers, type Filter, type Night } from "./model";
import { TonightCard } from "./TonightCard";
import { CalendarView, JournalView, dayLabel } from "./views";

type View = "journal" | "calendar";
interface Prefs {
  view: View;
  filter: Filter;
  month?: string; // YYYY-MM
}

const NO_HOLIDAYS = new Set<string>();
const prefsKey = (id: string) => `baro:reflections-view:${id}`;
const seenKey = (id: string) => `baro:reflections-seen:${id}`;

function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode: the page still works, it just won't remember */
  }
}
function loadPrefs(id: string): Prefs {
  try {
    const p = JSON.parse(load(prefsKey(id)) ?? "{}");
    return {
      view: p.view === "calendar" ? "calendar" : "journal",
      filter: p.filter === "reply" || p.filter === "rough" ? p.filter : "all",
      month: typeof p.month === "string" && /^\d{4}-\d{2}$/.test(p.month) ? p.month : undefined,
    };
  } catch {
    return { view: "journal", filter: "all" };
  }
}

const MOOD: Record<ZoneId, string> = {
  comfort: "Mostly in your comfort zone",
  "stretch-enjoying": "Mostly stretching and enjoying it",
  "stretch-overwhelmed": "Mostly stretched and overwhelmed",
  panic: "Mostly in the panic zone",
};
const WEEKDAY: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ReflectionsPage() {
  const qc = useQueryClient();
  const { userData, refetchUserData } = useUserData();
  const userId = userData?._id ?? "";
  const reflectionsQ = useQuery(["my-reflections", userId], () => learnerApi.getMyReflections(userId), { enabled: !!userId });
  const meQ = useQuery(["my-user", userId], () => api.get<{ data: User }>(`users/${userId}`).then((r) => r.data.data), { enabled: !!userId });
  const summary = useQuery(["my-summary"], learnerApi.getSummary);
  const holidays = useHolidayDates() ?? NO_HOLIDAYS;
  const raw = useMemo(() => reflectionsQ.data ?? [], [reflectionsQ.data]);
  const { addReflection } = useReflections(userId, raw as unknown as HookReflection[]);

  const nowSec = useClock(30_000);
  const today = bangkokNow().date;
  const course = summary.data?.course;
  const courseInfo = course?.start_date ? { start: course.start_date, days: course.course_days } : undefined;
  usePageHeader({ title: "Reflections", context: course && course.week_number > 0 ? `Week ${course.week_number} of ${course.total_weeks}` : undefined });

  const nights = useMemo(() => toNights(raw), [raw]);
  const tonight = nights.find((n) => n.day === today);
  const protectedDates = useMemo(
    () => new Set((meQ.data?.care_energy_log ?? []).filter((e) => e.kind === "protect" && e.relatedDate).map((e) => e.relatedDate as string)),
    [meQ.data?.care_energy_log]
  );
  const stats = useMemo(() => nightStats(nights, today, holidays, protectedDates), [nights, today, holidays, protectedDates]);
  const strip = useMemo(() => weekStrip(nights, today, holidays, protectedDates), [nights, today, holidays, protectedDates]);

  // streak + plant
  const streak = useStreakCalculation(raw as unknown as HookReflection[], protectedDates, holidays);
  const growth = meQ.data?.growth_points ?? 0;
  const progress = getNextTierProgress(streak.currentStreak, growth);
  const tier = getPlantTier(getEffectivePlantDays(streak.currentStreak, growth));
  const nextName = progress.isMaxTier ? "" : cap(getPlantTierConfig((tier + 1) as PlantTier).name);

  // remembered view, filter, month
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs(userId));
  useEffect(() => setPrefs(loadPrefs(userId)), [userId]);
  const update = (patch: Partial<Prefs>) =>
    setPrefs((p) => {
      const next = { ...p, ...patch };
      if (userId) save(prefsKey(userId), next);
      return next;
    });
  const [ty, tm] = today.split("-").map(Number);
  const [my, mm] = (prefs.month ?? today.slice(0, 7)).split("-").map(Number);
  const month = { y: my, m: mm - 1 };
  const firstMonth = nights.length ? nights[nights.length - 1].day.slice(0, 7) : today.slice(0, 7);
  const monthKey = `${my}-${String(mm).padStart(2, "0")}`;
  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(my, mm - 1 + delta, 1));
    update({ month: d.toISOString().slice(0, 7) });
  };

  // unread TA replies
  // seen reply ids, tagged with whose they are so a different login never inherits them
  const [seenState, setSeenState] = useState<{ owner: string; ids: Set<string> } | null>(null);
  const seen = seenState && seenState.owner === userId ? seenState.ids : null;
  useEffect(() => {
    if (!userId || !reflectionsQ.isSuccess || seen) return;
    const stored = load(seenKey(userId));
    const ids = readSeen(stored, nights);
    if (stored === null) save(seenKey(userId), [...ids]);
    setSeenState({ owner: userId, ids });
  }, [userId, reflectionsQ.isSuccess, nights, seen]);
  const markSeen = (n: Night) => {
    if (!n.reply || !seen || seen.has(n._id)) return;
    const ids = new Set(seen).add(n._id);
    save(seenKey(userId), [...ids]);
    setSeenState({ owner: userId, ids });
  };
  const unseen = seen ? unseenReplies(nights, seen) : [];
  const unseenIds = new Set(unseen.map((n) => n._id));

  // journal + calendar state
  // null = untouched: the newest night starts open
  const [openState, setOpenState] = useState<Set<string> | null>(null);
  const open = openState ?? new Set(nights[0] ? [nights[0]._id] : []);
  const setOpen = (next: Set<string>) => setOpenState(next);
  const [weeksShown, setWeeksShown] = useState(3);
  const [selectedId, setSelectedId] = useState<string>();
  // n bumps on every "Read reply" so the journal scrolls even to the same night again
  const [focus, setFocus] = useState<{ id: string; n: number }>();
  const inMonth = (n: Night) => n.day.slice(0, 7) === monthKey;
  const picked = nights.find((n) => n._id === selectedId);
  const selected = picked && inMonth(picked) ? picked : nights.find(inMonth);

  const toggle = (n: Night) => {
    const next = new Set(open);
    if (next.has(n._id)) next.delete(n._id);
    else {
      next.add(n._id);
      markSeen(n);
    }
    setOpen(next);
  };
  const select = (n: Night) => {
    setSelectedId(n._id);
    markSeen(n);
    if (n.day.slice(0, 7) !== monthKey) update({ month: n.day.slice(0, 7) });
  };
  const readReply = () => {
    const n = unseen[0];
    if (!n) return;
    markSeen(n);
    if (prefs.view === "calendar") select(n);
    else {
      setOpen(new Set(open).add(n._id));
      setWeeksShown(Number.MAX_SAFE_INTEGER);
      if (prefs.filter !== "all" && !matchesFilter(n, prefs.filter)) update({ filter: "all" });
      setFocus((f) => ({ id: n._id, n: (f?.n ?? 0) + 1 }));
    }
  };

  // sending + rewards
  const [celebrate, setCelebrate] = useState<{ count: number; hasEgg?: boolean; comeback?: boolean; warning?: string } | null>(null);
  const [giftsOpen, setGiftsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const navigate = useNavigate();
  const refreshPlant = () => {
    qc.invalidateQueries(["my-user"]);
    qc.invalidateQueries(["learnerGenmateGarden"]);
  };
  useEffect(() => {
    if (!userId) return;
    let live = true;
    giftBoxService
      .reconcileMilestones(userId)
      .then((boxes) => live && boxes.length > 0 && setCelebrate({ count: boxes.length, hasEgg: boxes.some((b) => b.reward_pool === "character-egg") }))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [userId]);

  const send = async (zoneId: ZoneId, a: Answers) => {
    const comeback = !streak.hasCurrentStreak && streak.oldStreak > 0;
    let created: Reflection;
    try {
      created = (await addReflection({
        user_id: userId,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        day: today,
        reflection: {
          barometer: reflectionZones.find((z) => z.id === zoneId)!.label,
          tech_sessions: { happy: a.th, improve: a.ti },
          non_tech_sessions: { happy: a.sh, improve: a.si },
        },
      } as HookReflection)) as unknown as Reflection;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit reflection. Please try again later.");
      // e.g. already sent from another tab: reload so the card shows tonight's reflection
      qc.invalidateQueries(["my-reflections"]);
      throw err;
    }
    toast.success("Reflection sent. Thank you!");
    qc.setQueryData<Reflection[]>(["my-reflections", userId], (old) => [created, ...(old ?? [])]);
    qc.invalidateQueries(["my-reflections"]);
    refreshPlant();
    Promise.resolve(refetchUserData?.()).catch(() => undefined);
    if ((created?.reward_boxes?.length ?? 0) > 0 || created?.reward_warning || comeback) {
      setCelebrate({
        count: created.reward_boxes?.length ?? 0,
        hasEgg: created.reward_boxes?.some((b) => b.reward_pool === "character-egg"),
        comeback,
        warning: created.reward_warning,
      });
    }
  };

  // this-week sentence
  const weekWritten = strip.filter((c) => c.state === "written").length;
  const weekSoFar = strip.filter((c) => c.state === "written" || c.state === "missed").length;
  const missedNames = strip.filter((c) => c.state === "missed").map((c) => WEEKDAY[c.label]);
  const todayInWeek = strip.some((c) => c.state === "today");
  const weekSentence = [
    todayInWeek ? `Write tonight to make it ${weekWritten + 1} this week.` : weekWritten ? "Nice work this week." : "",
    missedNames.length ? `${missedNames.join(", ")} ${missedNames.length === 1 ? "was" : "were"} missed. That's okay.` : weekWritten ? "No nights missed so far." : "",
  ]
    .filter(Boolean)
    .join(" ");

  const displayStreak = streak.hasCurrentStreak ? streak.currentStreak : 0;
  const filterCount = { reply: stats.replies, rough: nights.filter((n) => n.zone === "panic" || n.zone === "stretch-overwhelmed").length };
  const dateLabel = dayLabel(today);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[28px] font-semibold tracking-tight">Your reflections</h2>
        {course && course.week_number > 0 && <span className="text-[13px] text-l-ink3">{`Week ${course.week_number} of ${course.total_weeks}`}</span>}
      </div>

      {/* Row 1: tonight + this week */}
      <div className="l-card mt-4 grid grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
        <TonightCard dateLabel={dateLabel} nowSec={nowSec} sent={tonight} onSend={send} />
        <section aria-label="This week" className="border-t border-l-hair bg-l-sub/50 p-6 lg:border-l lg:border-t-0">
          <div className="flex items-baseline justify-between">
            <b className="text-[14px]">This week</b>
            <span className="text-[12px] text-l-ink3">{weekSoFar ? `${weekWritten} of ${weekSoFar + (todayInWeek ? 0 : 0)} nights so far` : ""}</span>
          </div>
          <div className="mt-3.5 grid grid-cols-5 gap-1.5">
            {strip.map((c) => (
              <div key={c.date} className={`flex flex-col items-center gap-1.5 rounded-[14px] py-2 ${c.state === "today" || c.date === today ? "bg-l-card" : ""}`}>
                <span className={`text-[11.5px] font-semibold ${c.date === today ? "text-l-ink" : "text-l-ink3"}`}>{c.label}</span>
                {c.night?.zone ? (
                  <BarometerFace zone={c.night.zone} size={30} />
                ) : (
                  <span className={`block h-[30px] w-[30px] rounded-full ${c.state === "today" ? "border-2 border-dashed border-l-ink" : "border-[1.5px] border-l-hair"}`} />
                )}
                <span className={`text-[10.5px] ${c.date === today ? "text-l-ink" : "text-l-ink3"}`}>
                  {c.date === today ? (c.night ? "Done" : "Today") : c.state === "missed" ? "Missed" : c.state === "protected" ? "Protected" : c.state === "off" ? "Off" : " "}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3.5 text-[12.5px] leading-relaxed text-l-ink2">{weekSentence}</p>
        </section>
      </div>

      {/* Row 2: how am I doing */}
      <div className="mt-3.5 grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <section className="l-card flex items-start gap-3.5 p-[18px] px-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-50 text-l-green dark:bg-green-950/40">
            <Sprout className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold">{displayStreak > 0 ? `${displayStreak} ${displayStreak === 1 ? "night" : "nights"} in a row` : "Start a streak tonight"}</div>
            <div className="mt-0.5 text-[12.5px] text-l-ink2">
              {progress.isMaxTier
                ? "Your plant is fully grown."
                : displayStreak > 0
                  ? `${progress.max - progress.current} more ${progress.max - progress.current === 1 ? "night" : "nights"} until your plant is ${nextName}`
                  : streak.bestStreak > 0
                    ? `Your best so far: ${streak.bestStreak} nights`
                    : "Each night you write helps your plant grow"}
            </div>
            <div className="mt-2.5 h-[5px] overflow-hidden rounded-full bg-l-hair">
              <div className="h-full rounded-full bg-l-green" style={{ width: `${progress.isMaxTier ? 100 : Math.round((progress.current / Math.max(1, progress.max)) * 100)}%` }} />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              <Link to="/learner/garden" className="text-[12.5px] font-semibold text-l-ink2 hover:text-l-ink">
                Open your garden ›
              </Link>
              {meQ.data && (
                <>
                  <CareEnergyInventoryButton userId={userId} balance={meQ.data.care_energy_balance ?? 0} eligibleProtectDate={streak.eligibleProtectDate} onUsed={refreshPlant} />
                  <PlantPalettePicker userId={userId} selected={meQ.data.selected_palette} onSaved={refreshPlant} />
                  <PlantCollectionDialog open={collectionOpen} onOpenChange={setCollectionOpen} onLoadoutChanged={refreshPlant} />
                </>
              )}
              <TeacherGiftBoxesDialog
                open={giftsOpen}
                onOpenChange={setGiftsOpen}
                onReward={refreshPlant}
                onViewCollection={() => setCollectionOpen(true)}
                onViewCharacterCollection={() => navigate("/character")}
              />
            </div>
          </div>
        </section>

        <section className={`l-card flex items-start gap-3.5 p-[18px] px-5 ${unseen.length ? "ring-[1.5px] ring-indigo-200 dark:ring-indigo-800" : ""}`}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-l-indigo dark:bg-indigo-950/40">
            <MessageCircle className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold">{unseen.length ? `${unseen.length} new ${unseen.length === 1 ? "reply" : "replies"} from your TAs` : "No new replies"}</div>
            <div className="mt-0.5 truncate text-[12.5px] text-l-ink2">
              {unseen.length ? `“${unseen[0].reply}”` : stats.replies ? `${stats.replies} ${stats.replies === 1 ? "reply" : "replies"} so far. Your TAs read every reflection.` : "Your TAs read every reflection."}
            </div>
            {unseen.length > 0 && (
              <button type="button" onClick={readReply} className="mt-2.5 rounded-full bg-l-indigo px-3.5 py-1.5 text-[12.5px] font-semibold text-white">
                Read reply
              </button>
            )}
          </div>
        </section>

        <section className="l-card flex items-start gap-3.5 p-[18px] px-5">
          <span className="shrink-0">{stats.dominant ? <BarometerFace zone={stats.dominant} size={40} /> : <span className="block h-10 w-10 rounded-full bg-l-sub" />}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold">{stats.dominant ? MOOD[stats.dominant] : "Your moods show up here"}</div>
            <div className="mt-0.5 text-[12.5px] text-l-ink2">{stats.classNights ? `${stats.written} of ${stats.classNights} class nights written` : "Write your first reflection tonight"}</div>
            <div className="mt-2.5 flex h-[5px] overflow-hidden rounded-full bg-l-hair">
              {ZONES.map((z) => (
                <div key={z.id} style={{ width: `${stats.mix[z.id] * 100}%`, background: z.c1 }} />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="View" className="l-card inline-flex rounded-xl p-1">
          {(["journal", "calendar"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={prefs.view === v}
              onClick={() => update({ view: v })}
              className={`rounded-[9px] px-4 py-2 text-[13.5px] font-semibold transition ${prefs.view === v ? "bg-l-ink text-l-card" : "text-l-ink2 hover:text-l-ink"}`}
            >
              {cap(v)}
            </button>
          ))}
        </div>
        <span className="hidden h-6 w-px bg-l-hair sm:block" />
        {(
          [
            ["all", "All nights"],
            ["reply", `TA replied · ${filterCount.reply}`],
            ["rough", `Rough nights · ${filterCount.rough}`],
          ] as [Filter, string][]
        ).map(([f, label]) => (
          <button
            key={f}
            type="button"
            aria-pressed={prefs.filter === f}
            onClick={() => update({ filter: f })}
            className={`rounded-full px-3.5 py-2 text-[13px] font-semibold ring-1 ring-l-hair transition ${prefs.filter === f ? "bg-l-ink text-l-card ring-l-ink" : "bg-l-card text-l-ink2 hover:text-l-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3.5">
        {reflectionsQ.isLoading ? (
          <div className="l-card h-[240px] max-w-[900px] animate-pulse" />
        ) : prefs.view === "journal" ? (
          <JournalView nights={nights} filter={prefs.filter} open={open} onToggle={toggle} weeksShown={weeksShown} onMore={() => setWeeksShown((w) => w + 3)} course={courseInfo} focus={focus} unseen={unseenIds} />
        ) : (
          <CalendarView
            nights={nights}
            filter={prefs.filter}
            month={month}
            onMonth={shiftMonth}
            canPrev={monthKey > firstMonth}
            canNext={my < ty || (my === ty && mm < tm)}
            today={today}
            holidays={holidays}
            protectedDays={protectedDates}
            course={courseInfo}
            selected={selected}
            onSelect={select}
            unseen={unseenIds}
          />
        )}
      </div>

      <Dialog open={celebrate !== null} onOpenChange={(o) => !o && setCelebrate(null)}>
        <DialogContent className="overflow-hidden border-emerald-200 bg-gradient-to-b from-amber-50 via-white to-emerald-50 text-center sm:max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl shadow-inner" aria-hidden="true">
            {celebrate?.hasEgg ? "🥚" : "🌱"}
          </div>
          <DialogHeader>
            <DialogTitle className="text-center font-serif text-3xl text-emerald-950">{celebrate?.comeback ? "Welcome back to your garden" : "Your care is showing"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {celebrate?.count
              ? celebrate.hasEgg
                ? "Your reflection journey reached a major milestone. A Standard Character Egg is waiting for you to hatch, alongside any garden rewards you earned."
                : `Your reflection journey reached a new milestone. ${celebrate.count === 1 ? "A permanent collectible is" : `${celebrate.count} permanent collectibles are`} waiting in your garden gift box.`
              : celebrate?.warning
                ? "Your reflection is safely saved. We will check your milestone gift again shortly."
                : "Your plant is awake again. Its growth and everything you collected are still here."}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(celebrate?.count ?? 0) > 0 && (
              <Button
                onClick={() => {
                  setCelebrate(null);
                  setGiftsOpen(true);
                }}
              >
                Open reward
              </Button>
            )}
            <Button variant="outline" onClick={() => setCelebrate(null)}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReflectionsPage;
