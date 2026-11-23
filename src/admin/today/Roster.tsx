import { useMemo, useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { BarometerFace } from "@/learner/today/BarometerFace";
import { nicknames } from "@/learner/lib/name";
import type { Session, TodayLearner } from "../types";
import { STATUS_LABEL, hhmm, statusTone } from "../ui/status";
import { LeaveMeter } from "../ui/LeaveMeter";

export type Filter = "all" | "not_yet" | "late" | "leave";
const match = (l: TodayLearner, s: Session, f: Filter) => {
  const st = l[s].status;
  return f === "all" || (f === "not_yet" && !st) || (f === "late" && st === "late") || (f === "leave" && (st === "absent_excused" || st === "late_excused"));
};

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
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = useMemo(() => learners.filter((l) => match(l, session, filter)), [learners, session, filter]);
  const groups = useMemo(() => [...new Set(shown.map((l) => l.genmate_group || "–"))], [shown]);
  const chips: [Filter, string][] = [
    ["all", "All"],
    ["not_yet", "Not yet"],
    ["late", "Late"],
    ["leave", "On leave"],
  ];
  return (
    <div>
      <div className="mb-2.5 mt-6 flex flex-wrap items-center gap-2">
        <h3 className="mr-1.5 text-title font-semibold">Roster</h3>
        {chips.map(([k, t]) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={`rounded-[9px] px-2.5 py-1 text-small font-semibold ${filter === k ? "bg-l-sub text-l-ink shadow-[0_0_0_1px_var(--l-hair)]" : "text-l-ink2 hover:bg-l-sub"}`}
          >
            {t} <em className="not-italic text-micro text-l-ink3">{learners.filter((l) => match(l, session, k)).length}</em>
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-body">
          <thead>
            <tr className="text-left text-small text-l-ink3">
              <th className="w-8 border-b border-l-hair px-2.5 py-2 font-medium" />
              <th className="border-b border-l-hair px-2.5 py-2 font-medium">Learner</th>
              <th className="border-b border-l-hair px-2.5 py-2 font-medium">Morning</th>
              <th className="border-b border-l-hair px-2.5 py-2 font-medium">Afternoon</th>
              <th className="border-b border-l-hair px-2.5 py-2 font-medium">Streak</th>
              <th className="border-b border-l-hair px-2.5 py-2 font-medium">Leave</th>
              <th className="border-b border-l-hair px-2.5 py-2 font-medium">Mood</th>
              <th className="border-b border-l-hair px-2.5 py-2" />
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const rows = shown.filter((l) => (l.genmate_group || "–") === g);
              const all = learners.filter((l) => (l.genmate_group || "–") === g);
              return [
                <tr key={`g-${g}`}>
                  <td colSpan={8} className="border-b border-l-hair bg-l-sub px-2.5 py-1.5 text-small font-semibold text-l-ink3">
                    Group {g} · {all.filter((l) => l[session].status).length}/{all.length} in
                  </td>
                </tr>,
                ...rows.map((l) => {
                  const n = nicknames(l.zoom_name, l.first_name);
                  const sel = selected === l.id;
                  return (
                    <tr key={l.id} onClick={() => onOpen(l.id)} aria-selected={sel} className={`group cursor-pointer transition-colors ${sel ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-l-sub"}`}>
                      <td className={`border-b border-l-hair px-2.5 py-2 ${sel ? "shadow-[inset_3px_0_0_#4f46e5]" : ""}`} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={`Select ${n.th || n.en}`} checked={picked.has(l.id)} onChange={() => onPick(l.id)} className="h-4 w-4 accent-zinc-900" />
                      </td>
                      <td className="border-b border-l-hair px-2.5 py-2">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar userId={l.id} name={n.en} avatar={l.avatar} className="h-[30px] w-[30px]" />
                          <div>
                            <b className="whitespace-nowrap font-semibold">{n.th ? `${n.th} · ${n.en}` : n.en}</b>
                            <small className="block text-xs text-l-ink3">#{l.jsd_number}</small>
                          </div>
                        </div>
                      </td>
                      {(["morning", "afternoon"] as const).map((s) => (
                        <td key={s} className="whitespace-nowrap border-b border-l-hair px-2.5 py-2">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusTone(l[s].status)}`}>
                            <i className="block h-[7px] w-[7px] rounded-full bg-current" />
                            {STATUS_LABEL[l[s].status]}
                            {l[s].checked_in_at && <small className="font-medium text-l-ink3">{hhmm(l[s].checked_in_at)}</small>}
                            {l[s].flag === "shared_ip" && (
                              <span title="Checked in from the same network as another learner" className="rounded-full bg-amber-50 px-1.5 text-micro font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                Same network
                              </span>
                            )}
                          </span>
                        </td>
                      ))}
                      <td className="border-b border-l-hair px-2.5 py-2 tabular-nums text-l-ink2">{l.streak ? `${l.streak}d` : "—"}</td>
                      <td className="whitespace-nowrap border-b border-l-hair px-2.5 py-2">
                        <LeaveMeter used={l.leave_used} /> <span className="ml-1 tabular-nums text-l-ink2">{l.leave_used}</span>
                      </td>
                      <td className="border-b border-l-hair px-2.5 py-2">{l.mood_yesterday && <BarometerFace zone={l.mood_yesterday} size={18} />}</td>
                      <td className="border-b border-l-hair px-2.5 py-2" onClick={(e) => e.stopPropagation()}>
                        {supportIds?.has(l.id) && <span className="mr-1.5 rounded-full bg-red-50 px-2 py-0.5 text-micro font-semibold text-red-600 dark:bg-red-500/15">Support</span>}
                        {canMark && !l[session].status && (
                          <span className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <button type="button" onClick={() => onQuick(l, "present")} className="rounded-[7px] bg-l-card px-2 py-0.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
                              Present
                            </button>
                            <button type="button" onClick={() => onQuick(l, "absent_excused")} className="rounded-[7px] bg-l-card px-2 py-0.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
                              Excuse
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }),
              ];
            })}
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
    </div>
  );
}
