import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { CreateLeaveRequestDialog } from "@/components/create-leave-request-dialog";
import { nicknames } from "@/learner/lib/name";
import type { LeaveRequest } from "@/domain/types/attendance";
import { adminApi } from "../api";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { useConfirm } from "../ui/Confirm";
import { LeaveMeter } from "../ui/LeaveMeter";
import type { TodayLearner } from "../types";
import { countedDatesOf, projectLeave } from "./projectLeave";
import { whenLine } from "./whenLine";

type Tab = "pending" | "approved" | "rejected";
const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

function LeaveCard({ r, l, onReview }: { r: LeaveRequest; l?: TodayLearner; onReview: (r: LeaveRequest, s: "approved" | "rejected") => void }) {
  const n = nicknames(l?.zoom_name, r.first_name);
  const p = projectLeave(l?.leave_used ?? 0, r.date, countedDatesOf(l?.last10));
  return (
    <article className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-[18px] px-[18px] py-4 shadow-[0_0_0_1px_var(--l-hair)] md:grid-cols-[auto_minmax(0,1fr)_auto]">
      <UserAvatar userId={r.user_id} name={n.en} avatar={l?.avatar} className="h-11 w-11" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <b className="text-title font-semibold">{n.th ? `${n.th} · ${n.en}` : n.en}</b>
          <span className="text-xs text-l-ink3">
            #{r.jsd_number} · {l?.genmate_group ? `Group ${l.genmate_group} · ` : ""}sent {ago(r.created_at)}
          </span>
        </div>
        <div className="mt-0.5 text-body font-semibold">{whenLine(r)}</div>
        <p className="mt-2 whitespace-pre-wrap rounded-xl bg-l-sub px-3 py-2 text-body leading-relaxed">{r.reason || "No reason given."}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-l-ink2">
          Leave used <LeaveMeter used={p.now} after={r.status === "pending" ? p.after : undefined} size="md" />
          <b className="text-body font-semibold text-l-ink">{r.status === "pending" ? `${p.now} → ${p.after}` : p.now}</b> of 8
          {r.status === "pending" && p.reachesLimit && <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-600 dark:bg-red-500/15">Reaches the limit</span>}
          {r.status === "pending" && !p.reachesLimit && p.after >= 6 && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-500/15">{p.after >= 7 ? "Final warning" : "2nd warning"}</span>}
        </div>
      </div>
      {r.status === "pending" ? (
        <div className="col-span-2 flex gap-1.5 md:col-span-1 md:flex-col">
          <button type="button" onClick={() => onReview(r, "approved")} className="rounded-[11px] bg-l-ink px-[18px] py-2 text-body font-semibold text-l-card">
            Approve
          </button>
          <button type="button" onClick={() => onReview(r, "rejected")} className="rounded-[11px] px-[18px] py-2 text-body font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
            Decline
          </button>
        </div>
      ) : (
        <div className="col-span-2 text-xs text-l-ink3 md:col-span-1 md:text-right">
          {r.status === "approved" ? "Approved" : "Declined"}
          {r.reviewed_by_name ? ` by ${r.reviewed_by_name}` : ""}
          {r.reviewed_at ? <span className="block">{ago(r.reviewed_at)}</span> : null}
        </div>
      )}
    </article>
  );
}

export function LeavePage() {
  const [cohort] = useCohort();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");
  const [adding, setAdding] = useState(false);
  const note = useRef("");
  const confirm = useConfirm();
  const list = useQuery(["admin-leaves", cohort, tab], () => adminApi.leaves({ cohort, status: tab }));
  const pending = useQuery(["admin-leaves", cohort, "pending"], () => adminApi.leaves({ cohort, status: "pending" }));
  const today = useQuery(["admin-today", cohort], () => adminApi.today(cohort), { staleTime: 60_000 });
  const byId = new Map((today.data?.learners ?? []).map((l) => [l.id, l]));
  useAdminHeader({ title: "Leave requests", context: `${pending.data?.length ?? 0} waiting` });

  const review = (r: LeaveRequest, status: "approved" | "rejected") => {
    const name = nicknames(byId.get(r.user_id)?.zoom_name, r.first_name);
    note.current = "";
    confirm.ask(
      `${status === "approved" ? "Approve" : "Decline"} ${name.th || name.en}'s leave for ${whenLine(r)}?`,
      async () => {
        try {
          await adminApi.reviewLeave(r._id, status, status === "rejected" && note.current.trim() ? note.current.trim() : undefined);
          qc.invalidateQueries(["admin-leaves"]);
          qc.invalidateQueries(["admin-today"]);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Couldn't save");
        }
      },
      status === "rejected" ? (
        <textarea
          aria-label="Note to the learner (optional)"
          placeholder="Note to the learner (optional)"
          onChange={(e) => (note.current = e.target.value)}
          className="mt-2 h-20 w-full resize-none rounded-xl bg-l-sub px-3 py-2 text-body text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none"
        />
      ) : undefined
    );
  };

  const tabs: [Tab, string][] = [
    ["pending", `Waiting · ${pending.data?.length ?? 0}`],
    ["approved", "Approved"],
    ["rejected", "Declined"],
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-[10px] bg-l-card p-[3px] shadow-[0_0_0_1px_var(--l-hair)]">
          {tabs.map(([k, t]) => (
            <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className={`rounded-[7px] px-3 py-1 text-xs font-semibold ${tab === k ? "bg-l-ink text-l-card" : "text-l-ink2"}`}>
              {t}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-small font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
          <Plus className="h-3.5 w-3.5" />
          Add leave for a learner
        </button>
      </div>
      <div className="mt-3.5 grid gap-3">
        {(list.data ?? []).map((r) => (
          <LeaveCard key={r._id} r={r} l={byId.get(r.user_id)} onReview={review} />
        ))}
        {list.data && list.data.length === 0 && <p className="rounded-2xl bg-l-sub px-4 py-8 text-center text-body text-l-ink3">{tab === "pending" ? "Nothing waiting. Nice." : "Nothing here yet."}</p>}
        {list.isLoading && <div className="h-32 animate-pulse rounded-[18px] bg-l-sub" />}
      </div>
      <CreateLeaveRequestDialog
        open={adding}
        onOpenChange={setAdding}
        students={(today.data?.learners ?? []).map((l) => ({ user_id: l.id, jsd_number: l.jsd_number, first_name: l.first_name, last_name: l.last_name }))}
        onSuccess={() => qc.invalidateQueries(["admin-leaves"])}
      />
      {confirm.node}
    </div>
  );
}
