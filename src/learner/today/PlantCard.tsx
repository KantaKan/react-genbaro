import { Link } from "react-router-dom";
import { SeedlingPlant } from "@/components/streak-components";
import type { DayCell } from "../reflections/model";
import type { useMyPlant } from "../lib/useMyPlant";

const DOT: Record<DayCell["state"], string> = {
  written: "bg-l-green",
  protected: "bg-sky-400",
  today: "border-2 border-dashed border-l-ink",
  missed: "bg-l-hair",
  future: "border-[1.5px] border-l-hair",
  off: "bg-l-sub",
  none: "border-[1.5px] border-l-hair",
};

/** Today's hero: your plant is your streak. */
export function PlantCard({ plant }: { plant: ReturnType<typeof useMyPlant> }) {
  const { nights, best, writtenToday, stage, nextStage, toNext, pct, week, appearance } = plant;
  return (
    <section className="l-card overflow-hidden p-0">
      <div className="flex items-stretch gap-4 p-[22px] pb-4">
        <div className="grid h-[104px] w-[104px] shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-green-50 to-l-sub dark:from-green-950/30">
          {appearance && <SeedlingPlant appearance={appearance} showParticles={nights > 0} className="h-[92px] w-[92px]" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-title font-semibold">Your plant</h3>
            <span className="text-small text-l-ink3">{stage}</span>
          </div>
          <p className="mt-1 text-[22px] font-semibold leading-tight tracking-tight">
            {nights > 0 ? `${nights} ${nights === 1 ? "night" : "nights"} in a row` : "Resting for now"}
          </p>
          <p className="mt-1 text-small text-l-ink2">
            {nights === 0
              ? best > 0
                ? `Your best is ${best} nights. One reflection wakes it up.`
                : "It grows a little every night you reflect."
              : nextStage
                ? `${toNext} more ${toNext === 1 ? "night" : "nights"} until it's ${nextStage}`
                : "Fully grown. Keep it blooming."}
          </p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-l-sub" role="progressbar" aria-label="Growth to the next stage" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-l-green transition-[width] duration-700" style={{ width: `${nights > 0 ? pct : 0}%` }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-l-hair bg-l-sub/60 px-[22px] py-3">
        <ol className="flex gap-1.5" aria-label="This week">
          {week.map((c) => (
            <li key={c.date} className="flex flex-col items-center gap-1">
              <span className={`block h-3 w-3 rounded-full ${DOT[c.state]}`} title={`${c.label} · ${c.state}`} />
              <span className="text-micro text-l-ink3">{c.label.slice(0, 1)}</span>
            </li>
          ))}
        </ol>
        <span className="flex-1" />
        {writtenToday ? (
          <span className="text-small font-medium text-l-green">Tonight's done</span>
        ) : (
          <Link to="/learner/reflections" className="rounded-full bg-l-ink px-3.5 py-1.5 text-small font-semibold text-l-card">
            Reflect tonight
          </Link>
        )}
      </div>
    </section>
  );
}
