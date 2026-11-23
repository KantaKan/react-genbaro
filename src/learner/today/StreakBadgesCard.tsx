import { Link } from "react-router-dom";
import type { Badge } from "@/domain/types";
import { Medal } from "./Medal";

const MAX = 8; // two rows of four

export function StreakBadgesCard({ badges, perfectWeek, weekOnTime }: { badges: Badge[]; perfectWeek: boolean; weekOnTime: number }) {
  const newest = [...badges].sort((a, b) => (b.awardedAt > a.awardedAt ? 1 : b.awardedAt < a.awardedAt ? -1 : 0));
  const shown = newest.slice(0, MAX);
  return (
    <section className="l-card p-[22px]">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-title font-semibold">Badges</h3>
        {badges.length > MAX && (
          <Link to="/learner/my-profile" className="text-small font-medium text-l-ink2 hover:text-l-ink">
            See all {badges.length} badges
          </Link>
        )}
      </div>
      <p className="mt-0.5 text-small text-l-ink3">
        {badges.length ? `${badges.length} ${badges.length === 1 ? "badge" : "badges"} earned` : "Badges you earn show up here."}
      </p>
      <div className="mt-[18px] grid grid-cols-4 gap-x-1.5 gap-y-4">
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
    </section>
  );
}
