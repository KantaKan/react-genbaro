import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Cell, CellStatus } from "../lib/calendar";

const COLOR: Record<string, string> = {
  present: "var(--l-green)",
  late: "var(--l-amber)",
  absent: "var(--l-red)",
  absent_excused: "var(--l-indigo)",
  late_excused: "var(--l-indigo)",
};
const bar = (s: CellStatus) => (s && COLOR[s]) || "var(--l-hair)";

export function MonthCalendar({
  title,
  cells,
  selected,
  onSelect,
  onPrev,
  onNext,
}: {
  title: string;
  cells: Cell[];
  selected: string | null;
  onSelect: (c: Cell) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const month = title.split(" ")[0];
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-title font-semibold">{title}</h3>
          <p className="mt-0.5 text-small text-l-ink3">Tap a day for details · left half morning, right half afternoon</p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" aria-label="Previous month" onClick={onPrev} className="grid h-8 w-8 place-items-center rounded-full shadow-[0_0_0_1px_var(--l-hair)]">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button type="button" aria-label="Next month" onClick={onNext} className="grid h-8 w-8 place-items-center rounded-full shadow-[0_0_0_1px_var(--l-hair)]">
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="pb-0.5 text-center text-small text-l-ink3">
            {d}
          </div>
        ))}
        {cells.map((c, i) =>
          !c.date ? (
            <div key={`b${i}`} />
          ) : c.weekend ? (
            <div key={c.date} className="min-h-[64px] rounded-xl bg-l-sub p-2 text-small font-semibold text-l-ink3">
              {c.day}
            </div>
          ) : (
            <button
              key={c.date}
              type="button"
              aria-label={`${month} ${c.day}`}
              aria-pressed={selected === c.date}
              onClick={() => onSelect(c)}
              className={`flex min-h-[64px] flex-col gap-1 rounded-xl p-2 text-left transition duration-300 hover:-translate-y-0.5 ${
                selected === c.date ? "shadow-[0_0_0_2px_var(--l-indigo)]" : c.isToday ? "shadow-[0_0_0_1.5px_var(--l-ink)]" : "shadow-[0_0_0_1px_var(--l-hair)]"
              }`}
            >
              <span className="text-small font-semibold">
                {c.day}
                {c.isToday && <span className="sr-only ml-1 text-micro font-medium text-l-ink3 sm:not-sr-only">Today</span>}
              </span>
              {c.am === "none" && <span className="text-micro text-l-ink3">No class</span>}
              <span className="mt-auto flex gap-[3px]">
                <i className="block h-2 flex-1 rounded-[3px]" style={{ background: bar(c.am) }} />
                <i className="block h-2 flex-1 rounded-[3px]" style={{ background: bar(c.pm) }} />
              </span>
            </button>
          )
        )}
      </div>
      <div className="mt-3.5 flex flex-wrap gap-3.5 text-xs text-l-ink2">
        {[["Present", "var(--l-green)"], ["Late", "var(--l-amber)"], ["Absent", "var(--l-red)"], ["Excused", "var(--l-indigo)"], ["Upcoming / no class", "var(--l-hair)"]].map(([l, c]) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
