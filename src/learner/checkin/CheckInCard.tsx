import { useRef, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import type { MySummary, SessionToday } from "../types";
import { bangkokNow, fmtClock, minutesUntil, phaseAt, sessionAt } from "../lib/time";
import { learnerApi, LearnerApiError } from "../api";
import { useClock } from "./useClock";
import { SlideControl } from "./SlideControl";
import type { CheckInControlProps } from "./types";

/** Check-in styles by id. Plan 3 adds the rest; unknown ids fall back to slide. */
export const CHECKIN_CONTROLS: Record<string, ComponentType<CheckInControlProps>> = { slide: SlideControl };

const hm = (iso: string) => {
  const m = bangkokNow(new Date(iso)).minutes;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
};

export function CheckInCard({ summary, onCheckedIn }: { summary: MySummary; onCheckedIn: () => void }) {
  const now = useClock();
  const session = sessionAt(summary.rules, now);
  const w = summary.rules[session];
  const phase = phaseAt(w, now);
  const [local, setLocal] = useState<SessionToday | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const done = local ?? summary.today[session];
  const style = summary.preferences?.checkin_style || "slide";
  const Control = CHECKIN_CONTROLS[style] ?? SlideControl;

  const checkIn = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const rec = await learnerApi.checkIn(style);
      setLocal({ status: rec.status, checked_in_at: rec.submitted_at, style });
      onCheckedIn();
    } catch (e) {
      if (e instanceof LearnerApiError && e.status === 409) onCheckedIn();
      else setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  let big: string, small: React.ReactNode;
  if (done) {
    const late = done.status === "late" || done.status === "late_excused";
    big = late ? `Checked in at ${hm(done.checked_in_at)} · late` : `You're in · ${hm(done.checked_in_at)}`;
    small = late ? "It counts toward your 8 days. Arriving on time tomorrow keeps it from growing." : `On time. That's ${summary.streak} ${summary.streak === 1 ? "day" : "days"} in a row.`;
  } else if (phase === "not_open") {
    big = `Opens at ${fmtClock(w.open_at)}`;
    small = `${minutesUntil(w.open_at, now)} min to go.`;
  } else if (phase === "on_time") {
    big = "You're on time";
    small = `${minutesUntil(w.late_after, now)} min until ${fmtClock(w.late_after)}. After that it counts as late.`;
  } else if (phase === "late") {
    big = "Running late? Still check in";
    small = `It counts as late now. ${minutesUntil(w.absent_after, now)} min until it becomes absent.`;
  } else {
    big = "Check-in closed";
    small = (
      <>
        Marked absent.{" "}
        <Link to="/learner/attendance?leave=1" className="font-semibold text-l-ink underline">
          Request leave
        </Link>{" "}
        if you had a reason.
      </>
    );
  }

  const span = (w.absent_after.h * 60 + w.absent_after.m - (w.open_at.h * 60 + w.open_at.m)) * 60;
  const startSec = (w.open_at.h * 60 + w.open_at.m) * 60;
  const markSec = done ? bangkokNow(new Date(done.checked_in_at)).seconds : now;
  const pos = Math.max(0, Math.min(100, ((markSec - startSec) / span) * 100));
  const latePos = (((w.late_after.h * 60 + w.late_after.m) * 60 - startSec) / span) * 100;
  const canAct = !done && (phase === "on_time" || phase === "late");

  return (
    <section className="l-card p-[22px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">{session === "morning" ? "Morning check-in" : "Afternoon check-in"}</h3>
          <p className="mt-0.5 text-[12.5px] text-l-ink3">On time until {fmtClock(w.late_after)}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[22px] font-semibold leading-tight tracking-tight">{big}</div>
        <p className="mt-1.5 text-sm leading-relaxed text-l-ink2">{small}</p>
        {error && (
          <p role="alert" className="mt-2 text-sm font-medium text-l-red">
            {error}
          </p>
        )}
      </div>

      {canAct && (
        <div className="mt-5">
          <Control tone={phase === "late" ? "late" : "on_time"} disabled={false} busy={busy} onComplete={checkIn} />
        </div>
      )}

      <div className="relative mt-6 h-8" aria-hidden>
        <div
          className="absolute inset-x-0 top-2 h-1.5 rounded-full"
          style={{ background: `linear-gradient(90deg, #bbf7d0 0 ${latePos}%, #fde68a ${latePos}% 100%)` }}
        />
        <span className="absolute top-5 text-[11px] text-l-ink3">{fmtClock(w.open_at)}</span>
        <span className="absolute top-5 -translate-x-1/2 text-[11px] text-l-ink3" style={{ left: `${latePos}%` }}>
          {fmtClock(w.late_after)}
        </span>
        <span className="absolute right-0 top-5 text-[11px] text-l-ink3">{fmtClock(w.absent_after)}</span>
        <span
          className="absolute top-0.5 h-[18px] w-[18px] -translate-x-1/2 rounded-full bg-l-card shadow-[0_0_0_1.5px_var(--l-ink),0_4px_10px_-2px_rgba(0,0,0,.25)] transition-[left] duration-500"
          style={{ left: `${pos}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5 border-t border-l-hair pt-4">
        <Stat label="On-time streak" value={`${summary.streak} ${summary.streak === 1 ? "day" : "days"}`} />
        <Stat label="Leave used" value={`${summary.leave_used} of ${summary.leave_allowance}`} />
        <Stat label="Attendance" value={`${(summary.attendance_rate * 100).toFixed(1)}%`} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-l-ink3">{label}</div>
      <div className="text-[17px] font-semibold tabular-nums tracking-tight">{value}</div>
    </div>
  );
}
