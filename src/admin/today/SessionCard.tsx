import type { Session, TodayView } from "../types";
import { bkkMinutes, clockMin, fmtClock, phaseOf } from "./time";

const C = 2 * Math.PI * 42;

export function SessionCard({ view, session, onSession, nowMin }: { view: TodayView; session: Session; onSession: (s: Session) => void; nowMin: number }) {
  const c = view.counts[session];
  const inN = c.on_time + c.late;
  const w = view.rules[session];
  const start = clockMin(w.open_at), end = clockMin(w.absent_after), late = clockMin(w.late_after);
  const pos = (m: number) => Math.max(0, Math.min(100, ((m - start) / (end - start)) * 100));
  const phase = phaseOf(view.rules, session, nowMin);
  const arc = (n: number, offset: number, color: string) => (n > 0 && c.total > 0 ? <circle cx="48" cy="48" r="42" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(n / c.total) * C} ${C}`} strokeDashoffset={-offset} /> : null);
  const onT = (c.on_time / Math.max(1, c.total)) * C, lt = (c.late / Math.max(1, c.total)) * C;
  const big = phase === "on_time" ? `${late - nowMin} min` : phase === "late" ? `${end - nowMin} min` : phase === "before" ? fmtClock(w.open_at) : "Closed";
  const sub = phase === "on_time" ? `until late · ${fmtClock(w.late_after)}` : phase === "late" ? `late now · absent at ${fmtClock(w.absent_after)}` : phase === "before" ? "check-in opens" : `absent after ${fmtClock(w.absent_after)}`;
  return (
    <section aria-label="Check-in" className="rounded-[18px] bg-gradient-to-b from-l-sub to-l-card p-4 shadow-[0_0_0_1px_var(--l-hair)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-title font-semibold">{view.class_today ? `${session === "morning" ? "Morning" : "Afternoon"} check-in` : "No class today"}</h2>
        <div className="inline-flex rounded-[10px] bg-l-card p-[3px] shadow-[0_0_0_1px_var(--l-hair)]">
          {(["morning", "afternoon"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={session === s} onClick={() => onSession(s)} className={`rounded-[7px] px-2.5 py-0.5 text-xs font-semibold capitalize ${session === s ? "bg-l-ink text-l-card" : "text-l-ink2"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[84px] w-[84px] shrink-0" role="img" aria-label={`${inN} of ${c.total} checked in`}>
          <svg width="84" height="84" viewBox="0 0 96 96" className="-rotate-90">
            <circle cx="48" cy="48" r="42" fill="none" stroke="var(--l-hair)" strokeWidth="9" />
            {arc(c.on_time, 0, "#16a34a")}
            {arc(c.late, onT, "#d97706")}
            {arc(c.leave, onT + lt, "#4f46e5")}
          </svg>
          <b className="absolute inset-0 grid place-items-center pb-3 text-[24px] font-bold tabular-nums tracking-tight">{inN}</b>
          <small className="absolute inset-x-0 bottom-[18px] text-center text-micro text-l-ink3">of {c.total} in</small>
        </div>
        {view.class_today && (
          <div className="min-w-0">
            <p className={`flex items-center gap-1.5 text-[26px] font-bold leading-none tracking-tight tabular-nums ${phase === "on_time" ? "text-emerald-600" : phase === "late" ? "text-amber-600" : "text-l-ink2"}`}>
              {(phase === "on_time" || phase === "late") && <i aria-hidden className="block h-2 w-2 animate-pulse rounded-full bg-current" />}
              {big}
            </p>
            <p className="mt-1 text-small text-l-ink3">{sub}</p>
          </div>
        )}
      </div>
      {view.class_today && (
        <div className="relative mt-4 h-[30px]" aria-hidden>
          <div className="absolute inset-x-0 top-2 h-[5px] rounded-full" style={{ background: `linear-gradient(90deg,#bbf7d0 0 ${pos(late)}%,#fde68a ${pos(late)}% 100%)` }} />
          {view.learners.map((l) => l[session].checked_in_at && <i key={l.id} className="absolute top-1 block h-[13px] w-[2px] rounded bg-emerald-600 opacity-60" style={{ left: `${pos(bkkMinutes(new Date(l[session].checked_in_at!)))}%` }} />)}
          {phase !== "before" && phase !== "closed" && <span className="absolute top-0.5 h-[17px] w-[2px] rounded bg-l-ink" style={{ left: `${pos(nowMin)}%` }} />}
          <small className="absolute top-[19px] text-micro text-l-ink3">{fmtClock(w.open_at)}</small>
          <small className="absolute top-[19px] -translate-x-1/2 text-micro text-l-ink3" style={{ left: `${pos(late)}%` }}>
            {fmtClock(w.late_after)} late
          </small>
          <small className="absolute right-0 top-[19px] text-micro text-l-ink3">{fmtClock(w.absent_after)}</small>
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-small text-l-ink2">
        {(
          [
            ["bg-emerald-600", "On time", c.on_time],
            ["bg-amber-600", "Late", c.late],
            ["bg-indigo-600", "On leave", c.leave],
            ["bg-red-500", "Absent", c.absent],
            ["bg-l-hair", "Not yet", c.not_yet],
          ] as const
        )
          .filter(([, t, n]) => t !== "Absent" || n > 0)
          .map(([k, t, n]) => (
            <span key={t} className="flex items-center gap-1.5">
              <i aria-hidden className={`block h-2 w-2 rounded-sm ${k}`} />
              {t}
              <b className="ml-auto font-semibold tabular-nums text-l-ink">{n}</b>
            </span>
          ))}
      </div>
    </section>
  );
}
