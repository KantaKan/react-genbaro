import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { attendanceService } from "@/application/services/attendanceService";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { bkkToday } from "../today/time";
import { cohortApi } from "./api";

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
      <section className="flex flex-wrap items-end gap-3 rounded-2xl p-5 shadow-[0_0_0_1px_var(--l-hair)]">
        {([["From", from, setFrom], ["To", to, setTo]] as const).map(([t, v, set]) => (
          <label key={t} className="flex flex-col gap-1.5 text-xs font-semibold text-l-ink2">
            {t}
            <input aria-label={t} type="date" value={v} onChange={(e) => set(e.target.value)} className="rounded-xl bg-l-sub px-3 py-2 text-body font-normal text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
          </label>
        ))}
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        {card("sf", "Salesforce CSV", "The upload format the Program team uses")}
        {card("att", "Attendance CSV", "One row per learner per day, morning and afternoon")}
      </div>
    </div>
  );
}
