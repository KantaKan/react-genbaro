import { useEffect, useRef } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { BarometerFace, ZONES, type ZoneId } from "../today/BarometerFace";
import { UserAvatar } from "@/components/user-avatar";
import { groupByWeek, matchesFilter, monthGrid, rowWeek, type Course, type DayCell, type Filter, type Night } from "./model";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const zone = (id: ZoneId | undefined) => ZONES.find((z) => z.id === id);
export const zoneLabel = (id: ZoneId | undefined, fallback = "") => {
  const z = zone(id);
  if (!z) return fallback;
  return z.a === "Stretch" ? `Stretch · ${z.b}` : `${z.a} ${z.b}`;
};
export const dayLabel = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${SHORT[d.getUTCMonth()]}`;
};

/** Pastel tint for a zone (calendar cells, zone pill). */
const TINT: Record<ZoneId, { bg: string; ink: string }> = {
  comfort: { bg: "#ecfccb", ink: "#3f6212" },
  "stretch-enjoying": { bg: "#fef9c3", ink: "#854d0e" },
  "stretch-overwhelmed": { bg: "#ffedd5", ink: "#9a3412" },
  panic: { bg: "#ffe4e6", ink: "#9f1239" },
};

function ZonePill({ id, barometer }: { id: ZoneId | undefined; barometer: string }) {
  const t = id ? TINT[id] : undefined;
  return (
    <span className="rounded-full px-2.5 py-1 text-[12.5px] font-semibold" style={t ? { background: t.bg, color: t.ink } : undefined}>
      {zoneLabel(id, barometer)}
    </span>
  );
}

function Answer({ title, good, improve }: { title: string; good: string; improve: string }) {
  return (
    <div className="rounded-[14px] bg-l-sub px-3.5 py-3 text-[13.5px] leading-relaxed">
      <div className="text-[11.5px] font-bold tracking-wide text-l-ink3">{title}</div>
      <div className="mt-1.5">
        <span className="font-bold text-l-green" aria-label="Went well">+</span> {good || <span className="text-l-ink3">—</span>}
      </div>
      <div className="mt-1">
        <span className="font-bold text-l-amber" aria-label="To improve">→</span> {improve || <span className="text-l-ink3">—</span>}
      </div>
    </div>
  );
}

export function Reply({ text, isNew = false, by = "", name = "" }: { text: string; isNew?: boolean; by?: string; name?: string }) {
  return (
    <div className="mt-3 flex gap-2.5">
      {by ? (
        <UserAvatar userId={by} name={name || "TA"} className="h-[30px] w-[30px] shrink-0" />
      ) : (
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-l-indigo text-[11px] font-bold text-white">TA</span>
      )}
      <div className="rounded-[4px_16px_16px_16px] bg-indigo-50 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-zinc-900 dark:bg-indigo-950/50 dark:text-zinc-100">
        <div className="text-[12px] font-bold text-indigo-700 dark:text-indigo-300">
          <span>{name || "Your TA"}</span>
          {isNew && <span className="ml-1.5 rounded-full bg-l-indigo px-1.5 py-px text-[10px] font-bold text-white">New</span>}
        </div>
        <p className="whitespace-pre-line">{text}</p>
      </div>
    </div>
  );
}

export function NightAnswers({ n, grid = true, isNew = false }: { n: Night; grid?: boolean; isNew?: boolean }) {
  return (
    <>
      <div className={`mt-3.5 grid gap-3 ${grid ? "sm:grid-cols-2" : ""}`}>
        <Answer title="TECH" good={n.techHappy} improve={n.techImprove} />
        <Answer title="NON-TECH" good={n.softHappy} improve={n.softImprove} />
      </div>
      {n.reply && <Reply text={n.reply} isNew={isNew} by={n.replyBy} name={n.replyName} />}
    </>
  );
}

export function JournalView({
  nights,
  filter,
  open,
  onToggle,
  weeksShown,
  onMore,
  course,
  focus,
  unseen,
}: {
  nights: Night[];
  filter: Filter;
  open: Set<string>;
  onToggle: (n: Night) => void;
  weeksShown: number;
  onMore: () => void;
  course?: Course;
  focus?: { id: string; n: number };
  unseen?: Set<string>;
}) {
  const focusRef = useRef<HTMLDivElement>(null);
  const handled = useRef(focus?.n ?? 0);
  useEffect(() => {
    // scroll once per "Read reply" click, not again when the view remounts
    if (!focus || focus.n === handled.current) return;
    handled.current = focus.n;
    focusRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [focus]);

  if (nights.length === 0) return <Empty text="No reflections yet. Your first one shows up here." />;
  const groups = groupByWeek(nights.filter((n) => matchesFilter(n, filter)));
  if (groups.length === 0) return <Empty text="No nights match this filter." />;

  return (
    <div className="flex max-w-[900px] flex-col gap-2.5">
      {groups.slice(0, weeksShown).map((g) => {
        const w = rowWeek(g.monday, course);
        return (
          <div key={g.monday} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 px-1 pb-0.5 pt-3">
              <b className="text-[14px]">{w ? `Week ${w}` : g.range}</b>
              {w > 0 && <span className="text-[12.5px] text-l-ink3">{g.range}</span>}
              <span className="h-px flex-1 bg-l-hair" />
            </div>
            {g.nights.map((n) =>
              open.has(n._id) ? (
                <div key={n._id} ref={focus?.id === n._id ? focusRef : undefined} className={`l-card flex p-[18px] pl-0 ${focus?.id === n._id ? "ring-2 ring-l-indigo" : ""}`}>
                  <div className="w-[72px] shrink-0 text-center sm:w-[84px]">
                    <div className="text-[26px] font-semibold leading-none">{Number(n.day.slice(8))}</div>
                    <div className="mt-1 text-[12px] text-l-ink3">{dayLabel(n.day).slice(0, 3)}</div>
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <div className="flex items-center gap-2.5">
                      {n.zone && <BarometerFace zone={n.zone} size={30} />}
                      <ZonePill id={n.zone} barometer={n.barometer} />
                      <span className="flex-1" />
                      <button type="button" onClick={() => onToggle(n)} className="flex items-center gap-1 text-[13px] text-l-ink3 hover:text-l-ink" aria-label={`Collapse ${dayLabel(n.day)}`}>
                        Collapse <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <NightAnswers n={n} isNew={unseen?.has(n._id)} />
                  </div>
                </div>
              ) : (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => onToggle(n)}
                  aria-label={`${dayLabel(n.day)}: ${n.techHappy}`}
                  className="l-card flex w-full items-center gap-3.5 py-3 pl-0 pr-4 text-left transition hover:-translate-y-px"
                >
                  <span className="w-[72px] shrink-0 text-center sm:w-[84px]">
                    <b className="text-[17px]">{Number(n.day.slice(8))}</b> <span className="text-[12px] text-l-ink3">{dayLabel(n.day).slice(0, 3)}</span>
                  </span>
                  {n.zone && <BarometerFace zone={n.zone} size={26} />}
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-l-ink2">{n.techHappy}</span>
                  {n.reply && <span className="hidden rounded-full bg-indigo-50 px-2 py-0.5 text-[10.5px] font-bold text-indigo-700 sm:inline dark:bg-indigo-950/50 dark:text-indigo-300">TA replied</span>}
                  <ChevronDown className="h-4 w-4 text-l-ink3" />
                </button>
              )
            )}
          </div>
        );
      })}
      {groups.length > weeksShown && (
        <button type="button" onClick={onMore} className="l-card mt-1.5 self-center rounded-full px-[18px] py-2.5 text-[13px] font-semibold">
          Show earlier weeks
        </button>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="l-card mt-1 max-w-[900px] px-6 py-10 text-center text-[14px] text-l-ink3">{text}</div>;
}

export function CalendarView({
  nights,
  filter,
  month,
  onMonth,
  canPrev,
  canNext,
  today,
  holidays,
  protectedDays,
  course,
  selected,
  onSelect,
  unseen,
}: {
  nights: Night[];
  filter: Filter;
  month: { y: number; m: number };
  onMonth: (delta: number) => void;
  canPrev: boolean;
  canNext: boolean;
  today: string;
  holidays: Set<string>;
  protectedDays?: Set<string>;
  course?: Course;
  selected?: Night;
  onSelect: (n: Night) => void;
  unseen?: Set<string>;
}) {
  const rows = monthGrid(month.y, month.m, nights, today, holidays, protectedDays, course);
  const showLabels = rows.some((r) => r.label);
  const cols = showLabels ? "grid-cols-[34px_repeat(5,minmax(0,1fr))] sm:grid-cols-[44px_repeat(5,minmax(0,1fr))]" : "grid-cols-5";
  const idx = selected ? nights.findIndex((n) => n._id === selected._id) : -1;

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="l-card p-3 sm:p-5">
        <div className="mb-3.5 flex items-center gap-2">
          <button type="button" aria-label="Previous month" disabled={!canPrev} onClick={() => onMonth(-1)} className="grid h-[34px] w-[34px] place-items-center rounded-[10px] ring-1 ring-l-hair disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <b className="px-1.5 text-[16px]">{`${MONTHS[month.m]} ${month.y}`}</b>
          <button type="button" aria-label="Next month" disabled={!canNext} onClick={() => onMonth(1)} className="grid h-[34px] w-[34px] place-items-center rounded-[10px] ring-1 ring-l-hair disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className={`grid ${cols} gap-1.5 text-[12px] text-l-ink3 sm:gap-2`}>
          {showLabels && <span />}
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
            <span key={d} className="px-1">{d}</span>
          ))}
        </div>
        <div className={`mt-2 grid ${cols} gap-1.5 sm:gap-2`}>
          {rows.map((row) => (
            <Row key={row.monday} label={showLabels ? row.label : undefined} days={row.days} filter={filter} selected={selected?._id} onSelect={onSelect} />
          ))}
        </div>
        <div className="mt-3.5 flex flex-wrap gap-3.5 text-[12px] text-l-ink2">
          {(Object.keys(TINT) as ZoneId[]).map((id) => (
            <span key={id} className="inline-flex items-center gap-1.5">
              <i className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: TINT[id].bg, boxShadow: `inset 0 0 0 1px ${zone(id)?.c1}` }} />
              {zone(id)?.a === "Stretch" ? zone(id)?.b.replace(" it", "").replace(/^./, (c) => c.toUpperCase()) : zone(id)?.a}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2 w-2 rounded-full bg-l-indigo" />
            TA replied
          </span>
        </div>
      </div>

      <aside aria-label="Selected night" className="l-card p-[22px]">
        {selected ? (
          <>
            <div className="flex items-center gap-3">
              {selected.zone && <BarometerFace zone={selected.zone} size={48} />}
              <div>
                <b className="text-[16px]">{dayLabel(selected.day)}</b>
                <div className="text-[13px] text-l-ink3">{zoneLabel(selected.zone, selected.barometer)}</div>
              </div>
            </div>
            <NightAnswers n={selected} grid={false} isNew={unseen?.has(selected._id)} />
            <div className="mt-[18px] flex justify-between border-t border-l-hair pt-3.5 text-[13px] font-semibold">
              <button type="button" disabled={idx < 0 || idx >= nights.length - 1} onClick={() => onSelect(nights[idx + 1])} className="text-l-ink2 hover:text-l-ink disabled:opacity-30">
                ‹ Earlier night
              </button>
              <button type="button" disabled={idx <= 0} onClick={() => onSelect(nights[idx - 1])} className="text-l-ink2 hover:text-l-ink disabled:opacity-30">
                Later night ›
              </button>
            </div>
          </>
        ) : (
          <p className="text-[13.5px] text-l-ink3">No reflections this month. Use the arrows to look at another month.</p>
        )}
      </aside>
    </div>
  );
}

function Row({ label, days, filter, selected, onSelect }: { label?: string; days: DayCell[]; filter: Filter; selected?: string; onSelect: (n: Night) => void }) {
  return (
    <>
      {label !== undefined && <span className="pt-3 text-[11.5px] font-semibold text-l-ink3">{label}</span>}
      {days.map((d) => {
        const n = d.night;
        const base = "flex min-h-[64px] flex-col items-start gap-1.5 rounded-2xl p-2 text-left sm:min-h-[108px] sm:p-2.5 sm:px-3";
        const num = <b className={`text-[13px] ${d.inMonth ? "" : "text-l-ink3"}`}>{d.day}</b>;
        if (n && d.inMonth) {
          const t = n.zone ? TINT[n.zone] : undefined;
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => onSelect(n)}
              aria-label={`${d.day} ${SHORT[Number(d.date.slice(5, 7)) - 1]}, ${zoneLabel(n.zone, n.barometer)}${n.reply ? ", TA replied" : ""}`}
              aria-pressed={selected === n._id}
              className={`${base} transition hover:-translate-y-px ${selected === n._id ? "ring-2 ring-l-ink" : ""} ${matchesFilter(n, filter) ? "" : "opacity-35"}`}
              style={{ background: t?.bg ?? "var(--l-sub)", color: "#18181b" }}
            >
              <span className="flex w-full items-center justify-between">
                {num}
                {n.reply && <i className="h-2 w-2 rounded-full bg-l-indigo" />}
              </span>
              {n.zone && <BarometerFace zone={n.zone} size={28} />}
              <span className="hidden text-[11.5px] leading-snug text-zinc-700 sm:line-clamp-2">{n.techHappy}</span>
            </button>
          );
        }
        const ring = d.state === "today" ? "ring-[1.5px] ring-l-ink" : "ring-1 ring-l-hair";
        return (
          <div key={d.date} className={`${base} ${ring} ${d.state === "future" || !d.inMonth ? "bg-l-sub/60" : ""}`}>
            <span className="flex w-full items-center justify-between">
              {num}
              {d.state === "today" && <span className="hidden rounded-full bg-l-ink px-1.5 py-px text-[10px] font-bold text-l-card sm:inline">Today</span>}
            </span>
            {d.inMonth && d.state === "missed" && <span className="mt-auto text-[11.5px] text-l-ink3">Missed</span>}
            {d.inMonth && d.state === "protected" && <span className="mt-auto text-[11.5px] text-l-green">Protected</span>}
            {d.inMonth && d.state === "off" && <span className="mt-auto text-[11.5px] text-l-ink3">Day off</span>}
          </div>
        );
      })}
    </>
  );
}
