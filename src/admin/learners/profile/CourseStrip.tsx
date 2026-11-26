import type { AttendanceStatusType } from "@/domain/types/attendance";
import { statusSolid } from "../../ui/status";
import type { Overview, OverviewDay } from "../../wellbeing";
import { mondayOf } from "./days";

const MOOD: Record<string, string> = { comfort: "bg-emerald-300", "stretch-enjoying": "bg-amber-300", "stretch-overwhelmed": "bg-orange-300", panic: "bg-violet-300" };
const WORST: string[] = ["absent", "late", "absent_excused", "late_excused", "present"];

const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};

/** The worse of the two sessions, so a late afternoon still shows. */
function dayStatus(d: OverviewDay): AttendanceStatusType | "" {
  const s = [d.morning?.status, d.afternoon?.status].filter((x): x is AttendanceStatusType => !!x);
  return s.sort((a, b) => WORST.indexOf(a) - WORST.indexOf(b))[0] ?? "";
}

export function CourseStrip({ o, today, onPick }: { o: Overview; today: string; onPick: (date: string) => void }) {
  if (o.days.length === 0) return null;
  const first = mondayOf(o.days[0].date);
  const last = o.days[o.days.length - 1].date;
  const spanned = Math.floor((Date.parse(`${last}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / (7 * 864e5)) + 1;
  const weeks = Math.max(o.course.total_weeks || 0, spanned);
  const by = new Map(o.days.map((d) => [d.date, d]));
  const cols = { gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` };

  const cell = (date: string, kind: "att" | "mood") => {
    const d = by.get(date);
    const ring = date === today ? "outline outline-[1.5px] outline-offset-1 outline-l-ink" : "";
    if (!d) return <i key={date} className={`block h-2.5 rounded-[2px] bg-l-sub ${ring}`} />;
    const status = dayStatus(d);
    const bg = kind === "att" ? (status ? statusSolid(status) : "bg-l-sub") : d.reflection?.zone ? (MOOD[d.reflection.zone] ?? "bg-l-sub") : "shadow-[inset_0_0_0_1px_var(--l-hair)]";
    const label = kind === "att" ? `${date}: ${status || "no check-in"}` : `${date}: ${d.reflection?.zone || "no reflection"}`;
    return <button key={date} type="button" aria-label={label} title={label} onClick={() => onPick(date)} className={`block h-2.5 rounded-[2px] hover:opacity-75 ${bg} ${ring}`} />;
  };

  const row = (kind: "att" | "mood") => (
    <div className="grid gap-1" style={cols}>
      {Array.from({ length: weeks }, (_, w) => (
        <div key={w} className="grid grid-cols-5 gap-px">
          {Array.from({ length: 5 }, (_, i) => cell(addDays(first, w * 7 + i), kind))}
        </div>
      ))}
    </div>
  );

  return (
    <section className="mt-3.5 rounded-2xl px-4 py-3 shadow-[0_0_0_1px_var(--l-hair)]">
      <div className="grid grid-cols-[60px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5">
        <span className="text-small text-l-ink3">Check-in</span>
        {row("att")}
        <span className="text-small text-l-ink3">Mood</span>
        {row("mood")}
        <span />
        <div className="grid gap-1 text-micro text-l-ink3" style={cols}>
          {Array.from({ length: weeks }, (_, w) => (
            <span key={w} className={o.course.week_number === w + 1 ? "font-semibold text-l-ink" : ""}>{`W${w + 1}`}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
