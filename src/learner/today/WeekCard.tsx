import type { AttendanceStatusType } from "@/domain/types";
import type { WeekCell } from "../lib/week";
import { Bone } from "@/components/LoadingSkeleton";

const pill: Record<string, string> = {
  present: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  late: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  late_excused: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  absent_excused: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  absent: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};
const cls = (s: AttendanceStatusType | null) => (s && pill[s]) || "bg-l-sub text-l-ink3";

export function WeekCard({ cells }: { cells: WeekCell[] }) {
  return (
    <section className="l-card p-[22px]">
      <h3 className="text-title font-semibold">This week</h3>
      <p className="mt-0.5 text-small text-l-ink3">Morning and afternoon for each day</p>
      <div className="mt-4 grid grid-cols-5 gap-2.5">
        {cells.map((c) => (
          <div key={c.date} className={`rounded-[14px] p-3 ${c.isToday ? "shadow-[0_0_0_1.5px_var(--l-ink)]" : "shadow-[0_0_0_1px_var(--l-hair)]"} ${c.future ? "opacity-70" : ""}`}>
            <div className="text-small text-l-ink3">{c.isToday ? `${c.label} · Today` : c.label}</div>
            <div className="text-title font-semibold">{c.day}</div>
            <div className="mt-2.5 flex gap-1">
              <span className={`grid h-[22px] flex-1 place-items-center rounded-[7px] text-micro font-semibold ${cls(c.am)}`}>AM</span>
              <span className={`grid h-[22px] flex-1 place-items-center rounded-[7px] text-micro font-semibold ${cls(c.pm)}`}>PM</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WeekCardSkeleton() {
  return (
    <section className="l-card p-[22px]" aria-hidden>
      <Bone className="h-5 w-24" />
      <Bone className="mt-1.5 h-3.5 w-56" />
      <div className="mt-4 grid grid-cols-5 gap-2.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="rounded-[14px] p-3 shadow-[0_0_0_1px_var(--l-hair)]">
            <Bone className="h-3 w-8" />
            <Bone className="mt-1.5 h-5 w-6" />
            <div className="mt-2.5 flex gap-1">
              <Bone className="h-[22px] flex-1 rounded-[7px]" />
              <Bone className="h-[22px] flex-1 rounded-[7px]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
