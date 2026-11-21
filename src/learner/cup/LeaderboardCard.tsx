import { Crown, Medal, Sparkles, Trophy } from "lucide-react";
import type { MyCup } from "./types";
import { moments, weekProgress } from "./lib";

const STEP = [
  "h-[86px] bg-[linear-gradient(180deg,#f4f4f5,#a1a1aa_70%,#71717a)]",
  "h-[118px] bg-[linear-gradient(180deg,#fde68a,#f59e0b_60%,#b45309)]",
  "h-[66px] bg-[linear-gradient(180deg,#fed7aa,#ea580c_70%,#c2410c)]",
];
const PLACE = [2, 1, 3];

const todayIdx = (now: Date, week: string) => Math.floor((now.getTime() - new Date(`${week}T00:00:00+07:00`).getTime()) / 86_400_000);

export function LeaderboardCard({ cup, now }: { cup: MyCup; now: Date }) {
  const top = cup.standings.slice(0, 3);
  const podium = [top[1], top[0], top[2]];
  const empty = (cup.standings[0]?.total ?? 0) === 0;
  const { pct, left } = weekProgress(now, cup.week, cup.ends_at);
  const m = moments(cup.standings, todayIdx(now, cup.week));
  return (
    <section className="l-card p-[22px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-b from-amber-200 to-amber-500 text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,.6)]">
            <Trophy className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold">GenMate Cup · Week {cup.week_no}</h3>
            <p className="mt-0.5 text-[12.5px] text-l-ink3">Group points from coding, soft skills, showing up and helping</p>
          </div>
        </div>
        <span className="whitespace-nowrap rounded-full bg-l-sub px-2.5 py-1 text-xs font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">{left}</span>
      </div>

      {empty ? (
        <p className="mt-8 rounded-2xl bg-l-sub px-4 py-6 text-center text-[13px] text-l-ink2">No points yet this week. The first award puts a group on the podium.</p>
      ) : (
        <ol aria-label="Top 3" className="mt-6 grid grid-cols-[1fr_1.15fr_1fr] items-end gap-2.5">
          {podium.map((s, i) =>
            s ? (
              <li key={s.group} data-group={s.group} className="flex flex-col items-center gap-2 text-center">
                {PLACE[i] === 1 && <Crown className="h-5 w-5 text-amber-500" strokeWidth={1.75} />}
                <b className="text-[22px] font-bold tracking-tight">Group {s.group}</b>
                <small className="text-xs tabular-nums text-l-ink3">{s.total} pts</small>
                <span className={`relative grid w-full place-items-center overflow-hidden rounded-t-[14px] rounded-b-md text-xl font-extrabold text-white ${STEP[i]}`}>{PLACE[i]}</span>
              </li>
            ) : (
              <li key={`none${i}`} aria-hidden className="h-px" />
            )
          )}
        </ol>
      )}

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-xs text-l-ink3">
          <span>This week · Mon → Fri 16:45</span>
          <span className="tabular-nums">{Math.round(pct * 100)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-l-sub shadow-[inset_0_0_0_1px_var(--l-hair)]">
          <i className="block h-full rounded-full bg-l-ink transition-[width] duration-700" style={{ width: `${pct * 100}%` }} />
        </div>
      </div>

      {m.length > 0 && (
        <>
          <h4 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-[.08em] text-l-ink3">Moments</h4>
          <ul className="flex flex-col gap-1.5 text-[13px] text-l-ink2">
            {m.map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" strokeWidth={1.75} />
                {t}
              </li>
            ))}
          </ul>
        </>
      )}

      <h4 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-[.08em] text-l-ink3">Winner gets, next week</h4>
      <div className="grid grid-cols-2 gap-2 text-[12.5px] text-l-ink2">
        {[
          [Crown, "Gold avatar frame"],
          [Sparkles, "Gold background"],
          [Trophy, "Victory Lap check-in"],
          [Medal, "Cup medal, forever"],
        ].map(([Icon, t]) => {
          const I = Icon as typeof Crown;
          return (
            <span key={t as string} className="flex items-center gap-2 rounded-xl bg-l-sub px-3 py-2">
              <I className="h-4 w-4 text-l-ink" strokeWidth={1.5} />
              {t as string}
            </span>
          );
        })}
      </div>
    </section>
  );
}
