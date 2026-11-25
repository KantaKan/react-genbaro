import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { nicknames } from "@/learner/lib/name";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { wellbeingApi, type LearnerRow } from "../wellbeing";
import { LeaveMeter } from "../ui/LeaveMeter";
import { ZONE_BG, zoneLabel } from "../ui/zones";
import { LoadingHint, SkeletonRows } from "@/components/LoadingSkeleton";

type Filter = "active" | "support" | "dropped";
const dropped = (r: LearnerRow) => r.attendance_status === "dropout" || r.attendance_status === "dismissed";
const seen = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(d);
  const t = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Bangkok" });
  return day === today ? `Today ${t}` : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Bangkok" });
};

export function LearnersPage() {
  const [cohort] = useCohort();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("active");
  const list = useQuery(["admin-learners", cohort], () => wellbeingApi.learners(cohort));
  const rows = list.data ?? [];
  useAdminHeader({
    title: "All learners",
    context: `${rows.filter((r) => !dropped(r)).length} in JSD${cohort}`,
    actions: (
      <Link to="/admin/users" className="hidden text-small font-medium text-l-ink2 hover:text-l-ink sm:inline">
        Manage accounts ›
      </Link>
    ),
  });
  const counts = { active: rows.filter((r) => !dropped(r)).length, support: rows.filter((r) => r.support && !dropped(r)).length, dropped: rows.filter(dropped).length };
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "active" && dropped(r)) return false;
      if (filter === "support" && (!r.support || dropped(r))) return false;
      if (filter === "dropped" && !dropped(r)) return false;
      if (!needle) return true;
      const n = nicknames(r.zoom_name, r.first_name);
      return [n.th, n.en, r.first_name, r.jsd_number, r.email].join(" ").toLowerCase().includes(needle);
    });
  }, [rows, q, filter]);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-[260px] items-center gap-2 rounded-[10px] bg-l-sub px-3 py-1.5 text-l-ink3 shadow-[0_0_0_1px_var(--l-hair)]">
          <Search className="h-4 w-4" strokeWidth={1.5} />
          <input aria-label="Search learners" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, nickname, number, email…" className="w-full bg-transparent text-body text-l-ink outline-none" />
        </label>
        {([["active", "Active"], ["support", "Needs support"], ["dropped", "Dropped"]] as const).map(([k, t]) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={`rounded-[9px] px-2.5 py-1 text-small font-semibold ${filter === k ? "bg-l-sub text-l-ink shadow-[0_0_0_1px_var(--l-hair)]" : "text-l-ink2"}`}>
            {t} <em className="text-micro not-italic text-l-ink3">{counts[k]}</em>
          </button>
        ))}
      </div>
      <div className="mt-3 overflow-x-auto rounded-2xl shadow-[0_0_0_1px_var(--l-hair)]">
        <table className="w-full border-separate border-spacing-0 text-body">
          <thead>
            <tr className="text-left text-small text-l-ink3">
              {["Learner", "Group", "Attendance", "Leave", "Mood · 10 nights", "Last seen", ""].map((h) => (
                <th key={h} className="border-b border-l-hair px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const n = nicknames(r.zoom_name, r.first_name);
              return (
                <tr key={r.id} onClick={() => nav(`/admin/learners/${r.id}`)} className="cursor-pointer hover:bg-l-sub">
                  <td className="border-b border-l-hair px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar userId={r.id} name={n.en} avatar={r.avatar} className="h-[30px] w-[30px]" />
                      <div>
                        <Link to={`/admin/learners/${r.id}`} onClick={(e) => e.stopPropagation()} className="whitespace-nowrap font-semibold hover:underline focus:underline focus:outline-none">
                          {n.th ? `${n.th} · ${n.en}` : n.en}
                        </Link>
                        <small className="block text-xs text-l-ink3">
                          #{r.jsd_number}
                          {r.email ? ` · ${r.email}` : ""}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-l-hair px-3 py-2 font-semibold text-l-ink2">{r.genmate_group || "–"}</td>
                  <td className="border-b border-l-hair px-3 py-2 tabular-nums text-l-ink2">{(r.attendance_rate * 100).toFixed(1)}%</td>
                  <td className="whitespace-nowrap border-b border-l-hair px-3 py-2">
                    <LeaveMeter used={r.leave_used} /> <span className="ml-1 tabular-nums text-l-ink2">{r.leave_used}</span>
                  </td>
                  <td className="border-b border-l-hair px-3 py-2">
                    <span className="inline-flex gap-0.5">
                      {r.mood.map((z, i) => (
                        <i key={i} title={zoneLabel(z)} className="block h-4 w-[7px] rounded-sm" style={{ background: z ? ZONE_BG[z] : "var(--l-hair)" }} />
                      ))}
                    </span>
                  </td>
                  <td className="whitespace-nowrap border-b border-l-hair px-3 py-2 text-l-ink2">{seen(r.last_seen)}</td>
                  <td className="border-b border-l-hair px-3 py-2">{r.support && <span className="rounded-full bg-red-50 px-2 py-0.5 text-micro font-semibold text-red-600 dark:bg-red-500/15">Support</span>}</td>
                </tr>
              );
            })}
            {list.isLoading && <SkeletonRows cols={["person", "text", "text", "meter", "bars", "text", "empty"]} rows={10} />}
          </tbody>
        </table>
        {list.isLoading && <LoadingHint label="Loading learners" />}
        {list.isError && <p className="px-4 py-8 text-center text-body text-red-600">Couldn't load learners. Refresh to try again.</p>}
        {list.isSuccess && shown.length === 0 && <p className="px-4 py-8 text-center text-body text-l-ink3">No one matches.</p>}
      </div>
    </div>
  );
}
