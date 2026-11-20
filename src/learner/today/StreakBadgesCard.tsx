import type { Badge } from "@/domain/types";
import { Medal } from "./Medal";

export function StreakBadgesCard({ streak, badges, perfectWeek }: { streak: number; badges: Badge[]; perfectWeek: boolean }) {
  const shown = badges.slice(0, 3);
  return (
    <section className="l-card p-[22px]">
      <h3 className="text-[15px] font-semibold">Streak &amp; badges</h3>
      <p className="mt-0.5 text-[12.5px] text-l-ink3">
        On time {streak} {streak === 1 ? "day" : "days"} in a row · {badges.length} {badges.length === 1 ? "badge" : "badges"}
      </p>
      <div className="mt-[18px] grid grid-cols-4 gap-1.5">
        <Medal name={`${streak}-day streak`} sub="On time" color="#ea580c" glyph={String(streak)} />
        {shown.map((b) => (
          <Medal key={b._id ?? b.name} name={b.name} sub={new Date(b.awardedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} color={b.color || "#6366f1"} glyph={b.name.slice(0, 1).toUpperCase()} />
        ))}
        {!perfectWeek && shown.length < 3 && <Medal name="Perfect week" sub="On time all week" locked progress={Math.min(1, streak / 5)} />}
      </div>
    </section>
  );
}
