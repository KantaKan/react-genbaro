import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "react-query";
import { BarometerFace, ZONES, type ZoneId } from "@/learner/today/BarometerFace";
import { UserAvatar } from "@/components/user-avatar";
import { nicknames } from "@/learner/lib/name";
import { mondayOf, weekLabel } from "@/calendar/week";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { bkkToday } from "../today/time";
import { ZONE_BG } from "../ui/zones";
import { wellbeingApi, type RoughLearner, type WeekRough } from "../wellbeing";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SHORT: Record<string, string> = { comfort: "comfort", "stretch-enjoying": "enjoying", "stretch-overwhelmed": "overwhelmed", panic: "panic" };
const card = "rounded-2xl bg-l-card p-5 shadow-[0_0_0_1px_var(--l-hair)]";

function Strip({ nights }: { nights: RoughLearner["nights"] }) {
  const label = nights.map((z, i) => `${DAYS[i]} ${z ? SHORT[z] : "not written"}`).join(", ");
  return (
    <span role="img" aria-label={label} className="flex gap-[3px]">
      {nights.map((z, i) => (
        <i key={i} title={`${DAYS[i]}: ${z ? SHORT[z] : "not written"}`} className="block h-4 w-4 rounded-[5px]" style={{ background: z ? ZONE_BG[z] : "var(--l-sub)", boxShadow: z ? undefined : "inset 0 0 0 1px var(--l-hair)" }} />
      ))}
    </span>
  );
}

function Week({ w, panicOnly, current }: { w: WeekRough; panicOnly: boolean; current: boolean }) {
  const total = ZONES.reduce((n, z) => n + (w.zones[z.id] ?? 0), 0);
  const roughNights = (w.zones["stretch-overwhelmed"] ?? 0) + (w.zones.panic ?? 0);
  const people = panicOnly ? w.learners.filter((l) => l.panic > 0) : w.learners;
  const label = `Week of ${weekLabel(w.week)}`;
  return (
    <section aria-label={label} className={card}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-[15px] font-semibold">{label}</h3>
        {current && <span className="rounded-full bg-l-sub px-2 py-0.5 text-[11px] font-semibold text-l-ink2">This week</span>}
        <span className="flex-1" />
        {w.possible > 0 && <span className="text-xs text-l-ink3">{Math.round((w.sent / w.possible) * 100)}% sent</span>}
      </div>

      <div className="mt-3.5 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex gap-3">
          {ZONES.map((z) => (
            <div key={z.id} className="flex items-center gap-1.5" title={`${z.a} ${z.b}`}>
              <BarometerFace zone={z.id as ZoneId} size={26} />
              <b className="text-[14px] font-semibold tabular-nums">{w.zones[z.id] ?? 0}</b>
            </div>
          ))}
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-l-sub" aria-hidden>
          {total > 0 && ZONES.map((z) => <div key={z.id} style={{ width: `${((w.zones[z.id] ?? 0) / total) * 100}%`, background: ZONE_BG[z.id] }} />)}
        </div>
      </div>

      <div className="mt-4 border-t border-l-hair pt-3">
        {w.learners.length === 0 ? (
          <p className="text-[13px] text-l-ink3">Nobody had a rough night this week.</p>
        ) : (
          <>
            <p className="mb-2 text-xs font-semibold text-l-ink2">
              {roughNights} rough night{roughNights === 1 ? "" : "s"} · {w.learners.length} learner{w.learners.length === 1 ? "" : "s"}
            </p>
            {people.length === 0 ? (
              <p className="text-[13px] text-l-ink3">No panic nights this week.</p>
            ) : (
              <ul className="flex flex-col">
                {people.map((l) => {
                  const n = nicknames(l.learner.zoom_name, l.learner.first_name);
                  const counts = [l.panic ? `${l.panic} panic` : "", l.overwhelmed ? `${l.overwhelmed} overwhelmed` : ""].filter(Boolean).join(" · ");
                  return (
                    <li key={l.learner.id}>
                      <Link to={`/admin/learners/${l.learner.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-l-sub">
                        <UserAvatar userId={l.learner.id} name={n.en} avatar={l.learner.avatar} className="h-8 w-8" />
                        <span className="min-w-0 flex-1">
                          <b className="text-[13.5px] font-semibold">{n.th || n.en}</b>
                          {n.th && n.en && <span className="ml-1.5 text-xs text-l-ink3">{n.en}</span>}
                          <small className="block text-xs text-l-ink3">{counts}</small>
                        </span>
                        {l.again && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Again</span>}
                        <Strip nights={l.nights} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** Week by week: how the cohort felt, and who had overwhelmed or panic nights. */
export function WeeklySummaryPage() {
  const [cohort] = useCohort();
  const [n, setN] = useState(6);
  const [panicOnly, setPanicOnly] = useState(false);
  const q = useQuery(["admin-weeks", cohort, n], () => wellbeingApi.weeks(cohort, n), { keepPreviousData: true });
  const thisWeek = mondayOf(bkkToday());
  const actions = useMemo(
    () => (
      <div className="inline-flex rounded-[10px] bg-l-sub p-[3px]">
        {([false, true] as const).map((p) => (
          <button key={String(p)} type="button" aria-pressed={panicOnly === p} onClick={() => setPanicOnly(p)} className={`rounded-lg px-3 py-1 text-[12.5px] font-semibold ${panicOnly === p ? "bg-l-card text-l-ink shadow-sm" : "text-l-ink2"}`}>
            {p ? "Panic only" : "All rough nights"}
          </button>
        ))}
      </div>
    ),
    [panicOnly]
  );
  useAdminHeader({ title: "Weekly summary", context: `JSD${cohort} · how each week felt`, actions });

  if (q.isLoading) return <div className="h-48 animate-pulse rounded-2xl bg-l-sub" />;
  if (q.isError || !q.data) return <p className="text-sm text-l-ink3">Couldn't load the weekly summary. Try again in a moment.</p>;

  return (
    <div className="flex max-w-[860px] flex-col gap-3.5">
      <p className="text-xs text-l-ink3">Rough nights are reflections in the overwhelmed or panic zone. "Again" means the learner also had a rough night the week before.</p>
      {q.data.map((w) => (
        <Week key={w.week} w={w} panicOnly={panicOnly} current={w.week === thisWeek} />
      ))}
      {n < 20 && (
        <button type="button" onClick={() => setN((x) => Math.min(20, x + 6))} disabled={q.isFetching} className="self-center rounded-full px-4 py-2 text-[13px] font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)] hover:bg-l-sub disabled:opacity-50">
          Show earlier weeks
        </button>
      )}
    </div>
  );
}
