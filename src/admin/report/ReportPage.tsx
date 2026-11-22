import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { nicknames } from "@/learner/lib/name";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { useConfirm } from "../ui/Confirm";
import { ZONE_BG } from "../ui/zones";
import { useStaff } from "../team/useStaff";
import { bkkToday } from "../today/time";
import { reportApi, type KPI, type Report, type Tally } from "./api";
import { mondayOf, shiftWeek, weekLabel } from "./week";

const card = "rounded-2xl p-5 shadow-[0_0_0_1px_var(--l-hair)] print:break-inside-avoid";
const pct = (v: number) => Math.round(v * 100);
const errMsg = (e: unknown) => (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Something went wrong";
const DAY = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "short", timeZone: "Asia/Bangkok" });

function Sparkline({ values, good }: { values: number[]; good: boolean }) {
  const lo = Math.min(...values), hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${26 - ((v - lo) / span) * 22 - 2}`).join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={good ? "#16a34a" : "#a1a1aa"} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Kpi({ label, k, text, delta, lowerIsBetter }: { label: string; k: KPI; text: string; delta: string; lowerIsBetter?: boolean }) {
  const diff = k.value - k.prev;
  const good = diff === 0 ? false : lowerIsBetter ? diff < 0 : diff > 0;
  return (
    <div className={card}>
      <div className="text-xs font-medium text-l-ink3">{label}</div>
      <b aria-label={`${label}: ${text}`} className="mt-1 block text-[28px] font-semibold leading-none tracking-tight tabular-nums">
        {text}
      </b>
      <div className={`mt-1.5 text-xs font-medium ${diff === 0 ? "text-l-ink3" : good ? "text-emerald-600" : "text-red-600"}`}>{delta}</div>
      <div className="mt-2.5">
        <Sparkline values={k.trend} good={good} />
        <div className="mt-0.5 text-[10.5px] text-l-ink3">Last 8 weeks</div>
      </div>
    </div>
  );
}

const pts = (a: number, b: number) => {
  const d = pct(a) - pct(b);
  return d === 0 ? "same as last week" : `${d > 0 ? "+" : "−"}${Math.abs(d)} pts vs last week`;
};

const ATT_COLORS: [keyof Tally, string, string][] = [
  ["on_time", "#10b981", "on time"],
  ["late", "#fbbf24", "late"],
  ["leave", "#38bdf8", "on leave"],
  ["absent", "#f87171", "absent"],
  ["not_yet", "var(--l-sub)", "no record"],
];

function Stack({ parts, label }: { parts: { n: number; color: string }[]; label: string }) {
  const total = parts.reduce((s, p) => s + p.n, 0) || 1;
  return (
    <div role="img" aria-label={label} className="flex h-24 w-5 flex-col-reverse overflow-hidden rounded-md bg-l-sub">
      {parts.filter((p) => p.n > 0).map((p, i) => (
        <div key={i} style={{ height: `${(p.n / total) * 100}%`, background: p.color }} />
      ))}
    </div>
  );
}

function Section({ title, hint, children, label }: { title: string; hint?: string; children: ReactNode; label?: string }) {
  return (
    <section aria-label={label} className={card}>
      <div className="mb-3 flex items-baseline gap-2">
        <h4 className="text-[13px] font-semibold">{title}</h4>
        {hint && <small className="text-xs text-l-ink3">{hint}</small>}
      </div>
      {children}
    </section>
  );
}

export function ReportPage() {
  const [cohort] = useCohort();
  const qc = useQueryClient();
  const me = useStaff();
  const confirm = useConfirm();
  const thisWeek = mondayOf(bkkToday());
  const [week, setWeek] = useState(thisWeek);
  const q = useQuery(["admin-report", cohort, week], () => reportApi.get(cohort, week), { keepPreviousData: true });
  const r: Report | undefined = q.data;
  const sent = r?.status === "sent";
  const [notes, setNotes] = useState("");
  const busy = useRef({ save: false, send: false });
  useEffect(() => setNotes(r?.notes ?? ""), [r?.week, r?.notes, r?.status]);

  const send = () =>
    confirm.ask(
      sent ? "Post this report to Slack again?" : `Send the JSD${cohort} report for ${weekLabel(week)} to Slack?`,
      async () => {
        if (busy.current.send) return;
        busy.current.send = true;
        try {
          const res = await reportApi.send(cohort, week);
          if (res.slack_error) toast.error(`Saved as sent, but Slack failed: ${res.slack_error}`);
          else if (res.sent_to_slack) toast.success("Report sent to Slack");
          else toast.success("Report saved as sent (Slack isn't set up for reports yet)");
          qc.invalidateQueries(["admin-report"]);
        } catch (e) {
          toast.error(errMsg(e));
        } finally {
          busy.current.send = false;
        }
      },
      sent ? "The saved report is posted again. Its numbers don't change." : "The numbers are frozen and the team notes lock once it's sent."
    );

  const saveNotes = async () => {
    if (busy.current.save) return;
    busy.current.save = true;
    try {
      await reportApi.saveNotes(cohort, week, notes);
      toast.success("Notes saved");
      qc.invalidateQueries(["admin-report"]);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      busy.current.save = false;
    }
  };

  useAdminHeader({
    title: "Weekly report",
    context: `JSD${cohort} · ${weekLabel(week)}`,
    actions: (
      <div className="flex items-center gap-2 print:hidden">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold shadow-[0_0_0_1px_var(--l-hair)] hover:bg-l-sub">
          <Printer className="h-3.5 w-3.5" /> Print / PDF
        </button>
        {me.can("cohort_admin") && r && (
          <button type="button" onClick={send} className="rounded-full bg-l-ink px-3.5 py-1.5 text-[12.5px] font-semibold text-l-card">
            {sent ? "Send again" : "Send now"}
          </button>
        )}
      </div>
    ),
  });

  const nav = (
    <div className="flex items-center gap-2 print:hidden">
      <button type="button" aria-label="Previous week" onClick={() => setWeek(shiftWeek(week, -1))} className="grid h-8 w-8 place-items-center rounded-[9px] shadow-[0_0_0_1px_var(--l-hair)]">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <b className="text-sm font-semibold">Week of {weekLabel(week)}</b>
      <button type="button" aria-label="Next week" disabled={week >= thisWeek} onClick={() => setWeek(shiftWeek(week, 1))} className="grid h-8 w-8 place-items-center rounded-[9px] shadow-[0_0_0_1px_var(--l-hair)] disabled:opacity-40">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  if (!r) return <div>{nav}<div className="mt-3 h-48 animate-pulse rounded-2xl bg-l-sub" /></div>;

  const k = r.kpis;
  const people = (st: "new" | "still" | "better", label: string) => {
    const rows = r.support.filter((s) => s.status === st);
    if (rows.length === 0) return null;
    return (
      <div className="mb-3 last:mb-0">
        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-l-ink2">
          {label}
          <span className="rounded-full bg-l-sub px-1.5 text-[11px] text-l-ink3">{rows.length}</span>
        </div>
        <ul className="grid gap-1 sm:grid-cols-2">
          {rows.map((s) => {
            const n = nicknames(s.learner.zoom_name, s.learner.first_name);
            return (
              <li key={s.learner.id} className="rounded-lg bg-l-sub px-2.5 py-1.5 text-[12.5px]">
                <Link to={`/admin/learners/${s.learner.id}`} className="font-semibold hover:underline">
                  {n.th || n.en}
                </Link>
                {s.reasons.length > 0 && <span className="ml-2 text-l-ink3">{s.reasons.join(" · ")}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex max-w-[980px] flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-3">
        {nav}
        <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold shadow-[0_0_0_1px_var(--l-hair)] ${sent ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-l-sub text-l-ink2"}`}>
          {sent ? `Sent ${r.sent_at ? new Date(r.sent_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" }) : ""}`.trim() : "Draft · sends Fri 17:00"}
        </span>
      </div>

      <p className="rounded-2xl bg-l-sub px-5 py-4 text-[14px] leading-relaxed">{r.summary}</p>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Attendance" k={k.attendance} text={`${pct(k.attendance.value)}%`} delta={pts(k.attendance.value, k.attendance.prev)} />
        <Kpi label="Late check-ins" k={k.lates} text={String(k.lates.value)} delta={k.lates.value === k.lates.prev ? "same as last week" : `${k.lates.value > k.lates.prev ? "+" : "−"}${Math.abs(k.lates.value - k.lates.prev)} vs last week`} lowerIsBetter />
        <Kpi label="Reflections sent" k={k.reflections} text={`${pct(k.reflections.value)}%`} delta={pts(k.reflections.value, k.reflections.prev)} />
        <Kpi label="Overwhelmed or panic" k={k.rough} text={`${pct(k.rough.value)}%`} delta={pts(k.rough.value, k.rough.prev)} lowerIsBetter />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <Section title="How the cohort felt" hint="Reflections by night">
          <div className="flex items-end justify-between gap-2">
            {r.mood.map((m) => {
              const parts = [
                { n: m.comfort, color: ZONE_BG.comfort },
                { n: m.enjoying, color: ZONE_BG["stretch-enjoying"] },
                { n: m.overwhelmed, color: ZONE_BG["stretch-overwhelmed"] },
                { n: m.panic, color: ZONE_BG.panic },
                { n: m.none, color: "var(--l-sub)" },
              ];
              const label = m.holiday ? `${DAY(m.day)}: holiday` : `${DAY(m.day)}: ${m.comfort} comfort, ${m.enjoying} enjoying, ${m.overwhelmed} overwhelmed, ${m.panic} panic, ${m.none} not written`;
              return (
                <div key={m.day} className="flex flex-1 flex-col items-center gap-1.5">
                  {m.holiday ? <div role="img" aria-label={label} className="grid h-24 w-5 place-items-center text-[10px] text-l-ink3">–</div> : <Stack parts={parts} label={label} />}
                  <span className="text-[11px] text-l-ink3">{DAY(m.day)}</span>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Attendance by day" hint="Morning and afternoon">
          <div className="flex items-end justify-between gap-2">
            {r.by_day.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                {d.holiday ? (
                  <div className="grid h-24 place-items-center text-[10px] text-l-ink3">holiday</div>
                ) : (
                  <div className="flex gap-1">
                    {([["AM", d.am], ["PM", d.pm]] as const).map(([s, t]) => (
                      <Stack key={s} label={`${DAY(d.day)} ${s}: ${ATT_COLORS.filter(([key]) => t[key] > 0).map(([key, , name]) => `${t[key]} ${name}`).join(", ")}`} parts={ATT_COLORS.map(([key, color]) => ({ n: t[key], color }))} />
                    ))}
                  </div>
                )}
                <span className="text-[11px] text-l-ink3">{DAY(d.day)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-l-ink3">
            {ATT_COLORS.map(([, color, name]) => (
              <span key={name} className="inline-flex items-center gap-1">
                <i className="h-2 w-2 rounded-sm" style={{ background: color }} />
                {name}
              </span>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Needs support" hint="New, still and better since last week's report" label="Needs support">
        {r.support.length === 0 ? (
          <p className="text-[13px] text-l-ink3">Nobody needs support this week.</p>
        ) : (
          <>
            {people("new", "New")}
            {people("still", "Still")}
            {people("better", "Better")}
          </>
        )}
      </Section>

      <Section title="Groups" label="Groups">
        {r.groups.length === 0 ? (
          <p className="text-[13px] text-l-ink3">No GenMate groups yet.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] text-l-ink3">
                <th className="py-1.5 font-medium">Group</th>
                <th className="py-1.5 font-medium">Attendance</th>
                <th className="py-1.5 font-medium">Overwhelmed or panic</th>
                <th className="py-1.5 text-right font-medium">Cup points</th>
              </tr>
            </thead>
            <tbody>
              {r.groups.map((g) => (
                <tr key={g.group} className="border-t border-l-hair">
                  <td className="py-2 font-semibold">{g.group}</td>
                  <td className="py-2 tabular-nums">{pct(g.attendance)}%</td>
                  <td className="py-2 tabular-nums">{pct(g.rough)}%</td>
                  <td className="py-2 text-right tabular-nums">{g.cup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Notes from the team" hint={sent ? "Locked: the report was sent" : "Included as written"}>
        {!sent && me.can("report_notes") ? (
          <>
            <textarea aria-label="Notes from the team" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={4000} placeholder="What should the Program team know about this week?" className="w-full resize-none rounded-xl bg-l-sub px-3 py-2.5 text-[13.5px] shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]" />
            <div className="mt-2 flex justify-end print:hidden">
              <button type="button" onClick={saveNotes} className="rounded-full bg-l-ink px-4 py-1.5 text-[12.5px] font-semibold text-l-card">
                Save notes
              </button>
            </div>
          </>
        ) : (
          <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">{r.notes || <span className="text-l-ink3">No notes this week.</span>}</p>
        )}
      </Section>
      {confirm.node}
    </div>
  );
}
