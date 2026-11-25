import { useRef } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { nicknames } from "@/learner/lib/name";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { wellbeingApi } from "../wellbeing";
import { Bone, LoadingHint } from "@/components/LoadingSkeleton";

export function SupportPage() {
  const [cohort] = useCohort();
  const qc = useQueryClient();
  const busy = useRef(false);
  const list = useQuery(["admin-support", cohort], () => wellbeingApi.support(cohort));
  const rows = list.data ?? [];
  useAdminHeader({ title: "Needs support", context: `${rows.length} learner${rows.length === 1 ? "" : "s"}` });
  const ack = async (id: string, key: string, text: string) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await wellbeingApi.ack(id, key, text);
      qc.invalidateQueries(["admin-support"]);
      qc.invalidateQueries(["admin-learners"]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      busy.current = false;
    }
  };
  return (
    <div>
      <p className="max-w-[680px] text-body text-l-ink2">
        Learners whose leave, lateness or reflections show a pattern, or who have open support steps. Acknowledge a reason to hide it for 7 days; steps clear when they're ticked off.
      </p>
      <div className="mt-3.5 grid gap-3">
        {rows.map((r) => {
          const n = nicknames(r.learner.zoom_name, r.learner.first_name);
          const total = r.open_items + r.done_items;
          return (
            <article key={r.learner.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-[18px] px-[18px] py-4 shadow-[0_0_0_1px_var(--l-hair)] md:grid-cols-[auto_minmax(0,1fr)_auto]">
              <UserAvatar userId={r.learner.id} name={n.en} avatar={r.learner.avatar} className="h-11 w-11" />
              <div className="min-w-0">
                <b className="text-title font-semibold">{n.th ? `${n.th} · ${n.en}` : n.en}</b>
                <span className="ml-2 text-xs text-l-ink3">
                  #{r.learner.jsd_number} · Group {r.learner.genmate_group || "–"}
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.reasons.map((x) => (
                    <span key={x.key} className="inline-flex items-center gap-1.5 rounded-full bg-red-50 py-0.5 pl-2.5 pr-1 text-small font-semibold text-red-600 dark:bg-red-500/15">
                      {x.text}
                      {x.key !== "plan" ? (
                        <button type="button" aria-label={`Acknowledge ${x.text}`} title="Acknowledge for 7 days" onClick={() => ack(r.learner.id, x.key, x.text)} className="rounded-full bg-white/70 px-1.5 text-micro text-red-700 dark:bg-white/15 dark:text-red-200">
                          OK
                        </button>
                      ) : (
                        <span className="pr-1.5" />
                      )}
                    </span>
                  ))}
                </div>
                {total > 0 && (
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-l-ink2">
                    <span className="flex h-1.5 w-24 overflow-hidden rounded-full bg-l-sub shadow-[inset_0_0_0_1px_var(--l-hair)]">
                      <i className="block h-full bg-emerald-500" style={{ width: `${(r.done_items / total) * 100}%` }} />
                    </span>
                    {`${r.done_items}/${total} steps done`}
                  </div>
                )}
              </div>
              <Link to={`/admin/learners/${r.learner.id}`} className="col-span-2 self-center justify-self-start rounded-[11px] px-4 py-2 text-body font-semibold shadow-[0_0_0_1px_var(--l-hair)] md:col-span-1">
                Open profile
              </Link>
            </article>
          );
        })}
        {list.isLoading && (
          <>
            {["w-40", "w-32", "w-44"].map((w) => (
              <div key={w} aria-hidden className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-[18px] px-[18px] py-4 shadow-[0_0_0_1px_var(--l-hair)] md:grid-cols-[auto_minmax(0,1fr)_auto]">
                <Bone className="h-11 w-11 rounded-full" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Bone className={`h-5 ${w}`} />
                    <Bone className="h-3 w-24" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Bone className="h-6 w-28 rounded-full" />
                    <Bone className="h-6 w-36 rounded-full" />
                  </div>
                </div>
                <Bone className="col-span-2 h-9 w-[118px] self-center rounded-[11px] md:col-span-1" />
              </div>
            ))}
            <LoadingHint label="Loading who needs support" />
          </>
        )}
        {list.isError && <p className="rounded-2xl bg-l-sub px-4 py-8 text-center text-body text-red-600">Couldn't load the support list. Refresh to try again.</p>}
        {list.isSuccess && rows.length === 0 && <p className="rounded-2xl bg-l-sub px-4 py-8 text-center text-body text-l-ink3">Nobody needs extra support right now.</p>}
      </div>
    </div>
  );
}
