import { useState } from "react";
import { useQuery } from "react-query";
import { useAdminHeader } from "../shell/AdminShell";
import { cohortApi, type Activity } from "./api";

export function ActivityPage() {
  const [pages, setPages] = useState(1);
  const [who, setWho] = useState("");
  useAdminHeader({ title: "Activity log", context: "Who changed what" });
  const queries = Array.from({ length: pages }, (_, i) => i + 1);
  return (
    <div className="max-w-[900px]">
      <input aria-label="Filter by person or action" value={who} onChange={(e) => setWho(e.target.value)} placeholder="Filter by person or action…" className="w-72 rounded-[10px] bg-l-sub px-3 py-1.5 text-[13px] text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
      <section className="mt-3 rounded-2xl px-4 py-1 shadow-[0_0_0_1px_var(--l-hair)]">
        {queries.map((p) => (
          <Page key={p} page={p} filter={who.trim().toLowerCase()} onMore={p === pages ? () => setPages(p + 1) : undefined} />
        ))}
      </section>
    </div>
  );
}

function Page({ page, filter, onMore }: { page: number; filter: string; onMore?: () => void }) {
  const q = useQuery(["admin-activity", page], () => cohortApi.activity(page), { staleTime: 30_000 });
  const items: Activity[] = (q.data?.items ?? []).filter((i) => !filter || `${i.actor_name} ${i.action}`.toLowerCase().includes(filter));
  const more = !!q.data && page * 40 < q.data.total;
  return (
    <>
      {items.map((i) => (
        <div key={i.id} className="flex items-center gap-3 border-b border-l-hair py-2.5 text-[13px] last:border-0">
          <b className="w-24 truncate font-semibold">{i.actor_name}</b>
          <span className="flex-1">
            {i.action}
            {i.status >= 400 && <span className="ml-2 text-[11px] font-semibold text-red-600">failed</span>}
          </span>
          <span className="whitespace-nowrap text-xs tabular-nums text-l-ink3">{new Date(i.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" })}</span>
        </div>
      ))}
      {q.isLoading && <div className="my-2 h-10 animate-pulse rounded-lg bg-l-sub" />}
      {q.isError && <p className="py-6 text-center text-[13px] text-red-600">Couldn't load the activity log. Refresh to try again.</p>}
      {onMore && more && (
        <button type="button" onClick={onMore} className="my-2.5 w-full rounded-xl py-2 text-[12.5px] font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
          Load more
        </button>
      )}
    </>
  );
}
