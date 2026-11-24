import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { zoneLabel } from "../ui/zones";
import { UserAvatar } from "@/components/user-avatar";
import { BarometerFace } from "@/learner/today/BarometerFace";
import { nicknames } from "@/learner/lib/name";
import type { Session, TodayLearner } from "../types";
import { STATUS_LABEL, hhmm, statusChip } from "../ui/status";
import { LeaveMeter } from "../ui/LeaveMeter";

export type Filter = "all" | "need" | "late" | "leave";
export type RosterLayout = "group" | "number";
const match = (l: TodayLearner, s: Session, f: Filter) => {
  const st = l[s].status;
  return f === "all" || (f === "need" && !st) || (f === "late" && st === "late") || (f === "leave" && (st === "absent_excused" || st === "late_excused"));
};
const lateLately = (l: TodayLearner) => l.last10.filter((d) => d.status === "late").length;

export function Roster({
  learners,
  session,
  selected,
  picked,
  onOpen,
  onPick,
  onQuick,
  canMark,
  supportIds,
  layout = "group",
  onLayout,
}: {
  learners: TodayLearner[];
  session: Session;
  selected: string | null;
  picked: Set<string>;
  onOpen: (id: string) => void;
  onPick: (id: string) => void;
  onQuick: (l: TodayLearner, status: "present" | "absent_excused") => void;
  canMark: boolean;
  supportIds?: Set<string>;
  layout?: RosterLayout;
  onLayout?: (l: RosterLayout) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const byNumber = layout === "number";
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return learners.filter((l) => match(l, session, filter) && (!t || `${l.first_name} ${l.zoom_name} ${l.jsd_number}`.toLowerCase().includes(t)));
  }, [learners, session, filter, q]);
  const need = canMark && (filter === "all" || filter === "need") ? shown.filter((l) => !l[session].status) : [];
  const rest = shown.filter((l) => !need.includes(l));
  const groups = byNumber ? ["*"] : [...new Set(rest.map((l) => l.genmate_group || "–"))];
  const tabs: [Filter, string][] = [
    ["all", "All"],
    ...(canMark ? [["need", "Needs you"] as [Filter, string]] : []),
    ["late", "Late"],
    ["leave", "On leave"],
  ];
  const head = (k: string, children: ReactNode) => (
    <tr key={k}>
      <td colSpan={7} className="border-b border-l-hair bg-l-sub px-3 py-1.5 text-small font-semibold text-l-ink2">
        {children}
      </td>
    </tr>
  );

  const row = (l: TodayLearner, urgent: boolean) => {
    const n = nicknames(l.zoom_name, l.first_name);
    const sel = selected === l.id;
    const lates = lateLately(l);
    return (
      <tr
        key={l.id}
        onClick={() => onOpen(l.id)}
        aria-selected={sel}
        className={`cursor-pointer transition-colors ${sel ? "bg-indigo-50 dark:bg-indigo-500/10" : urgent ? "bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-500/10 dark:hover:bg-amber-500/15" : "hover:bg-l-sub"}`}
      >
        <td className={`w-8 border-b border-l-hair px-3 py-2 ${sel ? "shadow-[inset_3px_0_0_#4f46e5]" : ""}`} onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" aria-label={`Select ${n.th || n.en}`} checked={picked.has(l.id)} onChange={() => onPick(l.id)} />
        </td>
        <td className="border-b border-l-hair px-2.5 py-2">
          <div className="flex items-center gap-2.5">
            <UserAvatar userId={l.id} name={n.en} avatar={l.avatar} className="h-[30px] w-[30px]" />
            <div className="min-w-0">
              <b className="whitespace-nowrap font-semibold">{n.th ? `${n.th} · ${n.en}` : n.en}</b>
              <small className="block text-xs text-l-ink3">
                #{l.jsd_number}
                {byNumber && l.genmate_group ? ` · Group ${l.genmate_group}` : ""}
                {urgent && lates >= 2 && <span className="text-amber-700 dark:text-amber-400"> · late {lates}× lately</span>}
              </small>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap border-b border-l-hair px-2.5 py-2">
          <span className="inline-flex items-center gap-1">
            {(["morning", "afternoon"] as const).map((s) => (
              <span
                key={s}
                title={`${s === "morning" ? "Morning" : "Afternoon"}: ${STATUS_LABEL[l[s].status]}`}
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-micro font-semibold ${statusChip(l[s].status)} ${s === session ? "ring-1 ring-current" : "opacity-70"}`}
              >
                <span className="opacity-60">{s === "morning" ? "AM" : "PM"}</span>
                {STATUS_LABEL[l[s].status]}
                {l[s].checked_in_at && <span className="font-medium opacity-70">{hhmm(l[s].checked_in_at)}</span>}
              </span>
            ))}
            {l[session].flag === "shared_ip" && (
              <span title="Checked in from the same network as another learner" className="rounded-full bg-amber-50 px-1.5 text-micro font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                Same network
              </span>
            )}
          </span>
        </td>
        <td className="border-b border-l-hair px-2.5 py-2 tabular-nums text-l-ink2">{l.streak ? `${l.streak}d` : "—"}</td>
        <td className="whitespace-nowrap border-b border-l-hair px-2.5 py-2">
          <LeaveMeter used={l.leave_used} /> <span className="ml-1 tabular-nums text-l-ink2">{l.leave_used}</span>
        </td>
        <td className="border-b border-l-hair px-2.5 py-2">
          {l.mood_yesterday && (
            <span role="img" aria-label={zoneLabel(l.mood_yesterday)} title={zoneLabel(l.mood_yesterday)} className="inline-flex">
              <BarometerFace zone={l.mood_yesterday} size={18} />
            </span>
          )}
        </td>
        <td className="border-b border-l-hair px-3 py-2" onClick={(e) => e.stopPropagation()}>
          <span className="flex items-center justify-end gap-1">
            {supportIds?.has(l.id) && <span className="mr-0.5 rounded-full bg-red-50 px-2 py-0.5 text-micro font-semibold text-red-600 dark:bg-red-500/15">Support</span>}
            {canMark && !l[session].status && (
              <>
                <button type="button" onClick={() => onQuick(l, "present")} className="rounded-[7px] bg-emerald-50 px-2 py-0.5 text-small font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300">
                  Present
                </button>
                <button type="button" onClick={() => onQuick(l, "absent_excused")} className="rounded-[7px] bg-l-card px-2 py-0.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)] hover:bg-l-sub">
                  Excuse
                </button>
              </>
            )}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <section aria-label="Roster">
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap rounded-[11px] bg-l-card p-[3px] shadow-[0_0_0_1px_var(--l-hair)]">
          {tabs.map(([k, t]) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-small font-semibold ${filter === k ? "bg-l-ink text-l-card" : "text-l-ink2 hover:bg-l-sub"}`}
            >
              {t}
              <em className={`rounded-full px-1.5 text-micro not-italic ${filter === k ? "bg-white/20" : "bg-l-sub text-l-ink3"}`}>{learners.filter((l) => match(l, session, k)).length}</em>
            </button>
          ))}
        </div>
        <label className="relative min-w-[160px] max-w-[240px] flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-l-ink3" />
          <input
            type="search"
            aria-label="Search learners"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or #"
            className="w-full rounded-[9px] bg-l-card py-1.5 pl-8 pr-2.5 text-small shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_2px_var(--l-ink)]"
          />
        </label>
        {onLayout && (
          <div className="ml-auto inline-flex rounded-[10px] bg-l-sub p-[3px]" role="group" aria-label="Roster layout">
            {(["group", "number"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={layout === k} onClick={() => onLayout(k)} className={`rounded-lg px-2.5 py-1 text-small font-semibold ${layout === k ? "bg-l-card text-l-ink shadow-sm" : "text-l-ink2"}`}>
                {k === "group" ? "By group" : "By number"}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="overflow-x-auto rounded-[18px] bg-l-card shadow-[0_0_0_1px_var(--l-hair)]">
        <table className="w-full border-separate border-spacing-0 text-body">
          <thead>
            <tr className="text-left text-small text-l-ink3">
              <th className="w-8 border-b border-l-hair px-3 py-2 font-medium" />
              <th className="border-b border-l-hair px-2.5 py-2 font-medium">Learner</th>
              <th className="border-b border-l-hair px-2.5 py-2 font-medium">Check-in</th>
              <th className="border-b border-l-hair px-2.5 py-2 font-medium">Streak</th>
              <th className="border-b border-l-hair px-2.5 py-2 font-medium">Leave</th>
              <th className="border-b border-l-hair px-2.5 py-2 font-medium">Mood</th>
              <th className="border-b border-l-hair px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {need.length > 0 && [
              head("need", <>Needs you · {need.length} <span className="font-normal text-l-ink3">· not checked in yet</span></>),
              ...need.map((l) => row(l, true)),
            ]}
            {groups.map((g) => {
              const rows = byNumber ? rest : rest.filter((l) => (l.genmate_group || "–") === g);
              if (!rows.length) return null;
              const all = learners.filter((l) => (l.genmate_group || "–") === g);
              return [
                byNumber
                  ? need.length > 0 && head("rest", `Everyone else · ${rows.length}`)
                  : head(`g-${g}`, `Group ${g} · ${all.filter((l) => l[session].status).length}/${all.length} in`),
                ...rows.map((l) => row(l, false)),
              ];
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-small text-l-ink3">
                  {q ? "Nobody matches." : filter === "need" ? "Everyone's in." : "Nobody here."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-3.5 text-small text-l-ink3">
        {[["J K", "move"], ["↵", "open"], ["Esc", "close"], ["P", "present"], ["L", "late"], ["E", "excuse"], ["X", "select"]].map(([k, t]) => (
          <span key={t}>
            <kbd className="mr-1 rounded-md px-1.5 text-micro text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">{k}</kbd>
            {t}
          </span>
        ))}
      </div>
    </section>
  );
}
