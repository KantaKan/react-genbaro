import { useEffect, useMemo, useRef } from "react";
import { BarometerFace, type ZoneId } from "@/learner/today/BarometerFace";
import type { Who } from "../../learner/useMarkWithUndo";
import type { OverviewDay } from "../../wellbeing";
import { DayRow } from "./DayRow";
import { isMissing, isRough, isUnreplied, matches, weeksOf } from "./days";

export type Filter = "all" | "unreplied" | "rough" | "missing";


const editable = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

export function DayList({
  days,
  who,
  today,
  reflOpen,
  open,
  onToggle,
  filter,
  setFilter,
  q,
  setQ,
  onNote,
  onStep,
}: {
  days: OverviewDay[];
  who: Who;
  today: string;
  reflOpen: boolean;
  open: Set<string>;
  filter: Filter;
  setFilter: (f: Filter) => void;
  q: string;
  setQ: (q: string) => void;
  onToggle: (week: string) => void;
  onNote: (t: string) => Promise<unknown>;
  onStep: (t: string) => Promise<unknown>;
}) {
  const missing = (d: OverviewDay) => isMissing(d, today, reflOpen);
  const tests: Record<Exclude<Filter, "all">, (d: OverviewDay) => boolean> = { unreplied: isUnreplied, rough: isRough, missing };
  const search = useRef<HTMLInputElement>(null);
  const weeks = useMemo(() => weeksOf(days), [days]);
  const narrowed = filter !== "all" || q.trim() !== "";
  const keep = (d: OverviewDay) => (filter === "all" || tests[filter](d)) && (!q.trim() || matches(d, q));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !editable(e.target)) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tabs: [Filter, string, number | null][] = [
    ["all", "All", null],
    ["unreplied", "Not replied", days.filter(isUnreplied).length],
    ["rough", "Rough", days.filter(isRough).length],
    ["missing", "Missing", days.filter(missing).length],
  ];

  return (
    <section className="rounded-2xl px-2 pb-2 pt-3 shadow-[0_0_0_1px_var(--l-hair)]">
      <div className="flex flex-wrap items-center gap-2.5 px-2">
        <h4 className="text-body font-semibold">Class days</h4>
        <div className="inline-flex rounded-full bg-l-sub p-[3px]">
          {tabs.map(([k, label, n]) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={`rounded-full px-2.5 py-1 text-small ${filter === k ? "bg-l-card font-semibold text-l-ink shadow-[0_1px_2px_rgba(0,0,0,.08)]" : "text-l-ink2"}`}
            >
              {label}
              {n !== null && <span className="ml-1 font-semibold text-l-ink3">{n}</span>}
            </button>
          ))}
        </div>
        <input
          ref={search}
          aria-label="Search reflections"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search  /"
          className="ml-auto h-8 w-40 rounded-full bg-l-sub px-3 text-small text-l-ink outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]"
        />
      </div>
      {days.length === 0 && <p className="px-2 py-6 text-small text-l-ink3">No class days yet.</p>}
      {weeks.map((w, i) => {
        const rows = w.days.filter(keep);
        if (narrowed && rows.length === 0) return null;
        const expanded = narrowed || i === 0 || open.has(w.key);
        const rough = w.days.some(isRough);
        const pending = w.days.filter(isUnreplied).length;
        return (
          <div key={w.key}>
            <div className="sticky top-0 z-[1] flex items-center gap-2 bg-l-card px-2 pb-1.5 pt-3">
              <b className="text-small font-semibold">{w.label}</b>
              <span className={`text-small ${rough && !expanded ? "font-medium text-red-600 dark:text-red-400" : "text-l-ink3"}`}>
                {w.range}
                {!expanded && (rough ? " · rough week" : pending ? ` · ${pending} not replied` : " · all replied")}
              </span>
              <span className="ml-auto flex gap-[3px]" aria-hidden>
                {[...w.days]
                  .reverse()
                  .map((d) => (d.reflection?.zone ? <BarometerFace key={d.date} zone={d.reflection.zone as ZoneId} size={12} /> : <i key={d.date} className="block h-3 w-3 rounded-full shadow-[inset_0_0_0_1px_var(--l-hair)]" />))}
              </span>
              {!narrowed && i > 0 && (
                <button type="button" onClick={() => onToggle(w.key)} className="text-small font-medium text-l-ink2 hover:text-l-ink">
                  {expanded ? "Hide" : "Show ›"}
                </button>
              )}
            </div>
            {expanded && rows.map((d) => <DayRow key={d.date} day={d} who={who} today={today} reflOpen={reflOpen} onNote={onNote} onStep={onStep} />)}
          </div>
        );
      })}
    </section>
  );
}
