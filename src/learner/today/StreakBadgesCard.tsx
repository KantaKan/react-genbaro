import { Link } from "react-router-dom";
import type { Badge } from "@/domain/types";
import { Medal } from "./Medal";

const MAX = 7; // plus the streak medal = two rows of four

/** The on-time streak; a zero stays quiet instead of a big orange 0. */
export function StreakMedal({ streak }: { streak: number }) {
  return streak > 0 ? (
    <Medal name={`${streak}-day streak`} sub="On time" color="#ea580c" glyph={String(streak)} />
  ) : (
    <Medal name="On-time streak" sub="Next check-in" locked progress={0} />
  );
}

export function StreakBadgesCard({ streak, badges, perfectWeek, weekOnTime }: { streak: number; badges: Badge[]; perfectWeek: boolean; weekOnTime: number }) {
  const newest = [...badges].sort((a, b) => (b.awardedAt > a.awardedAt ? 1 : b.awardedAt < a.awardedAt ? -1 : 0));
  const shown = newest.slice(0, MAX);
  return (
    <section className="l-card p-[22px]">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold">Streak &amp; badges</h3>
        {badges.length > MAX && (
          <Link to="/learner/my-profile" className="text-[12.5px] font-medium text-l-ink2 hover:text-l-ink">
            See all {badges.length} badges
          </Link>
        )}
      </div>
      <p className="mt-0.5 text-[12.5px] text-l-ink3">
        {streak > 0 ? `On time ${streak} ${streak === 1 ? "day" : "days"} in a row` : "A fresh start at your next check-in"} · {badges.length} {badges.length === 1 ? "badge" : "badges"}
      </p>
      <div className="mt-[18px] grid grid-cols-4 gap-x-1.5 gap-y-4">
        <StreakMedal streak={streak} />
        {shown.map((b) => (
          <Medal
            key={b._id ?? `${b.name}-${b.awardedAt}`}
            name={b.name}
            sub={new Date(b.awardedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            color={b.color || "#6366f1"}
            emoji={b.emoji || undefined}
            imageUrl={b.imageUrl || undefined}
            glyph={b.name.slice(0, 1).toUpperCase()}
          />
        ))}
        {!perfectWeek && shown.length < MAX && <Medal name="Perfect week" sub={`${weekOnTime} of 5 days`} locked progress={Math.min(1, weekOnTime / 5)} />}
      </div>
      {badges.length === 0 && <p className="mt-3 text-[12.5px] text-l-ink3">Badges you earn show up here.</p>}
    </section>
  );
}
