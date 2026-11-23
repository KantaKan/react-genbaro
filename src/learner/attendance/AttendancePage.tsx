import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useUserData } from "@/UserDataContext";
import type { AttendanceStatusType, LeaveRequest } from "@/domain/types";
import { learnerApi } from "../api";
import { usePageHeader } from "../shell/LearnerShell";
import { bangkokNow } from "../lib/time";
import { monthGrid, type Cell, type CellStatus } from "../lib/calendar";
import { MonthCalendar } from "./MonthCalendar";
import { RateRing } from "./RateRing";
import { RequestLeaveSheet } from "./RequestLeaveSheet";

const LABEL: Record<string, string> = {
  present: "Present", late: "Late", absent: "Absent", absent_excused: "Absent · Excused", late_excused: "Late · Excused",
  no_class: "No class", holiday: "Holiday", none: "No class", dropout: "Dropout", dismissed: "Dismissed",
};
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function AttendancePage() {
  const { userData } = useUserData();
  const [params, setParams] = useSearchParams();
  const today = bangkokNow().date;
  const [ym, setYm] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [sel, setSel] = useState<Cell | null>(null);
  const [leaveDate, setLeaveDate] = useState(today);
  const summary = useQuery(["my-summary"], learnerApi.getSummary);
  const history = useQuery(["my-history", 120], () => learnerApi.getHistory(120));
  const leaves = useQuery(["my-leaves"], learnerApi.getMyLeaves);
  const s = summary.data;

  const sheetOpen = params.get("leave") === "1";
  const openSheet = (date = today) => {
    setLeaveDate(date);
    setParams((p) => {
      p.set("leave", "1");
      return p;
    });
  };
  const closeSheet = () =>
    setParams((p) => {
      p.delete("leave");
      return p;
    });

  const actions = useMemo(
    () => (
      <button type="button" onClick={() => openSheet()} aria-label="Request leave" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-l-ink px-3.5 py-1.5 text-body font-medium text-l-card">
        <Plus className="h-4 w-4" strokeWidth={1.75} />
        <span className="sm:hidden">Leave</span>
        <span className="hidden sm:inline">Request leave</span>
      </button>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  usePageHeader({
    title: "My attendance",
    context: s && s.course.week_number > 0 ? `JSD${userData?.cohort_number ?? ""} · Week ${s.course.week_number} of ${s.course.total_weeks}` : `JSD${userData?.cohort_number ?? ""}`,
    actions,
  });

  const cells = monthGrid(ym.y, ym.m, history.data ?? [], today);
  const shift = (d: number) => setYm(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }));
  const time = (status: CellStatus, session: "morning" | "afternoon") => {
    const r = history.data?.find((x) => x.date === sel?.date && x.session === session);
    if (!r || r.marked_by !== "self") return "";
    const mins = bangkokNow(new Date(r.submitted_at)).minutes;
    return status ? ` · checked in ${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}` : "";
  };
  const counts = (history.data ?? []).reduce<Record<string, number>>((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <section className="l-card p-[22px] lg:col-span-8">
        <MonthCalendar title={`${MONTHS[ym.m]} ${ym.y}`} cells={cells} selected={sel?.date ?? null} onSelect={setSel} onPrev={() => shift(-1)} onNext={() => shift(1)} />
        <div data-testid="day-detail" className="mt-3.5 min-h-[84px] rounded-[14px] bg-l-sub p-3.5 text-body leading-relaxed text-l-ink2">
          {!sel ? (
            "Pick a day to see its check-ins and any notes."
          ) : sel.future ? (
            <div className="flex flex-wrap items-center gap-3">
              <span>
                <b className="text-l-ink">{MONTHS[ym.m]} {sel.day}</b> is coming up.
              </span>
              <button type="button" onClick={() => openSheet(sel.date!)} className="rounded-full bg-l-ink px-3 py-1 text-small font-medium text-l-card">
                Request leave
              </button>
            </div>
          ) : (
            <>
              <b className="text-l-ink">{MONTHS[ym.m]} {sel.day}</b>
              <br />
              {`Morning: ${sel.am ? LABEL[sel.am] ?? sel.am : "Not recorded yet"}${time(sel.am, "morning")}`}
              <br />
              {`Afternoon: ${sel.pm ? LABEL[sel.pm] ?? sel.pm : "Not recorded yet"}${time(sel.pm, "afternoon")}`}
            </>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-4 lg:col-span-4">
        <section className="l-card p-[22px]">
          <h3 className="text-title font-semibold">Attendance rate</h3>
          <div className="mt-3.5 flex items-center gap-5">
            <RateRing rate={s?.attendance_rate ?? 0} />
            <div className="flex-1 text-body text-l-ink2">
              {(["present", "late", "absent_excused", "absent"] as AttendanceStatusType[]).map((k, i) => (
                <div key={k} className={`flex justify-between py-2 ${i ? "border-t border-l-hair" : ""}`}>
                  <span>{LABEL[k]}</span>
                  <b className="font-semibold tabular-nums text-l-ink">{counts[k] ?? 0}</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="l-card p-[22px]">
          <h3 className="text-title font-semibold">Leave &amp; lates</h3>
          <p className="mt-0.5 text-small text-l-ink3">Up to {s?.leave_allowance ?? 8} days across the whole course</p>
          <div className="mt-3.5 flex items-baseline gap-1.5">
            <b className="text-4xl font-semibold tabular-nums tracking-tighter">{s?.leave_used ?? 0}</b>
            <span className="text-l-ink3">
              of {s?.leave_allowance ?? 8} used · {Math.max(0, (s?.leave_allowance ?? 8) - (s?.leave_used ?? 0))} left
            </span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: s?.leave_allowance ?? 8 }, (_, i) => (
              <i key={i} className="block h-3 flex-1 rounded" style={{ background: i < (s?.leave_used ?? 0) ? "var(--l-indigo)" : "var(--l-sub)" }} />
            ))}
          </div>
          <div className="relative mt-1.5 h-8 text-micro text-l-ink3">
            {[[4, "1st warning"], [6, "2nd"], [7, "3rd"]].map(([n, l]) => (
              <span key={l} className="absolute -translate-x-1/2 text-center leading-tight" style={{ left: `${((n as number) / (s?.leave_allowance ?? 8)) * 100}%` }}>
                {l}
                <br />
                {n} days
              </span>
            ))}
          </div>
        </section>

        <section className="l-card p-[22px]">
          <h3 className="text-title font-semibold">My requests</h3>
          <div className="mt-2.5">
            {(leaves.data ?? []).length === 0 && <p className="text-body text-l-ink3">No requests yet.</p>}
            {(leaves.data ?? [])
              .slice()
              .sort((a, b) => (b.date > a.date ? 1 : -1))
              .slice(0, 5)
              .map((l) => (
                <RequestRow key={l._id} l={l} />
              ))}
          </div>
        </section>
      </div>

      <RequestLeaveSheet open={sheetOpen} onOpenChange={(o) => (o ? openSheet(leaveDate) : closeSheet())} defaultDate={leaveDate} used={s?.leave_used ?? 0} />
    </div>
  );
}

function RequestRow({ l }: { l: LeaveRequest }) {
  const d = new Date(`${l.date}T12:00:00Z`);
  const tone = l.status === "approved" ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300" : l.status === "rejected" ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  const what = l.type === "full_day" ? "Full day · Absent" : l.type === "half_day" ? `${l.session === "afternoon" ? "Afternoon" : "Morning"} · Absent` : `${l.session === "afternoon" ? "Afternoon" : "Morning"} · Late`;
  return (
    <div className="flex items-center gap-3 border-t border-l-hair py-3 first:border-t-0">
      <div className="w-[46px] shrink-0 rounded-[10px] bg-l-sub py-1 text-center shadow-[0_0_0_1px_var(--l-hair)]">
        <small className="block text-micro uppercase tracking-wider text-l-ink3">{d.toLocaleDateString("en-GB", { weekday: "short" })}</small>
        <b className="text-title font-semibold">{d.getUTCDate()}</b>
      </div>
      <div className="min-w-0 flex-1">
        <b className="block truncate font-semibold">{l.reason}</b>
        <span className="text-xs text-l-ink3">{what}</span>
      </div>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>{l.status}</span>
    </div>
  );
}
