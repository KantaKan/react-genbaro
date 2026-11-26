import type { Overview } from "../../wellbeing";

const box = "min-w-[104px] rounded-[14px] bg-l-card px-3.5 py-2.5 shadow-[0_0_0_1px_var(--l-hair)]";

export function KpiBoxes({ o }: { o: Overview }) {
  const sent = o.days.filter((d) => d.reflection).length;
  const unreplied = o.days.filter((d) => d.reflection && !d.reflection.reply).length;
  const fill = o.leave_used >= 7 ? "bg-red-500" : o.leave_used >= 6 ? "bg-amber-500" : "bg-l-ink2";
  return (
    <div className="flex flex-wrap gap-2.5 tabular-nums">
      <div className={box}>
        <small className="block text-small text-l-ink3">Attendance</small>
        <b className="block text-[22px] font-bold leading-tight tracking-tight">
          {(o.attendance_rate * 100).toFixed(1)}
          <span className="ml-0.5 text-small font-medium text-l-ink3">%</span>
        </b>
        <small className="text-small text-l-ink3">{`Cohort avg ${(o.cohort_attendance * 100).toFixed(1)}%`}</small>
      </div>
      <div className={box}>
        <small className="block text-small text-l-ink3">Absent · leave · late</small>
        <b className={`block text-[22px] font-bold leading-tight tracking-tight ${o.leave_used >= 7 ? "text-red-600" : o.leave_used >= 6 ? "text-amber-600" : ""}`}>
          {o.leave_used}
          <span className="ml-0.5 text-small font-medium text-l-ink3">/ 8</span>
        </b>
        <div className="mt-1.5 flex gap-0.5" aria-hidden>
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} className={`block h-1 w-2 rounded-sm ${i < o.leave_used ? fill : "bg-l-hair"}`} />
          ))}
        </div>
      </div>
      <div className={box}>
        <small className="block text-small text-l-ink3">On time in a row</small>
        <b className="block text-[22px] font-bold leading-tight tracking-tight">
          {o.streak}
          <span className="ml-1 text-small font-medium text-l-ink3">days</span>
        </b>
        <small className="text-small text-l-ink3">{`Best ${o.best_streak}`}</small>
      </div>
      <div className={box}>
        <small className="block text-small text-l-ink3">Reflections</small>
        <b className="block text-[22px] font-bold leading-tight tracking-tight">
          {sent}
          <span className="ml-0.5 text-small font-medium text-l-ink3">/ {o.days.length}</span>
        </b>
        <small className="text-small text-l-ink3">{unreplied ? `${unreplied} not replied` : "All replied"}</small>
      </div>
    </div>
  );
}
