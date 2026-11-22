import { UserAvatar } from "@/components/user-avatar";
import { nicknames } from "@/learner/lib/name";
import type { Session, TodayView } from "../types";
import { hhmm } from "../ui/status";

export function JustIn({ view, session }: { view: TodayView; session: Session }) {
  const ins = view.learners
    .filter((l) => l[session].marked_by === "self" && l[session].checked_in_at)
    .sort((a, b) => (a[session].checked_in_at! < b[session].checked_in_at! ? 1 : -1))
    .slice(0, 6);
  return (
    <section className="rounded-2xl p-4 shadow-[0_0_0_1px_var(--l-hair)]">
      <h4 className="text-[13px] font-semibold">Just checked in</h4>
      {ins.length === 0 && <p className="mt-3 text-[12.5px] text-l-ink3">No check-ins yet.</p>}
      <ul className="mt-2 flex flex-col">
        {ins.map((l) => {
          const n = nicknames(l.zoom_name, l.first_name);
          const late = l[session].status === "late";
          return (
            <li key={l.id} className="flex items-center gap-2.5 py-1.5 text-[12.5px]">
              <UserAvatar userId={l.id} name={n.en} avatar={l.avatar} className="h-6 w-6" />
              <b className="font-semibold">{n.th || n.en}</b>
              <span className="text-l-ink3">{n.en}</span>
              <span className={`inline-flex items-center gap-1.5 font-semibold ${late ? "text-amber-600" : "text-emerald-600"}`}>
                <i className="block h-1.5 w-1.5 rounded-full bg-current" />
                {late ? "late" : "on time"}
              </span>
              <span className="ml-auto tabular-nums text-l-ink3">{hhmm(l[session].checked_in_at)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
