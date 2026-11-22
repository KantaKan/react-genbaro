import { ChevronDown, ChevronUp } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { BarometerFace, ZONES } from "@/learner/today/BarometerFace";
import { nicknames } from "@/learner/lib/name";
import type { AttendanceStatusType } from "@/domain/types/attendance";
import type { Session, TodayLearner } from "../types";
import { STATUS_LABEL, hhmm, statusSolid, statusTone } from "../ui/status";
import { LeaveMeter, warningText } from "../ui/LeaveMeter";
import { useMarkWithUndo } from "./useMarkWithUndo";

const SET: [string, AttendanceStatusType, string][] = [
  [
    "Present",
    "present",
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  ],
  [
    "Late",
    "late",
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  ],
  [
    "Excused",
    "absent_excused",
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  ],
  [
    "Absent",
    "absent",
    "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  ],
];

export function LearnerPanel({
  learner: l,
  session,
  date,
  onPrev,
  onNext,
  canMark = true,
  live = false,
  hideStats = false,
}: {
  learner: TodayLearner;
  session: Session;
  date: string;
  onChanged: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  canMark?: boolean;
  live?: boolean;
  hideStats?: boolean;
}) {
  const n = nicknames(l.zoom_name, l.first_name);
  const cell = l[session];
  const mark = useMarkWithUndo();
  const warn = warningText(l.leave_used);
  const zone = ZONES.find((z) => z.id === l.mood_yesterday);
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 pr-10">
        <UserAvatar
          userId={l.id}
          name={n.en}
          avatar={l.avatar}
          className="h-[52px] w-[52px]"
        />
        <div className="min-w-0">
          <b className="block text-[16.5px] font-semibold tracking-tight">
            {n.th ? `${n.th} · ${n.en}` : n.en}
          </b>
          <small className="block text-[12.5px] text-l-ink3">
            #{l.jsd_number} · Group {l.genmate_group || "–"} · {l.first_name}{" "}
            {l.last_name}
          </small>
        </div>
      </div>
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          aria-label="Previous learner"
          onClick={onPrev}
          className="grid h-7 w-7 place-items-center rounded-lg text-l-ink3 hover:bg-l-sub hover:text-l-ink"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next learner"
          onClick={onNext}
          className="grid h-7 w-7 place-items-center rounded-lg text-l-ink3 hover:bg-l-sub hover:text-l-ink"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <section className="mt-3 rounded-[14px] bg-l-sub p-3.5 shadow-[0_0_0_1px_var(--l-hair)]">
        <div className="text-[11.5px] text-l-ink3">
          {session === "morning" ? "Morning" : "Afternoon"} · today
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[15px] font-semibold">
          <span
            className={`inline-flex items-center gap-1.5 ${statusTone(cell.status)}`}
          >
            <i className="block h-[7px] w-[7px] rounded-full bg-current" />
            {STATUS_LABEL[cell.status]}
          </span>
          {cell.checked_in_at && (
            <span className="text-[12.5px] font-normal text-l-ink2">
              checked in {hhmm(cell.checked_in_at)}
              {cell.style
                ? ` · ${cell.style[0].toUpperCase()}${cell.style.slice(1)} style`
                : ""}
            </span>
          )}
          {cell.marked_by === "system" && (
            <span className="text-[12.5px] font-normal text-l-ink3">
              set automatically
            </span>
          )}
        </div>
        <div className="mt-2.5 grid grid-cols-4 gap-[3px] rounded-[10px] bg-l-card p-[3px] shadow-[0_0_0_1px_var(--l-hair)]">
          {SET.map(([label, st, on]) => (
            <button
              key={st}
              type="button"
              aria-pressed={cell.status === st}
              disabled={!canMark}
              onClick={() =>
                mark({ learner: l, cell, session, date, status: st, live })
              }
              className={`rounded-[7px] py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${cell.status === st ? on : "text-l-ink2 hover:bg-l-sub"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {!canMark && (
          <p className="mt-2 text-[11.5px] text-l-ink3">
            No class today, so nothing to mark.
          </p>
        )}
      </section>

      {!hideStats && (
        <>
          <div className="mt-4 flex items-center justify-between text-[13px] text-l-ink2">
            <span>Leave used</span>
            <b
              className={`font-semibold ${l.leave_used >= 7 ? "text-red-600" : l.leave_used >= 6 ? "text-amber-600" : "text-l-ink"}`}
            >{`${l.leave_used} of 8${warn ? ` · ${warn}` : ""}`}</b>
          </div>
          <div className="mt-2">
            <LeaveMeter used={l.leave_used} size="md" />
            <div className="mt-1 flex justify-between text-[10.5px] text-l-ink3">
              <span>0</span>
              <span>warn 4</span>
              <span>6</span>
              <span>7</span>
              <span>8</span>
            </div>
          </div>
          {[
            ["Attendance rate", `${(l.attendance_rate * 100).toFixed(1)}%`],
            [
              "On-time streak",
              `${l.streak} ${l.streak === 1 ? "day" : "days"}`,
            ],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between border-b border-l-hair py-2.5 text-[13px] text-l-ink2"
            >
              <span>{k}</span>
              <b className="font-semibold text-l-ink">{v}</b>
            </div>
          ))}
          <div className="flex items-center justify-between border-b border-l-hair py-2.5 text-[13px] text-l-ink2">
            <span>Mood last night</span>
            {zone ? (
              <b className="inline-flex items-center gap-1.5 font-semibold text-l-ink">
                <BarometerFace zone={zone.id} size={18} />
                {zone.a} {zone.b !== "zone" ? zone.b : ""}
              </b>
            ) : (
              <span className="text-l-ink3">No reflection</span>
            )}
          </div>
          <div className="mt-3.5 text-[11.5px] text-l-ink3">
            Last 10 class days
          </div>
          <div className="mt-2 grid grid-cols-10 gap-[3px]">
            {Array.from(
              { length: 10 },
              (_, i) => l.last10[l.last10.length - 10 + i],
            ).map((d, i) => (
              <i
                key={i}
                title={d ? `${d.date} · ${STATUS_LABEL[d.status]}` : ""}
                className={`block h-6 rounded-[5px] ${d ? statusSolid(d.status) : "bg-l-sub"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
