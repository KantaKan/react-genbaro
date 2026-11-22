import { useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BulkRegisterDialog } from "@/components/bulk-register-dialog";
import { cohortApi } from "./api";

const field = "w-full rounded-xl bg-l-sub px-3 py-2 text-[13.5px] text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]";

/** Create a cohort (default check-in rules), optionally import learners, then switch to it. */
export function NewCohortWizard({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; onDone: (cohort: number) => void }) {
  const [n, setN] = useState("");
  const [start, setStart] = useState("");
  const [days, setDays] = useState("75");
  const [created, setCreated] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const busy = useRef(false);
  const num = Number(n);
  const valid = num > 0 && !!start && Number(days) > 0;
  const create = async () => {
    if (busy.current || !valid) return;
    busy.current = true;
    try {
      await cohortApi.create({ cohort_number: num, start_date: start, course_days: Number(days) });
      setCreated(num);
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Couldn't create the cohort");
    } finally {
      busy.current = false;
    }
  };
  const close = (o: boolean) => {
    if (!o) {
      setCreated(null);
      setImported(false);
    }
    onOpenChange(o);
  };
  return (
    <>
      <Dialog open={open && !importing} onOpenChange={close}>
        <DialogContent className="learner max-w-[480px] rounded-[22px] border-0 bg-l-card text-l-ink">
          <DialogTitle>{created ? `JSD${created} is ready` : "New cohort"}</DialogTitle>
          {!created ? (
            <div className="grid gap-3">
              <label className="text-xs font-semibold text-l-ink2">
                Cohort number
                <input aria-label="Cohort number" type="number" min={1} value={n} onChange={(e) => setN(e.target.value)} className={`${field} mt-1.5`} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-l-ink2">
                  Start date
                  <input aria-label="Start date" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={`${field} mt-1.5`} />
                </label>
                <label className="text-xs font-semibold text-l-ink2">
                  Class days
                  <input aria-label="Class days" type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} className={`${field} mt-1.5`} />
                </label>
              </div>
              <p className="text-xs text-l-ink3">Check-in starts with the usual times (9:15 late, 10:30 absent; 13:15 / 14:30). You can change them in Check-in rules.</p>
              <button type="button" disabled={!valid} onClick={create} className="mt-1 rounded-full bg-l-ink py-2.5 text-[13.5px] font-semibold text-l-card disabled:opacity-40">
                {num > 0 ? `Create JSD${num}` : "Create cohort"}
              </button>
            </div>
          ) : (
            <div className="grid gap-2.5">
              <p className="flex items-center gap-2 text-[13px] text-l-ink2">
                <Check className="h-4 w-4 text-emerald-600" /> Cohort created with default check-in rules.
              </p>
              <button type="button" aria-label="Import learners from CSV" onClick={() => setImporting(true)} className="flex items-center gap-3 rounded-2xl p-3.5 text-left shadow-[0_0_0_1px_var(--l-hair)] hover:bg-l-sub">
                <Upload className="h-4 w-4" />
                <span>
                  <b className="block text-[13.5px] font-semibold">Import learners from CSV</b>
                  <small className="text-xs text-l-ink3">{imported ? "Imported. You can import more." : "first_name, last_name, email, jsd_number, project_group, genmate_group, zoom_name"}</small>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onDone(created);
                  close(false);
                }}
                className="mt-1 rounded-full bg-l-ink py-2.5 text-[13.5px] font-semibold text-l-card"
              >
                Go to JSD{created}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {created && (
        <BulkRegisterDialog
          isOpen={importing}
          defaultCohort={created}
          onClose={() => setImporting(false)}
          onSuccess={() => setImported(true)}
        />
      )}
    </>
  );
}
