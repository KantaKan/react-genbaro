import { UserAvatar } from "@/components/user-avatar";
import { nicknames } from "@/learner/lib/name";
import type { Session, TodayView } from "../types";
import { bkkMinutes, clockMin, fmtClock, phaseOf } from "./time";

const C = 2 * Math.PI * 42;

export function SessionCard({ view, session, onSession, nowMin }: { view: TodayView; session: Session; onSession: (s: Session) => void; nowMin: number }) {
  const c = view.counts[session];
  const inN = c.total - c.not_yet;
  const w = view.rules[session];
  const start = clockMin(w.open_at), end = clockMin(w.absent_after), late = clockMin(w.late_after);
  const pos = (m: number) => Math.max(0, Math.min(100, ((m - start) / (end - start)) * 100));
  const phase = phaseOf(view.rules, session, nowMin);
  const notYet = view.learners.filter((l) => !l[session].status);
  const arc = (n: number, offset: number, color: string) => (n > 0 && c.total > 0 ? <circle cx="48" cy="48" r="42" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(n / c.total) * C} ${C}`} strokeDashoffset={-offset} /> : null);
  const onT = (c.on_time / Math.max(1, c.total)) * C, lt = (c.late / Math.max(1, c.total)) * C;
  const live =
    !view.class_today ? null : phase === "before" ? `Opens at ${fmtClock(w.open_at)}` : phase === "on_time" ? `Live · ${late - nowMin} min until late` : phase === "late" ? `Late now · ${end - nowMin} min until absent` : "Closed";
  return (
    <section className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-4 rounded-[18px] bg-gradient-to-b from-l-sub to-l-card p-5 shadow-[0_0_0_1px_var(--l-hair)] 2xl:grid-cols-[auto_minmax(0,1fr)_250px]">
      <div className="relative h-24 w-24" role="img" aria-label={`${inN} of ${c.total} checked in`}>
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r="42" fill="none" stroke="var(--l-hair)" strokeWidth="8" />
          {arc(c.on_time, 0, "#16a34a")}
          {arc(c.late, onT, "#d97706")}
          {arc(c.leave, onT + lt, "#4f46e5")}
        </svg>
        <b className="absolute inset-0 grid place-items-center pb-3 text-[26px] font-bold tabular-nums tracking-tight">{inN}</b>
        <small className="absolute inset-x-0 bottom-5 text-center text-[10.5px] text-l-ink3">of {c.total}</small>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="whitespace-nowrap text-lg font-semibold tracking-tight">{view.class_today ? `${session === "morning" ? "Morning" : "Afternoon"} check-in` : "No class today"}</h2>
          {live && (
            <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${phase === "on_time" ? "text-emerald-600" : phase === "late" ? "text-amber-600" : "text-l-ink3"}`}>
              {(phase === "on_time" || phase === "late") && <i className="block h-[7px] w-[7px] animate-pulse rounded-full bg-current" />}
              {live}
            </span>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-l-ink2">
          {[
            [c.on_time, "on time"],
            [c.late, "late"],
            [c.leave, "on leave"],
            [c.absent, "absent"],
            [c.not_yet, "not yet"],
          ].map(([n, t]) => (
            <span key={t as string}>
              <b className="mr-1 text-[15px] tabular-nums text-l-ink">{n}</b>
              {t}
            </span>
          ))}
        </div>
        {view.class_today && (
          <div className="relative mt-7 h-[30px]" aria-hidden>
            <div className="absolute inset-x-0 top-2 h-[5px] rounded-full" style={{ background: `linear-gradient(90deg,#bbf7d0 0 ${pos(late)}%,#fde68a ${pos(late)}% 100%)` }} />
            {view.learners.map((l) => l[session].checked_in_at && <i key={l.id} className="absolute top-1 block h-[13px] w-[2px] rounded bg-emerald-600 opacity-60" style={{ left: `${pos(bkkMinutes(new Date(l[session].checked_in_at!)))}%` }} />)}
            {phase !== "before" && phase !== "closed" && (
              <span className="absolute top-0.5 h-[17px] w-[2px] rounded bg-l-ink" style={{ left: `${pos(nowMin)}%` }}>
                <small className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10.5px] font-bold">{`${Math.floor(nowMin / 60)}:${String(nowMin % 60).padStart(2, "0")}`}</small>
              </span>
            )}
            <small className="absolute top-[19px] text-[10.5px] text-l-ink3">{fmtClock(w.open_at)}</small>
            <small className="absolute top-[19px] -translate-x-1/2 text-[10.5px] text-l-ink3" style={{ left: `${pos(late)}%` }}>
              {fmtClock(w.late_after)} late
            </small>
            <small className="absolute right-0 top-[19px] text-[10.5px] text-l-ink3">{fmtClock(w.absent_after)} absent</small>
          </div>
        )}
      </div>
      <div className="col-span-2 flex flex-wrap items-start gap-x-6 gap-y-2.5 2xl:col-span-1 2xl:flex-col">
        <div className="inline-flex self-start rounded-[10px] bg-l-card p-[3px] shadow-[0_0_0_1px_var(--l-hair)]">
          {(["morning", "afternoon"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={session === s} onClick={() => onSession(s)} className={`rounded-[7px] px-3 py-1 text-xs font-semibold capitalize ${session === s ? "bg-l-ink text-l-card" : "text-l-ink2"}`}>
              {s}
            </button>
          ))}
        </div>
        {view.class_today && notYet.length > 0 && (
          <div>
            <div className="mb-2 text-xs text-l-ink3">Not in yet · {notYet.length}</div>
            <div className="flex flex-wrap gap-1.5">
              {notYet.slice(0, 8).map((l) => {
                const n = nicknames(l.zoom_name, l.first_name);
                return (
                  <span key={l.id} title={n.th || n.en} className="rounded-full shadow-[0_0_0_2px_var(--l-card)]">
                    <UserAvatar userId={l.id} name={n.en} avatar={l.avatar} className="h-[30px] w-[30px]" />
                  </span>
                );
              })}
              {notYet.length > 8 && <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-l-sub text-[11px] font-bold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">+{notYet.length - 8}</span>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
