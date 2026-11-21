import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { learnerApi } from "../api";
import { leaveImpact, toLeavePayload, type LeaveKind, type LeavePart } from "../lib/leave";

const REASONS = ["Sickness", "Doctor", "Family", "Job interview", "Internet issues", "Other"];

function Chips<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition duration-200 ${value === v ? "bg-l-ink text-l-card" : "shadow-[0_0_0_1px_var(--l-hair)]"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function RequestLeaveSheet({ open, onOpenChange, defaultDate, used }: { open: boolean; onOpenChange: (o: boolean) => void; defaultDate: string; used: number }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<LeaveKind>("absent");
  const [part, setPart] = useState<LeavePart>("full");
  const [date, setDate] = useState(defaultDate);
  const [reason, setReason] = useState("Sickness");
  const [note, setNote] = useState("");
  const sending = useRef(false);
  useEffect(() => setDate(defaultDate), [defaultDate]);
  useEffect(() => {
    if (kind === "late" && part === "full") setPart("morning");
  }, [kind, part]);

  const m = useMutation(() => learnerApi.requestLeave(toLeavePayload(kind, part, date, reason, note)), {
    onSuccess: () => {
      toast.success("Request sent. A TA will review it soon");
      qc.invalidateQueries(["my-leaves"]);
      onOpenChange(false);
      setNote("");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
    onSettled: () => {
      sending.current = false;
    },
  });
  const send = () => {
    if (sending.current) return;
    sending.current = true;
    m.mutate();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="learner flex w-full flex-col gap-0 border-l-0 bg-l-card p-0 text-l-ink sm:max-w-[420px]">
        <SheetHeader className="p-6 pb-0 text-left">
          <SheetTitle className="text-lg text-l-ink">Request leave</SheetTitle>
          <SheetDescription className="text-l-ink3">A TA reviews it, usually within the same day</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
          <Field label="What happened?">
            <Chips label="What happened?" value={kind} onChange={setKind} options={[["absent", "I'll be absent"], ["late", "I'll be late"]]} />
          </Field>
          <Field label="When?">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl bg-l-card px-3 py-2.5 shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]" />
          </Field>
          <Field label="Which part of the day?">
            <Chips
              label="Which part of the day?"
              value={part}
              onChange={setPart}
              options={kind === "late" ? [["morning", "Morning"], ["afternoon", "Afternoon"]] : [["morning", "Morning"], ["afternoon", "Afternoon"], ["full", "Full day"]]}
            />
          </Field>
          <Field label="Reason">
            <Chips label="Reason" value={reason} onChange={setReason} options={REASONS.map((r) => [r, r] as [string, string])} />
          </Field>
          <Field label="Note for the TA (optional)">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything they should know…" className="h-[84px] w-full resize-none rounded-xl bg-l-card px-3 py-2.5 shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]" />
          </Field>
          <p className="rounded-[14px] bg-amber-50 px-3.5 py-3 text-[13px] leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">{leaveImpact(kind, part, used)}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-l-hair p-4">
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-full px-4 py-2 text-[13.5px] font-medium shadow-[0_0_0_1px_var(--l-hair)]">
            Cancel
          </button>
          <button type="button" onClick={send} disabled={m.isLoading} className="rounded-full bg-l-ink px-4 py-2 text-[13.5px] font-medium text-l-card disabled:opacity-60">
            Send request
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[12.5px] font-semibold text-l-ink2">{label}</div>
      {children}
    </div>
  );
}
