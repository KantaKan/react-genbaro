import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { nicknames } from "@/learner/lib/name";
import { attendanceService } from "@/application/services/attendanceService";
import { adminApi } from "../api";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import type { RegisterKPIs } from "../types";
import { CellChip } from "./CellChip";
import { AttendanceTabs } from "./AttendanceTabs";
import { matchLearner, sortLearners, type SortKey } from "./sortLearners";
import { LeaveMeter } from "../ui/LeaveMeter";


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
      {delta && <em className={`not-italic text-small ${good ? "text-emerald-600" : "text-amber-600"}`}>{delta}</em>}
      {sub && <em className="not-italic text-small text-l-ink3">{sub}</em>}
    </div>
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
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const q = useQuery(["admin-register", cohort, week], () => adminApi.register(cohort, week), { keepPreviousData: true });
  const v = q.data;
  useAdminHeader({ title: "Attendance", context: `Register for JSD${cohort}` });
  const d = useMemo(() => (v ? deltas(v.kpis, v.previous) : null), [v]);
  const groups = useMemo(() => [...new Set((v?.learners ?? []).map((l) => l.genmate_group).filter(Boolean))].sort(), [v]);
  const rows = useMemo(
    () => sortLearners((v?.learners ?? []).filter((l) => (!group || l.genmate_group === group) && matchLearner(l, search)), sort.key, sort.dir),
    [v, group, search, sort]
  );
  // First click shows who needs attention: lowest week % first, most leave first.
  const firstDir = (key: SortKey): "asc" | "desc" => (key === "leave" ? "desc" : "asc");
  const sortBy = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === "asc" ? "desc" : "asc") : firstDir(key) }));
  const head = (key: SortKey, label: string) => (
    <button type="button" onClick={() => sortBy(key)} aria-label={`Sort by ${label}`} className={`inline-flex items-center gap-1 font-medium hover:text-l-ink ${sort.key === key ? "text-l-ink" : ""}`}>
      {label}
      <span aria-hidden className="text-micro">{sort.key === key ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}</span>
    </button>
  );
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
        <AttendanceTabs />
        <span className="flex-1" />
        <button type="button" aria-label="Previous week" onClick={() => v && setWeek(shiftWeek(v.week, -1))} className="grid h-8 w-8 place-items-center rounded-[9px] shadow-[0_0_0_1px_var(--l-hair)]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <b className="text-sm font-semibold">Week of {range}</b>
        <button type="button" aria-label="Next week" onClick={() => v && setWeek(shiftWeek(v.week, 1))} className="grid h-8 w-8 place-items-center rounded-[9px] shadow-[0_0_0_1px_var(--l-hair)]">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={exportSF} className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-small font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
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
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <input
              type="search"
              aria-label="Find a learner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a learner or number…"
              className="w-56 rounded-[10px] bg-l-card px-3 py-1.5 text-body shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]"
            />
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by group">
              {["", ...groups].map((g) => (
                <button key={g || "all"} type="button" aria-pressed={group === g} onClick={() => setGroup(g)} className={`rounded-full px-2.5 py-1 text-small font-semibold ${group === g ? "bg-l-ink text-l-card" : "text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)] hover:text-l-ink"}`}>
                  {g ? `Group ${g}` : "All"}
                </button>
              ))}
            </div>
            <span className="ml-auto text-small text-l-ink3">{rows.length} of {v.learners.length}</span>
          </div>
          <div className="mt-2.5 overflow-x-auto rounded-2xl shadow-[0_0_0_1px_var(--l-hair)]">
            <table className="w-full border-separate border-spacing-0 text-body">
              <thead>
                <tr className="text-left text-small text-l-ink3">
                  <th className="sticky left-0 z-[1] border-b border-l-hair bg-l-card px-3 py-2 font-medium">
                    {head("name", "Learner")} <span className="ml-2">{head("group", "Group")}</span>
                  </th>
                  {v.dates.map((dt) => (
                    <th key={dt} className="border-b border-l-hair px-2 py-2 font-medium">
                      {dayLabel(dt)}
                    </th>
                  ))}
                  <th className="border-b border-l-hair px-2 py-2 font-medium">{head("week", "Week")}</th>
                  <th className="border-b border-l-hair px-2 py-2 font-medium">{head("leave", "Leave")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => {
                  const n = nicknames(l.zoom_name, l.first_name);
                  return (
                    <tr key={l.id} className="group hover:bg-l-sub">
                      <td className="sticky left-0 z-[1] border-b border-l-hair bg-l-card px-3 py-1.5 group-hover:bg-l-sub">
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
                            <span className="inline-grid h-6 w-[71px] place-items-center rounded-[7px] bg-[repeating-linear-gradient(135deg,var(--l-sub)_0_6px,transparent_6px_12px)] text-micro font-semibold text-l-ink3">Holiday</span>
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
          {rows.length === 0 && <p className="mt-3 text-center text-body text-l-ink3">No one matches.</p>}
          <p className="mt-2.5 text-small text-l-ink3">Click a cell to change it · every change is logged</p>
        </>
      )}
      {q.isLoading && <div className="mt-4 h-40 animate-pulse rounded-2xl bg-l-sub" />}
    </div>
  );
}
