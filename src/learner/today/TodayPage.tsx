import { useQuery, useQueryClient } from "react-query";
import { PlantCard } from "./PlantCard";
import { useMyPlant } from "../lib/useMyPlant";
import { useUserData } from "@/UserDataContext";
import { learnerApi } from "../api";
import { usePageHeader } from "../shell/LearnerShell";
import { useCup } from "../cup/useChampion";
import { LeaderboardCard } from "../cup/LeaderboardCard";
import { YourGroupCard } from "../cup/YourGroupCard";
import { CheckInCard, CheckInCardSkeleton } from "../checkin/CheckInCard";
import { StylePicker } from "../checkin/StylePicker";
import { useState } from "react";
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

export function TodayPage() {
  const qc = useQueryClient();
  const [picker, setPicker] = useState(false);
  const { userData } = useUserData();
  const summary = useQuery(["my-summary"], learnerApi.getSummary, { staleTime: 0, refetchInterval: 60_000 });
  const history = useQuery(["my-history", 14], () => learnerApi.getHistory(14));
  const cup = useCup();
  const reflections = useQuery(["my-reflections", userData?._id], () => learnerApi.getMyReflections(userData!._id), { enabled: !!userData?._id });
  const now = useClock(30_000);
  const today = bangkokNow().date;
  const plant = useMyPlant();
  const dateLabel = new Date(`${today}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  usePageHeader({ title: "Today", context: dateLabel });

  const nick = nicknames(userData?.zoom_name, userData?.first_name ?? "");
  const s = summary.data;
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
          <h2 className="text-[28px] font-semibold tracking-tight">
            {now < 12 * 3600 ? "Good morning" : now < 17 * 3600 ? "Good afternoon" : "Good evening"}, {nick.en}
          </h2>
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

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-7">
          {s ? <CheckInCard summary={s} onCheckedIn={refresh} seed={userData?._id ?? "me"} onOpenPicker={() => setPicker(true)} /> : summary.isLoading ? <CheckInCardSkeleton /> : null}
          {history.isLoading ? <WeekCardSkeleton /> : <WeekCard cells={week} />}
          <BoardLatestCard />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5">
          {plant.ready && <PlantCard plant={plant} />}
          {reflections.isLoading || !userData ? (
            <ReflectionCardSkeleton />
          ) : (
            <ReflectionCard userId={userData._id} reflections={reflections.data ?? []} nowSec={now} today={today} onSubmitted={() => qc.invalidateQueries(["my-reflections"])} />
          )}
          {s ? <StreakBadgesCard badges={userData?.badges ?? []} perfectWeek={s.perfect_week} weekOnTime={weekOnTime} /> : summary.isLoading && <StreakBadgesCardSkeleton />}
          {s ? <LeaveCard used={s.leave_used} allowance={s.leave_allowance} rate={s.attendance_rate} /> : summary.isLoading && <LeaveCardSkeleton />}
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
    </div>
  );
}
