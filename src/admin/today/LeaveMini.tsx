import { Link } from "react-router-dom";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { nicknames } from "@/learner/lib/name";
import type { LeaveRequest } from "@/domain/types/attendance";
import { adminApi } from "../api";
import type { TodayLearner } from "../types";
import { countedDatesOf, projectLeave } from "../leave/projectLeave";
import { useConfirm } from "../ui/Confirm";
import { whenLine } from "../leave/whenLine";

export function LeaveMini({ requests, learners }: { requests: LeaveRequest[]; learners: TodayLearner[] }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const byId = new Map(learners.map((l) => [l.id, l]));
  const review = (r: LeaveRequest, status: "approved" | "rejected", name: string) =>
    confirm.ask(`${status === "approved" ? "Approve" : "Decline"} ${name}'s leave?`, async () => {
      try {
        await adminApi.reviewLeave(r._id, status);
        qc.invalidateQueries(["admin-leaves"]);
        qc.invalidateQueries(["admin-today"]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't save");
      }
    });
  return (
    <section className="rounded-2xl p-4 shadow-[0_0_0_1px_var(--l-hair)]">
      <h4 className="flex items-center gap-2 text-body font-semibold">
        Leave requests
        {requests.length > 0 && <span className="rounded-full bg-red-50 px-1.5 text-micro font-bold text-red-600 dark:bg-red-500/15">{requests.length}</span>}
        <Link to="/admin/leave" className="ml-auto text-xs font-medium text-l-ink3 hover:text-l-ink">
          All ›
        </Link>
      </h4>
      {requests.length === 0 && <p className="mt-3 text-small text-l-ink3">Nothing waiting.</p>}
      {requests.slice(0, 3).map((r) => {
        const l = byId.get(r.user_id);
        const n = nicknames(l?.zoom_name, r.first_name);
        const p = projectLeave(l?.leave_used ?? 0, r.date, countedDatesOf(l?.last10));
        return (
          <div key={r._id} className="flex items-start gap-2.5 border-t border-l-hair py-2.5 first-of-type:mt-1.5 first-of-type:border-t-0">
            <UserAvatar userId={r.user_id} name={n.en} avatar={l?.avatar} className="mt-0.5 h-7 w-7" />
            <div className="min-w-0 flex-1 text-small">
              <b className="font-semibold">{n.th ? `${n.th} · ${n.en}` : n.en}</b>
              <p className="mt-0.5 leading-snug text-l-ink3">
                {whenLine(r)} · {r.reason} · would be{" "}
                <span className={p.reachesLimit ? "font-semibold text-red-600" : p.after >= 6 ? "font-semibold text-amber-600" : ""}>{p.after}/8</span>
              </p>
            </div>
            <div className="flex gap-1">
              <button type="button" aria-label={`Approve ${n.th || n.en}`} onClick={() => review(r, "approved", n.th || n.en)} className="grid h-7 w-7 place-items-center rounded-lg shadow-[0_0_0_1px_var(--l-hair)] hover:bg-emerald-50 hover:text-emerald-700">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button type="button" aria-label={`Decline ${n.th || n.en}`} onClick={() => review(r, "rejected", n.th || n.en)} className="grid h-7 w-7 place-items-center rounded-lg shadow-[0_0_0_1px_var(--l-hair)] hover:bg-red-50 hover:text-red-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
      {confirm.node}
    </section>
  );
}
