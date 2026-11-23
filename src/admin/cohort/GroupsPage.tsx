import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { Shuffle } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { nicknames } from "@/learner/lib/name";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { wellbeingApi, type LearnerRow } from "../wellbeing";
import { useConfirm } from "../ui/Confirm";
import { cohortApi } from "./api";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Balanced random groups A, B, … (sizes differ by at most one). */
export function shuffleGroups(ids: string[], n: number, rand: () => number = Math.random): string[] {
  const order = ids.map((_, i) => ({ i, k: rand() + i * 1e-9 })).sort((a, b) => a.k - b.k);
  const out = new Array<string>(ids.length);
  order.forEach((o, pos) => (out[o.i] = LETTERS[pos % n]));
  return out;
}

export function GroupsPage() {
  const [cohort] = useCohort();
  const qc = useQueryClient();
  const q = useQuery(["admin-learners", cohort], () => wellbeingApi.learners(cohort));
  const learners = useMemo(() => (q.data ?? []).filter((l) => l.attendance_status !== "dropout" && l.attendance_status !== "dismissed"), [q.data]);
  const [moves, setMoves] = useState<Record<string, string>>({});
  const [drag, setDrag] = useState<string | null>(null);
  const [shuffleN, setShuffleN] = useState(6);
  const busy = useRef(false);
  const confirm = useConfirm();
  useAdminHeader({ title: "GenMate groups", context: `${learners.length} learners` });
  const groupOf = (l: LearnerRow) => moves[l.id] ?? l.genmate_group ?? "";
  const groups = useMemo(() => {
    const set = new Set(learners.map(groupOf).filter(Boolean));
    return [...set].sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learners, moves]);
  const changed = learners.filter((l) => moves[l.id] !== undefined && moves[l.id] !== (l.genmate_group ?? ""));
  const move = (id: string, g: string) => setMoves((m) => ({ ...m, [id]: g }));
  const save = async () => {
    if (busy.current || !changed.length) return;
    busy.current = true;
    try {
      await cohortApi.moveGroups(cohort, changed.map((l) => ({ user_id: l.id, group: moves[l.id] })));
      toast.success("Groups saved");
      setMoves({});
      qc.invalidateQueries(["admin-learners"]);
      qc.invalidateQueries(["admin-today"]);
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Couldn't save");
    } finally {
      busy.current = false;
    }
  };
  const doShuffle = () =>
    confirm.ask(
      `Shuffle ${learners.length} learners into ${shuffleN} groups?`,
      async () => {
        const g = shuffleGroups(learners.map((l) => l.id), shuffleN);
        setMoves(Object.fromEntries(learners.map((l, i) => [l.id, g[i]])));
      },
      "Nothing is saved until you press Save. Existing groups and Slack links don't change on their own."
    );
  const column = (g: string) => {
    const members = learners.filter((l) => groupOf(l) === g);
    return (
      <section
        key={g || "none"}
        aria-label={g ? `Group ${g}` : "No group"}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => drag && move(drag, g)}
        className="rounded-2xl bg-l-card p-3 shadow-[0_0_0_1px_var(--l-hair)]"
      >
        <h4 className="flex items-center gap-2 px-1 text-body font-semibold">
          {g ? `Group ${g}` : "No group"}
          <span className="text-micro font-medium text-l-ink3">{members.length}</span>
        </h4>
        <ul className="mt-1.5 flex min-h-[48px] flex-col gap-0.5">
          {members.map((l) => {
            const n = nicknames(l.zoom_name, l.first_name);
            const from = moves[l.id] !== undefined && moves[l.id] !== (l.genmate_group ?? "") ? l.genmate_group || "none" : null;
            return (
              <li
                key={l.id}
                draggable
                onDragStart={() => setDrag(l.id)}
                onDragEnd={() => setDrag(null)}
                className={`flex cursor-grab items-center gap-2 rounded-[10px] px-2 py-1.5 text-small ${from ? "bg-indigo-50 shadow-[inset_0_0_0_1px_rgba(99,102,241,.3)] dark:bg-indigo-500/15" : "hover:bg-l-sub"}`}
              >
                <UserAvatar userId={l.id} name={n.en} avatar={l.avatar} className="h-6 w-6" />
                <span className="min-w-0 flex-1 truncate">{n.th || n.en}</span>
                {from && <small className="text-micro text-l-ink3">from {from}</small>}
                <select
                  aria-label={`Move ${n.th || n.en} to`}
                  value={groupOf(l)}
                  onChange={(e) => move(l.id, e.target.value)}
                  className="rounded-md bg-transparent text-small text-l-ink3 outline-none focus:text-l-ink"
                >
                  <option value="">–</option>
                  {LETTERS.slice(0, Math.max(10, groups.length + 1)).map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };
  const noGroup = learners.some((l) => !groupOf(l));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-l-ink3">Drag learners between groups, or use the menu on each name. Nothing saves until you press Save.</span>
        <span className="flex-1" />
        <label className="flex items-center gap-1.5 text-xs text-l-ink2">
          Groups
          <input type="number" min={2} max={26} value={shuffleN} onChange={(e) => setShuffleN(Math.max(2, Math.min(26, Number(e.target.value) || 2)))} className="w-14 rounded-lg bg-l-sub px-2 py-1 text-body shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
        </label>
        <button type="button" onClick={doShuffle} className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
          <Shuffle className="h-3.5 w-3.5" /> Shuffle…
        </button>
        {changed.length > 0 && (
          <button type="button" onClick={() => setMoves({})} className="rounded-[10px] px-3 py-1.5 text-small font-semibold text-l-ink2">
            Undo all
          </button>
        )}
        <button type="button" disabled={!changed.length} onClick={save} className="rounded-[10px] bg-l-ink px-3.5 py-1.5 text-small font-semibold text-l-card disabled:opacity-40">
          {changed.length ? `Save ${changed.length} change${changed.length === 1 ? "" : "s"}` : "Saved"}
        </button>
      </div>
      <div className="mt-3.5 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(210px,1fr))]">
        {groups.map(column)}
        {noGroup && column("")}
      </div>
      {q.isLoading && <div className="mt-3 h-32 animate-pulse rounded-2xl bg-l-sub" />}
      {confirm.node}
    </div>
  );
}
