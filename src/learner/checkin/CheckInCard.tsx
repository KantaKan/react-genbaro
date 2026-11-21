import { Component, lazy, Suspense, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { MySummary, SessionToday } from "../types";
import {
  bangkokNow,
  fmtClock,
  minutesUntil,
  phaseAt,
  sessionAt,
} from "../lib/time";
import { learnerApi, LearnerApiError } from "../api";
import { useClock } from "./useClock";
import { SlideControl } from "./SlideControl";
import { StyleFrame } from "./styles/StyleFrame";
import { STYLES, type StyleId } from "./styles/registry";
import { readReroll, bumpReroll } from "./styles/unlock";
import { resolveStyle } from "./resolveStyle";
import { Celebrate } from "./Celebrate";
import { pickLine } from "./lines";
import { play } from "./sound";
import type { CheckInControlProps } from "./types";

const lazyCache = new Map<StyleId, ComponentType<CheckInControlProps>>();
function controlFor(id: StyleId): ComponentType<CheckInControlProps> {
  if (id === "slide") return SlideControl;
  let c = lazyCache.get(id);
  if (!c) {
    c = lazy(STYLES.find((m) => m.id === id)!.load);
    lazyCache.set(id, c);
  }
  return c;
}

/** If a style's code fails to load, fall back to Slide so the learner can still check in. */
class StyleBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const hm = (iso: string) => {
  const m = bangkokNow(new Date(iso)).minutes;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
};

export function CheckInCard({
  summary,
  onCheckedIn,
  seed = "me",
  onOpenPicker,
}: {
  summary: MySummary;
  onCheckedIn: () => void;
  seed?: string;
  onOpenPicker?: () => void;
}) {
  const now = useClock();
  const session = sessionAt(summary.rules, now);
  const w = summary.rules[session];
  const phase = phaseAt(w, now);
  const today = bangkokNow().date;
  // A result we just got back, valid only for the same session and day.
  const [local, setLocal] = useState<{
    session: string;
    date: string;
    rec: SessionToday;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{
    session: string;
    msg: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const done =
    (local && local.session === session && local.date === today
      ? local.rec
      : null) ?? summary.today[session];
  const wd = new Date(`${today}T12:00:00Z`).getUTCDay();
  const classToday = summary.class_today !== false && wd !== 0 && wd !== 6;
  const [rerolls, setRerolls] = useState(() => readReroll(today));
  const [celebrate, setCelebrate] = useState(0);
  const prefs = summary.preferences ?? { checkin_style: "", checkin_random: false };
  const meta = resolveStyle(prefs, summary.streak, summary.perfect_week, today, seed, rerolls);
  const style = meta.id;
  const Control = controlFor(style);

  const checkIn = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const rec = await learnerApi.checkIn(style);
      setLocal({
        session,
        date: today,
        rec: { status: rec.status, checked_in_at: rec.submitted_at, style },
      });
      setCelebrate(Date.now());
      play("win");
      onCheckedIn();
    } catch (e) {
      if (e instanceof LearnerApiError && e.status === 409) {
        // "already checked in" resolves once the summary refreshes; "covered by leave" stays visible.
        setConflict({ session, msg: e.message });
        onCheckedIn();
      } else
        setError(
          e instanceof Error
            ? e.message
            : "Something went wrong. Please try again.",
        );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const leaveLink = (
    <Link
      to="/learner/attendance?leave=1"
      className="font-semibold text-l-ink underline"
    >
      Request leave
    </Link>
  );
  let big: string, small: React.ReactNode;
  if (!classToday && !done) {
    big = "No class today";
    small = "Enjoy the day. Check-in opens again on the next class day.";
  } else if (done) {
    const part = session === "morning" ? "this morning" : "this afternoon";
    if (done.status === "absent") {
      big = `Marked absent ${part}`;
      small = <>Had a reason? {leaveLink} and a TA will review it.</>;
    } else if (done.status === "absent_excused") {
      big = `Excused ${part}`;
      small = "Your approved leave covers it. Nothing to do.";
    } else if (done.status === "late" || done.status === "late_excused") {
      big = `Checked in at ${hm(done.checked_in_at)} · late`;
      small =
        done.status === "late_excused"
          ? "Late, but excused by your approved leave."
          : "It counts toward your 8 days. Arriving on time tomorrow keeps it from growing.";
    } else {
      big = `You're in · ${hm(done.checked_in_at)}`;
      small = `On time. That's ${summary.streak} ${summary.streak === 1 ? "day" : "days"} in a row.${celebrate ? ` ${pickLine(false, celebrate)}` : ""}`;
    }
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
    small = <>Marked absent. {leaveLink} if you had a reason.</>;
  }

  const span =
    (w.absent_after.h * 60 +
      w.absent_after.m -
      (w.open_at.h * 60 + w.open_at.m)) *
    60;
  const startSec = (w.open_at.h * 60 + w.open_at.m) * 60;
  const markSec = done ? bangkokNow(new Date(done.checked_in_at)).seconds : now;
  const pos = Math.max(0, Math.min(100, ((markSec - startSec) / span) * 100));
  const latePos =
    (((w.late_after.h * 60 + w.late_after.m) * 60 - startSec) / span) * 100;
  const canAct =
    classToday && !done && (phase === "on_time" || phase === "late");

  return (
    <section className="l-card relative p-[22px]">
      {celebrate > 0 && <Celebrate key={celebrate} />}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">
            {session === "morning" ? "Morning check-in" : "Afternoon check-in"}
          </h3>
          <p className="mt-0.5 text-[12.5px] text-l-ink3">
            On time until {fmtClock(w.late_after)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {prefs.checkin_random && rerolls < 1 && !done && (
            <button
              type="button"
              onClick={() => setRerolls(bumpReroll(today))}
              className="rounded-full px-2.5 py-1 text-[12px] font-medium text-l-ink2 hover:bg-l-sub"
            >
              Reroll
            </button>
          )}
          <button
            type="button"
            onClick={onOpenPicker}
            className="rounded-full bg-l-card px-3 py-1.5 text-[12.5px] font-medium shadow-[0_0_0_1px_var(--l-hair)] hover:shadow-[0_0_0_1px_var(--l-ink3)]"
          >
            {prefs.checkin_random ? "Random" : "Style"} · {meta.name}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[22px] font-semibold leading-tight tracking-tight">
          {big}
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-l-ink2">{small}</p>
        {conflict && conflict.session === session && !done && (
          <p role="status" className="mt-2 text-sm font-medium text-l-indigo">
            {conflict.msg}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm font-medium text-l-red">
            {error}
          </p>
        )}
      </div>

      {canAct && (
        <div className="mt-5">
          <StyleFrame disabled={false} busy={busy} onComplete={checkIn}>
            {(() => {
              const props: CheckInControlProps = {
                tone: phase === "late" ? "late" : "on_time",
                disabled: false,
                busy,
                onComplete: checkIn,
                minutesLeft: minutesUntil(phase === "late" ? w.absent_after : w.late_after, now),
                deadline: fmtClock(phase === "late" ? w.absent_after : w.late_after),
              };
              const fallback = <SlideControl {...props} />;
              return (
                <StyleBoundary key={style} fallback={fallback}>
                  <Suspense fallback={fallback}>
                    <Control {...props} />
                  </Suspense>
                </StyleBoundary>
              );
            })()}
          </StyleFrame>
        </div>
      )}

      {classToday && (
        <div className="relative mt-6 h-8" aria-hidden>
          <div
            className="absolute inset-x-0 top-2 h-1.5 rounded-full"
            style={{
              background: `linear-gradient(90deg, #bbf7d0 0 ${latePos}%, #fde68a ${latePos}% 100%)`,
            }}
          />
          <span className="absolute top-5 text-[11px] text-l-ink3">
            {fmtClock(w.open_at)}
          </span>
          <span
            className="absolute top-5 -translate-x-1/2 text-[11px] text-l-ink3"
            style={{ left: `${latePos}%` }}
          >
            {fmtClock(w.late_after)}
          </span>
          <span className="absolute right-0 top-5 text-[11px] text-l-ink3">
            {fmtClock(w.absent_after)}
          </span>
          <span
            className="absolute top-0.5 h-[18px] w-[18px] -translate-x-1/2 rounded-full bg-l-card shadow-[0_0_0_1.5px_var(--l-ink),0_4px_10px_-2px_rgba(0,0,0,.25)] transition-[left] duration-500"
            style={{ left: `${pos}%` }}
          />
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-2.5 border-t border-l-hair pt-4">
        <Stat
          label="On-time streak"
          value={`${summary.streak} ${summary.streak === 1 ? "day" : "days"}`}
        />
        <Stat
          label="Leave used"
          value={`${summary.leave_used} of ${summary.leave_allowance}`}
        />
        <Stat
          label="Attendance"
          value={`${(summary.attendance_rate * 100).toFixed(1)}%`}
        />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-l-ink3">{label}</div>
      <div className="text-[17px] font-semibold tabular-nums tracking-tight">
        {value}
      </div>
    </div>
  );
}
