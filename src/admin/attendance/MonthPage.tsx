import { useMemo, useState } from "react";
import { useQueries, useQuery } from "react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { nicknames } from "@/learner/lib/name";
import { getThailandDateISO } from "@/utils/date-utils";
import { adminApi } from "../api";
import { useAdminHeader, useSidePanel } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import type { RegisterView } from "../types";
import { AttendanceTabs } from "./AttendanceTabs";
import { CellChip } from "./CellChip";
import { attendedRate, dayStats, monthMondays, shiftMonth, type DayStats } from "./month";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const mondayOf = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const longDay = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Bangkok" });
const tone = (r: number) => (r >= 0.9 ? "text-emerald-600 dark:text-emerald-400" : r >= 0.75 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400");

function Bar({ s }: { s: DayStats }) {
  const total = s.present + s.late + s.excused + s.absent + s.unmarked;
  if (!total) return null;
  const seg = (n: number, cls: string) => (n ? <i className={`block h-full ${cls}`} style={{ flex: n }} /> : null);
  return (
    <span className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-l-sub" aria-hidden>
      {seg(s.present, "bg-emerald-400")}
      {seg(s.late, "bg-amber-400")}
      {seg(s.excused, "bg-indigo-400")}
      {seg(s.absent, "bg-red-400")}
    </span>
  );
}

/** The side panel for one day: every learner's morning and afternoon, editable. Reads live data. */
function DayPanel({ cohort, date }: { cohort: number; date: string }) {
  const week = mondayOf(date);
  const { data } = useQuery(["admin-register", cohort, week], () => adminApi.register(cohort, week));
  const i = data?.dates.indexOf(date) ?? -1;
  const s = data ? dayStats([data]).get(date) : undefined;
  const learners = useMemo(() => {
    if (!data || i < 0) return [];
    const weight = (l: RegisterView["learners"][number]) => l.days[i].filter((c) => c.status === "absent" || c.status === "").length;
    return [...data.learners].sort((a, b) => weight(b) - weight(a) || a.jsd_number.localeCompare(b.jsd_number, undefined, { numeric: true }));
  }, [data, i]);
  if (!data || i < 0 || !s) return <div className="h-40 animate-pulse rounded-xl bg-l-sub" />;
  const rate = attendedRate(s);
  return (
    <div>
      <h3 className="pr-10 text-heading font-semibold">{longDay(date)}</h3>
      {s.holiday ? (
        <p className="mt-2 text-body text-l-ink2">Holiday · no class.</p>
      ) : (
        <>
          <p className="mt-1 text-body text-l-ink2">
            {rate === null ? "Nothing marked yet." : `${Math.round(rate * 100)}% attended`} · {s.present} present · {s.late} late · {s.excused} excused · {s.absent} absent
            {s.unmarked > 0 && <span className="text-amber-600"> · {s.unmarked} not marked</span>}
          </p>
          <ul className="mt-3 flex flex-col">
            {learners.map((l) => {
              const n = nicknames(l.zoom_name, l.first_name);
              return (
                <li key={l.id} className="flex items-center gap-2.5 border-b border-l-hair py-2 last:border-0">
                  <UserAvatar userId={l.id} name={n.en} avatar={l.avatar} className="h-7 w-7" />
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-body font-semibold">{n.th ? `${n.th} · ${n.en}` : n.en}</b>
                    <small className="text-micro text-l-ink3">#{l.jsd_number} · Group {l.genmate_group || "–"}</small>
                  </div>
                  <span className="inline-flex gap-[3px]">
                    <CellChip l={l} cell={l.days[i][0]} date={date} session="morning" />
                    <CellChip l={l} cell={l.days[i][1]} date={date} session="afternoon" />
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export function MonthPage() {
  const [cohort] = useCohort();
  const today = getThailandDateISO();
  const [month, setMonth] = useState(today.slice(0, 7));
  const panel = useSidePanel();
  useAdminHeader({ title: "Attendance", context: `Month view for JSD${cohort}` });

  const mondays = useMemo(() => monthMondays(month), [month]);
  const results = useQueries(mondays.map((w) => ({ queryKey: ["admin-register", cohort, w], queryFn: () => adminApi.register(cohort, w), staleTime: 60_000, enabled: cohort > 0 })));
  const loading = results.some((r) => r.isLoading);
  const weeks = results.map((r) => r.data).filter(Boolean) as RegisterView[];
  const stats = useMemo(() => dayStats(weeks), [weeks]);
  const monthDays = [...stats.values()].filter((s) => s.date.startsWith(month) && s.date <= today && !s.holiday);
  const totals = monthDays.reduce((a, s) => ({ attended: a.attended + s.present + s.late, marked: a.marked + s.present + s.late + s.excused + s.absent, unmarked: a.unmarked + s.unmarked }), { attended: 0, marked: 0, unmarked: 0 });
  const label = new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <AttendanceTabs />
        <span className="flex-1" />
        <button type="button" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))} className="grid h-8 w-8 place-items-center rounded-[9px] shadow-[0_0_0_1px_var(--l-hair)]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <b className="min-w-[130px] text-center text-body font-semibold">{label}</b>
        <button type="button" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))} className="grid h-8 w-8 place-items-center rounded-[9px] shadow-[0_0_0_1px_var(--l-hair)]">
          <ChevronRight className="h-4 w-4" />
        </button>
        {month !== today.slice(0, 7) && (
          <button type="button" onClick={() => setMonth(today.slice(0, 7))} className="rounded-[9px] px-2.5 py-1.5 text-small font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
            This month
          </button>
        )}
      </div>

      <p className="mt-3 text-body text-l-ink2">
        {totals.marked ? (
          <>
            <b className="font-semibold text-l-ink">{Math.round((totals.attended / totals.marked) * 100)}%</b> attended in {label} across {monthDays.length} class days
          </>
        ) : loading ? (
          "Loading…"
        ) : (
          `No attendance marked in ${label}.`
        )}
        {totals.unmarked > 0 && <span className="text-amber-600"> · {totals.unmarked} sessions not marked yet</span>}
      </p>

      <div className="mt-3 grid grid-cols-5 gap-2" role="grid" aria-label={`${label} attendance`}>
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-1 text-small font-medium text-l-ink3">
            {d}
          </div>
        ))}
        {mondays.flatMap((w) =>
          [0, 1, 2, 3, 4].map((k) => {
            const d = new Date(`${w}T12:00:00Z`);
            d.setUTCDate(d.getUTCDate() + k);
            const date = d.toISOString().slice(0, 10);
            const inMonth = date.startsWith(month);
            const s = stats.get(date);
            const rate = s ? attendedRate(s) : null;
            const future = date > today;
            const open = panel.openKey === `day-${date}`;
            return (
              <button
                key={date}
                type="button"
                disabled={!inMonth || future || !s}
                onClick={() => panel.open(<DayPanel cohort={cohort} date={date} />, `day-${date}`)}
                aria-label={`${longDay(date)}${rate !== null ? `, ${Math.round(rate * 100)}% attended` : ""}`}
                className={`flex min-h-[92px] flex-col rounded-[14px] p-2.5 text-left transition ${!inMonth ? "opacity-30" : ""} ${
                  s?.holiday ? "bg-[repeating-linear-gradient(135deg,var(--l-sub)_0_6px,transparent_6px_12px)]" : "bg-l-card"
                } ${open ? "shadow-[0_0_0_2px_var(--l-ink)]" : "shadow-[0_0_0_1px_var(--l-hair)]"} enabled:hover:-translate-y-px enabled:hover:shadow-[0_0_0_1px_var(--l-hair),0_8px_20px_-14px_rgba(0,0,0,.4)] disabled:cursor-default`}
              >
                <span className={`self-start text-small font-semibold ${date === today ? "rounded-full bg-l-ink px-1.5 text-l-card" : "text-l-ink2"}`}>{Number(date.slice(8))}</span>
                {s?.holiday ? (
                  <span className="mt-auto text-micro font-semibold text-l-ink3">Holiday</span>
                ) : rate !== null && inMonth ? (
                  <>
                    <span className={`mt-auto text-title font-semibold tabular-nums ${tone(rate)}`}>{Math.round(rate * 100)}%</span>
                    <Bar s={s!} />
                    {s!.unmarked > 0 && <span className="mt-1 text-micro text-amber-600">{s!.unmarked} not marked</span>}
                  </>
                ) : inMonth && !future && s && s.unmarked > 0 ? (
                  <span className="mt-auto text-micro text-l-ink3">Not marked</span>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-l-ink2">
        {[
          ["bg-emerald-400", "Present"],
          ["bg-amber-400", "Late"],
          ["bg-indigo-400", "Excused"],
          ["bg-red-400", "Absent"],
        ].map(([c, t]) => (
          <span key={t} className="inline-flex items-center gap-1">
            <i aria-hidden className={`block h-2.5 w-2.5 rounded-sm ${c}`} />
            {t}
          </span>
        ))}
        <span className="text-l-ink3">· The % counts marked sessions only · click a day to see and change everyone</span>
      </div>
    </div>
  );
}
