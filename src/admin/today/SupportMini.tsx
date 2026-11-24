import { Link } from "react-router-dom";
import { UserAvatar } from "@/components/user-avatar";
import { nicknames } from "@/learner/lib/name";
import type { SupportRow } from "../wellbeing";

export function SupportMini({ rows }: { rows: SupportRow[] }) {
  return (
    <section aria-label="Needs support" className="rounded-2xl bg-l-card p-4 shadow-[0_0_0_1px_var(--l-hair)]">
      <h4 className="flex items-center gap-2 text-body font-semibold">
        Needs support
        {rows.length > 0 && <span className="rounded-full bg-red-50 px-1.5 text-micro font-bold text-red-600 dark:bg-red-500/15">{rows.length}</span>}
        <Link to="/admin/support" className="ml-auto text-xs font-medium text-l-ink3 hover:text-l-ink">
          All ›
        </Link>
      </h4>
      {rows.length === 0 && <p className="mt-3 text-small text-l-ink3">Nobody right now.</p>}
      {rows.slice(0, 3).map((r) => {
        const n = nicknames(r.learner.zoom_name, r.learner.first_name);
        return (
          <Link key={r.learner.id} to={`/admin/learners/${r.learner.id}`} className="flex items-start gap-2.5 border-t border-l-hair py-2.5 first-of-type:mt-1.5 first-of-type:border-t-0">
            <UserAvatar userId={r.learner.id} name={n.en} avatar={r.learner.avatar} className="mt-0.5 h-7 w-7" />
            <div className="min-w-0 text-small">
              <b className="font-semibold">{n.th || n.en}</b>
              <p className="mt-0.5 leading-snug text-l-ink3">{r.reasons.map((x) => x.text).join(" · ")}</p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
