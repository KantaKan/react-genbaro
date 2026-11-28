import { useQuery, useQueryClient } from "react-query";
import { PlantCard } from "./PlantCard";
import { useMyPlant } from "../lib/useMyPlant";
import { useUserData } from "@/UserDataContext";
import { learnerApi } from "../api";
import type { MySummary } from "../types";
import { usePageHeader } from "../shell/LearnerShell";
import { useCup } from "../cup/useChampion";
import { LeaderboardCard } from "../cup/LeaderboardCard";
import { YourGroupCard } from "../cup/YourGroupCard";
import { CheckInCard, CheckInCardSkeleton } from "../checkin/CheckInCard";
import { StylePicker } from "../checkin/StylePicker";
import { useMemo, useState } from "react";
import { useClock } from "../checkin/useClock";
import { bangkokNow } from "../lib/time";
import { nicknames } from "../lib/name";
import { weekCells } from "../lib/week";
import { ReflectionCard, ReflectionCardSkeleton } from "./ReflectionCard";
import { WeekCard, WeekCardSkeleton } from "./WeekCard";
import { LeaveCard, LeaveCardSkeleton } from "./LeaveCard";
import { BoardLatestCard } from "./BoardLatestCard";
import { StreakBadgesCard, StreakBadgesCardSkeleton } from "./StreakBadgesCard";
import { LoadingHint } from "@/components/LoadingSkeleton";
import { Link } from "react-router-dom";
import { useAuth } from "@/application/contexts/AuthContext";
import { Tour } from "../tour/Tour";
import { tourSteps } from "../tour/steps";

export function TodayPage() {
  const qc = useQueryClient();
  const [picker, setPicker] = useState(false);
  const { userData } = useUserData();
  const summary = useQuery(["my-summary"], learnerApi.getSummary, { staleTime: 0, refetchInterval: 60_000 });
  const history = useQuery(["my-history", 14], () => learnerApi.getHistory(14));
  const journey = useQuery(["journey"], learnerApi.getJourney, { staleTime: 5 * 60_000, retry: false });
  const cup = useCup();
  const reflections = useQuery(["my-reflections", userData?._id], () => learnerApi.getMyReflections(userData!._id), { enabled: !!userData?._id });
  const now = useClock(30_000);
  const today = bangkokNow().date;
  const plant = useMyPlant();
  const dateLabel = new Date(`${today}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  usePageHeader({ title: "Today", context: dateLabel });

  const nick = nicknames(userData?.zoom_name, userData?.first_name ?? "");
  const s = summary.data;
  const { userRole } = useAuth();
  const [tourOpen, setTourOpen] = useState(false);
  const [tourDone, setTourDone] = useState(false);
  const firstVisit = userRole === "learner" && s?.preferences.tour_seen === false && !tourDone;
  const closeTour = () => {
    setTourOpen(false);
    setTourDone(true);
    if (s?.preferences.tour_seen === false) {
      qc.setQueryData<MySummary | undefined>(["my-summary"], (o) => o && { ...o, preferences: { ...o.preferences, tour_seen: true } });
      learnerApi.savePreferences({ tour_seen: true }).catch(() => {});
    }
  };
  const rules = s?.rules;
  const steps = useMemo(() => (rules ? tourSteps(rules) : []), [rules]);
  const week = weekCells(history.data ?? [], today);
  const weekOnTime = week.filter((c) => c.am === "present" && (c.pm === "present" || (c.isToday && c.pm === null))).length;
  const refresh = () => {
    qc.invalidateQueries(["my-summary"]);
    qc.invalidateQueries(["my-history"]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[28px] font-semibold tracking-tight">
              {now < 12 * 3600 ? "Good morning" : now < 17 * 3600 ? "Good afternoon" : "Good evening"}, {nick.en}
            </h2>
            {s && (
              <button type="button" onClick={() => setTourOpen(true)} className="rounded-lg px-3 py-1.5 text-body font-medium text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)] hover:bg-l-sub hover:text-l-ink">
                วิธีใช้
              </button>
            )}
          </div>
          <p className="mt-1 text-l-ink2">
            {dateLabel}
            {s && s.course.day_number > 0 && ` · Day ${s.course.day_number} of ${s.course.course_days}`}
          </p>
        </div>
        {s && s.course.day_number > 0 && (
          <div className="min-w-[280px]">
            <div className="mb-2 flex justify-between text-small text-l-ink2">
              <span>Course progress</span>
              <b className="font-semibold text-l-ink">{`Week ${s.course.week_number} of ${s.course.total_weeks}`}</b>
            </div>
            <div className="flex gap-[3px]">
              {Array.from({ length: s.course.total_weeks }, (_, i) => (
                <i key={i} className="block h-1.5 flex-1 rounded-[3px]" style={{ background: i < s.course.week_number ? "var(--l-ink)" : "var(--l-hair)" }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {journey.data?.unlocked && (
        <Link to="/learner/journey" className="mt-6 flex items-center justify-between gap-4 rounded-[20px] bg-[#1e3d2c] px-5 py-4 text-[#e8f7ee] transition-transform active:scale-[0.99]">
          <span>
            <b className="block text-title font-semibold">Journey ของคุณพร้อมแล้ว</b>
            <span className="text-small opacity-80">ย้อนดูทั้งคอร์ส แล้วแชร์ได้เลย</span>
          </span>
          <span className="text-title" aria-hidden>
            ›
          </span>
        </Link>
      )}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div data-tour="checkin" className="empty:hidden scroll-mt-20">{s ? <CheckInCard summary={s} onCheckedIn={refresh} seed={userData?._id ?? "me"} onOpenPicker={() => setPicker(true)} /> : summary.isLoading ? <CheckInCardSkeleton /> : null}</div>
          <div data-tour="week" className="scroll-mt-20">{history.isLoading ? <WeekCardSkeleton /> : <WeekCard cells={week} />}</div>
          <BoardLatestCard />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div data-tour="plant" className="empty:hidden scroll-mt-20">{plant.ready && <PlantCard plant={plant} />}</div>
          <div data-tour="reflection" className="scroll-mt-20">
            {reflections.isLoading || !userData ? (
              <ReflectionCardSkeleton />
            ) : (
              <ReflectionCard userId={userData._id} reflections={reflections.data ?? []} nowSec={now} today={today} onSubmitted={() => qc.invalidateQueries(["my-reflections"])} />
            )}
          </div>
          {s ? <StreakBadgesCard badges={userData?.badges ?? []} perfectWeek={s.perfect_week} weekOnTime={weekOnTime} /> : summary.isLoading && <StreakBadgesCardSkeleton />}
          <div data-tour="leave" className="empty:hidden scroll-mt-20">{s ? <LeaveCard used={s.leave_used} allowance={s.leave_allowance} rate={s.attendance_rate} /> : summary.isLoading && <LeaveCardSkeleton />}</div>
          {(summary.isLoading || history.isLoading) && <LoadingHint label="Loading your day" />}
        </div>
        {cup.data && (
          <>
            <div className="lg:col-span-7">
              <LeaderboardCard cup={cup.data} now={new Date()} />
            </div>
            <div className="lg:col-span-5">
              <YourGroupCard cup={cup.data} />
            </div>
          </>
        )}
      </div>
      {s && <StylePicker open={picker} onOpenChange={setPicker} summary={s} />}
      {s && (firstVisit || tourOpen) && <Tour steps={steps} onClose={closeTour} />}
    </div>
  );
}
