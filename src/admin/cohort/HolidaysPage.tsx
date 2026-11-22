import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { leaveService } from "@/application/services/leaveService";
import { useAdminHeader } from "../shell/AdminShell";
import { useConfirm } from "../ui/Confirm";
import { bkkToday } from "../today/time";

const fmt = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });

export function HolidaysPage() {
  const qc = useQueryClient();
  const q = useQuery(["admin-holidays"], () => leaveService.getHolidays());
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const busy = useRef(false);
  const confirm = useConfirm();
  useAdminHeader({ title: "Holidays", context: "No check-in and no absences on these days" });
  const today = bkkToday();
  const list = [...(q.data ?? [])].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const upcoming = list.filter((h) => h.end_date.slice(0, 10) >= today);
  const past = list.filter((h) => h.end_date.slice(0, 10) < today);
  const add = async () => {
    if (busy.current || !name.trim() || !date) return;
    busy.current = true;
    try {
      await leaveService.createHoliday(name.trim(), date, date);
      setName("");
      setDate("");
      qc.invalidateQueries(["admin-holidays"]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add");
    } finally {
      busy.current = false;
    }
  };
  const row = (h: (typeof list)[number]) => (
    <div key={h._id} className="flex items-center gap-3 border-t border-l-hair py-3 text-[13px] first:border-t-0">
      <span className="w-40 tabular-nums text-l-ink2">{fmt(h.start_date.slice(0, 10))}</span>
      <b className="flex-1 font-semibold">{h.name}</b>
      <button
        type="button"
        aria-label={`Remove ${h.name}`}
        onClick={() =>
          confirm.ask(`Remove ${h.name}?`, async () => {
            await leaveService.deleteHoliday(h._id);
            qc.invalidateQueries(["admin-holidays"]);
          })
        }
        className="grid h-8 w-8 place-items-center rounded-lg text-l-ink3 hover:bg-l-sub hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
  return (
    <div className="flex max-w-[760px] flex-col gap-3.5">
      <section className="rounded-2xl p-5 shadow-[0_0_0_1px_var(--l-hair)]">
        <h4 className="text-[13px] font-semibold">Add a holiday</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          <input aria-label="Holiday name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Father's Day" className="min-w-[220px] flex-1 rounded-xl bg-l-sub px-3 py-2 text-[13.5px] text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
          <input aria-label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl bg-l-sub px-3 py-2 text-[13.5px] text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
          <button type="button" disabled={!name.trim() || !date} onClick={add} className="rounded-full bg-l-ink px-4 py-2 text-[13px] font-semibold text-l-card disabled:opacity-40">
            Add holiday
          </button>
        </div>
      </section>
      <section className="rounded-2xl px-5 py-3 shadow-[0_0_0_1px_var(--l-hair)]">
        <h4 className="py-1 text-[13px] font-semibold">Coming up</h4>
        {upcoming.length ? upcoming.map(row) : <p className="py-3 text-[12.5px] text-l-ink3">No holidays coming up.</p>}
      </section>
      {past.length > 0 && (
        <section className="rounded-2xl px-5 py-3 opacity-70 shadow-[0_0_0_1px_var(--l-hair)]">
          <h4 className="py-1 text-[13px] font-semibold">Past</h4>
          {past.reverse().map(row)}
        </section>
      )}
      {confirm.node}
    </div>
  );
}
