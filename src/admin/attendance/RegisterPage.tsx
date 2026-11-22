import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/user-avatar";
import { nicknames } from "@/learner/lib/name";
import { attendanceService } from "@/application/services/attendanceService";
import type { AttendanceStatusType } from "@/domain/types/attendance";
import { adminApi } from "../api";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { useMarkWithUndo } from "../learner/useMarkWithUndo";
import type { RegisterKPIs, RegisterLearner, SessionCell } from "../types";
import { STATUS_LABEL, statusChip } from "../ui/status";
import { LeaveMeter } from "../ui/LeaveMeter";

const GLYPH: Record<string, string> = { present: "✓", late: "L", absent: "A", absent_excused: "E", late_excused: "E", holiday: "–", no_class: "–", "": "" };
const OPTIONS: [string, AttendanceStatusType][] = [
  ["Present", "present"],
  ["Late", "late"],
  ["Excused", "absent_excused"],
  ["Absent", "absent"],
];
const dayLabel = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", timeZone: "Asia/Bangkok" });
const shiftWeek = (w: string, n: number) => {
  const d = new Date(`${w}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n * 7);
  return d.toISOString().slice(0, 10);
};

function Kpi({ label, value, delta, good, sub, warn }: { label: string; value: string; delta?: string; good?: boolean; sub?: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl px-4 py-3.5 shadow-[0_0_0_1px_var(--l-hair)]">
      <small className="text-xs text-l-ink3">{label}</small>
      <b className={`mt-1 block text-2xl font-bold tabular-nums tracking-tight ${warn ? "text-amber-600" : ""}`}>{value}</b>
      {delta && <em className={`not-italic text-[11.5px] ${good ? "text-emerald-600" : "text-amber-600"}`}>{delta}</em>}
      {sub && <em className="not-italic text-[11.5px] text-l-ink3">{sub}</em>}
    </div>
  );
}

function CellChip({ l, cell, date, session }: { l: RegisterLearner; cell: SessionCell; date: string; session: "morning" | "afternoon" }) {
  const [open, setOpen] = useState(false);
  const mark = useMarkWithUndo();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${dayLabel(date)} ${session}: ${STATUS_LABEL[cell.status]}`}
          className={`grid h-6 w-[34px] place-items-center rounded-[7px] text-[10.5px] font-bold transition-transform hover:scale-110 ${statusChip(cell.status)}`}
        >
          {GLYPH[cell.status] ?? ""}
        </button>
      </PopoverTrigger>
      <PopoverContent className="learner w-40 rounded-xl border-0 bg-l-card p-1 text-l-ink shadow-[0_0_0_1px_var(--l-hair),0_12px_30px_-16px_rgba(0,0,0,.35)]">
        <div role="menu" aria-label="Set status">
          {OPTIONS.map(([t, s]) => (
            <button
              key={s}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                mark({ learner: l, cell, session, date, status: s });
              }}
              className="flex w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-l-sub"
            >
              {t}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
function deltas(k: RegisterKPIs, p: RegisterKPIs) {
  const pts = ((k.attendance_rate - p.attendance_rate) * 100).toFixed(1);
  return {
    rate: `${Number(pts) >= 0 ? "+" : ""}${pts} vs last week`,
    rateGood: k.attendance_rate >= p.attendance_rate,
    lates: `${k.lates - p.lates >= 0 ? "+" : ""}${k.lates - p.lates} vs last week`,
    latesGood: k.lates <= p.lates,
  };
}

export function RegisterPage() {
  const [cohort] = useCohort();
  const [week, setWeek] = useState<string | undefined>(undefined);
  const q = useQuery(["admin-register", cohort, week], () => adminApi.register(cohort, week), { keepPreviousData: true });
  const v = q.data;
  useAdminHeader({ title: "Attendance", context: `Register for JSD${cohort}` });
  const d = useMemo(() => (v ? deltas(v.kpis, v.previous) : null), [v]);
  const range = v ? `${new Date(`${v.dates[0]}T12:00:00+07:00`).toLocaleDateString("en-GB", { day: "numeric", timeZone: "Asia/Bangkok" })}–${new Date(`${v.dates[4]}T12:00:00+07:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" })}` : "";
  const exportSF = async () => {
    if (!v) return;
    try {
      const blob = await attendanceService.exportSalesforceCSV(cohort, v.dates[0], v.dates[4]);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `jsd${cohort}-salesforce-${v.week}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-[10px] bg-l-card p-[3px] shadow-[0_0_0_1px_var(--l-hair)]">
          <span className="rounded-[7px] bg-l-ink px-3 py-1 text-xs font-semibold text-l-card">Register</span>
          <Link to="/admin/attendance/calendar" className="rounded-[7px] px-3 py-1 text-xs font-semibold text-l-ink2">
            Calendar
          </Link>
          <Link to="/admin/attendance/logs" className="rounded-[7px] px-3 py-1 text-xs font-semibold text-l-ink2">
            Logs
          </Link>
        </div>
        <span className="flex-1" />
        <button type="button" aria-label="Previous week" onClick={() => v && setWeek(shiftWeek(v.week, -1))} className="grid h-8 w-8 place-items-center rounded-[9px] shadow-[0_0_0_1px_var(--l-hair)]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <b className="text-sm font-semibold">Week of {range}</b>
        <button type="button" aria-label="Next week" onClick={() => v && setWeek(shiftWeek(v.week, 1))} className="grid h-8 w-8 place-items-center rounded-[9px] shadow-[0_0_0_1px_var(--l-hair)]">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={exportSF} className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12.5px] font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
          <Download className="h-3.5 w-3.5" />
          Export for Salesforce
        </button>
      </div>
      {v && d && (
        <>
          <div className="mt-3.5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Attendance this week" value={pct(v.kpis.attendance_rate)} delta={d.rate} good={d.rateGood} />
            <Kpi label="Late check-ins" value={String(v.kpis.lates)} delta={d.lates} good={d.latesGood} />
            <Kpi label="Absences" value={String(v.kpis.absences)} sub={`${v.kpis.excused} excused`} />
            <Kpi label="At 6+ leave days" value={String(v.kpis.at_six_plus)} sub={`${v.kpis.at_seven} at 7`} warn={v.kpis.at_six_plus > 0} />
          </div>
          <div className="mt-3.5 overflow-x-auto rounded-2xl shadow-[0_0_0_1px_var(--l-hair)]">
            <table className="w-full border-separate border-spacing-0 text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] text-l-ink3">
                  <th className="sticky left-0 z-[1] border-b border-l-hair bg-l-card px-3 py-2 font-medium">Learner</th>
                  {v.dates.map((dt) => (
                    <th key={dt} className="border-b border-l-hair px-2 py-2 font-medium">
                      {dayLabel(dt)}
                    </th>
                  ))}
                  <th className="border-b border-l-hair px-2 py-2 font-medium">Week</th>
                  <th className="border-b border-l-hair px-2 py-2 font-medium">Leave</th>
                </tr>
              </thead>
              <tbody>
                {v.learners.map((l) => {
                  const n = nicknames(l.zoom_name, l.first_name);
                  return (
                    <tr key={l.id} className="hover:bg-l-sub">
                      <td className="sticky left-0 z-[1] border-b border-l-hair bg-l-card px-3 py-1.5">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar userId={l.id} name={n.en} avatar={l.avatar} className="h-[30px] w-[30px]" />
                          <div>
                            <b className="whitespace-nowrap font-semibold">{n.th ? `${n.th} · ${n.en}` : n.en}</b>
                            <small className="block text-xs text-l-ink3">
                              #{l.jsd_number} · Group {l.genmate_group || "–"}
                            </small>
                          </div>
                        </div>
                      </td>
                      {v.dates.map((dt, i) =>
                        v.holidays.includes(dt) ? (
                          <td key={dt} className="border-b border-l-hair px-2 py-1.5">
                            <span className="inline-grid h-6 w-[71px] place-items-center rounded-[7px] bg-[repeating-linear-gradient(135deg,var(--l-sub)_0_6px,transparent_6px_12px)] text-[10.5px] font-semibold text-l-ink3">Holiday</span>
                          </td>
                        ) : (
                          <td key={dt} className="border-b border-l-hair px-2 py-1.5">
                            <span className="inline-flex gap-[3px]">
                              <CellChip l={l} cell={l.days[i][0]} date={dt} session="morning" />
                              <CellChip l={l} cell={l.days[i][1]} date={dt} session="afternoon" />
                            </span>
                          </td>
                        )
                      )}
                      <td className="border-b border-l-hair px-2 py-1.5 tabular-nums text-l-ink2">{Math.round(l.week_rate * 100)}%</td>
                      <td className="whitespace-nowrap border-b border-l-hair px-2 py-1.5">
                        <LeaveMeter used={l.leave_used} /> <span className="ml-1 tabular-nums text-l-ink2">{l.leave_used}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-[11.5px] text-l-ink3">Click a cell to change it · every change is logged</p>
        </>
      )}
      {q.isLoading && <div className="mt-4 h-40 animate-pulse rounded-2xl bg-l-sub" />}
    </div>
  );
}
