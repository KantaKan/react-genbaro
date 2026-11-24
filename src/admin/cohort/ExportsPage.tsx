import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { attendanceService } from "@/application/services/attendanceService";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { bkkToday } from "../today/time";
import { cohortApi } from "./api";
import { courseWeeks, fmt } from "./weeks";

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); // Safari/Firefox need the URL a moment longer
}

export function ExportsPage() {
  const [cohort] = useCohort();
  const settings = useQuery(["admin-settings", cohort], () => cohortApi.settings(cohort));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(bkkToday());
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    if (!from && settings.data?.start_date) setFrom(settings.data.start_date);
  }, [settings.data, from]);
  useAdminHeader({ title: "Exports", context: `JSD${cohort}` });
  const today = bkkToday();
  const start = settings.data?.start_date ?? "";
  const end = settings.data?.graduated_on && settings.data.graduated_on < today ? settings.data.graduated_on : today;
  const weeks = courseWeeks(start, end);
  const pick = (f: string, t: string) => (setFrom(f), setTo(t));
  const picked = weeks.find((w) => w.from === from && w.to === to);
  const run = async (kind: "sf" | "att") => {
    if (busy || !from || !to) return;
    setBusy(kind);
    try {
      if (kind === "sf") save(await attendanceService.exportSalesforceCSV(cohort, from, to), `jsd${cohort}-salesforce-${from}-${to}.csv`);
      else save(await attendanceService.exportAttendance(cohort, from, to, "csv", "daily", true), `jsd${cohort}-attendance-${from}-${to}.csv`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };
  const card = (kind: "sf" | "att", title: string, sub: string) => (
    <button type="button" onClick={() => run(kind)} disabled={!!busy} className="flex items-center gap-3.5 rounded-2xl p-4 text-left shadow-[0_0_0_1px_var(--l-hair)] transition hover:bg-l-sub disabled:opacity-60">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-l-sub shadow-[0_0_0_1px_var(--l-hair)]">
        <Download className="h-4 w-4" />
      </span>
      <span>
        <b className="block text-body font-semibold">{busy === kind ? "Preparing…" : title}</b>
        <small className="text-xs text-l-ink3">{sub}</small>
      </span>
    </button>
  );
  return (
    <div className="flex max-w-[760px] flex-col gap-3.5">
      <section className="rounded-2xl p-5 shadow-[0_0_0_1px_var(--l-hair)]">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-l-ink2">
            Week
            <select
              aria-label="Pick a week"
              value={picked ? picked.from : ""}
              onChange={(e) => {
                const w = weeks.find((x) => x.from === e.target.value);
                if (w) pick(w.from, w.to);
              }}
              className="rounded-xl bg-l-sub px-3 py-2 text-body font-normal text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none"
            >
              <option value="">{weeks.length ? "Choose a week…" : "Set the course start date first"}</option>
              {weeks.map((w) => (
                <option key={w.from} value={w.from}>
                  Week {w.n} · {fmt(w.from)} – {fmt(w.to)}
                </option>
              ))}
            </select>
          </label>
          {weeks[0] && (
            <button type="button" onClick={() => pick(weeks[0].from, weeks[0].to)} className="rounded-full px-2.5 py-1 text-small font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)] hover:text-l-ink">
              Latest week
            </button>
          )}
          {weeks[1] && (
            <button type="button" onClick={() => pick(weeks[1].from, weeks[1].to)} className="rounded-full px-2.5 py-1 text-small font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)] hover:text-l-ink">
              Week before
            </button>
          )}
          {start && (
            <button type="button" onClick={() => pick(start, end)} className="rounded-full px-2.5 py-1 text-small font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)] hover:text-l-ink">
              Whole course
            </button>
          )}
        </div>
        <p className="mt-2 text-small text-l-ink3">{from && to ? `Exports ${fmt(from)} – ${fmt(to)}${picked ? ` (Week ${picked.n})` : ""}.` : ""} Or set exact dates below.</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        {([["From", from, setFrom], ["To", to, setTo]] as const).map(([t, v, set]) => (
          <label key={t} className="flex flex-col gap-1.5 text-xs font-semibold text-l-ink2">
            {t}
            <input aria-label={t} type="date" value={v} onChange={(e) => set(e.target.value)} className="rounded-xl bg-l-sub px-3 py-2 text-body font-normal text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
          </label>
        ))}
      </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        {card("sf", "Salesforce CSV", "The upload format the Program team uses")}
        {card("att", "Attendance CSV", "One row per learner per day, morning and afternoon")}
      </div>
    </div>
  );
}
