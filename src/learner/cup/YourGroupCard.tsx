import type { MyCup } from "./types";
import { bestMoves, CATEGORIES, CATEGORY_LABEL, headline } from "./lib";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function YourGroupCard({ cup }: { cup: MyCup }) {
  const s = cup.standings;
  const me = s.find((x) => x.group === cup.my_group);
  const text = headline(cup);
  if (!me) {
    return (
      <section className="l-card p-[22px]">
        <h3 className="text-[15px] font-semibold">Your group</h3>
        <p className="mt-3 text-[13px] text-l-ink2">{text}</p>
        <p className="mt-1 text-[12.5px] text-l-ink3">Ask a TA to add you to one so your points count.</p>
      </section>
    );
  }
  const max = Math.max(1, ...s.map((x) => x.total));
  const rank = s.indexOf(me);
  const rival = rank === 0 ? s[1] : s[rank - 1];
  const moves = bestMoves(cup);
  const weakest = CATEGORIES.reduce((a, c) => (me.by_category[c] < me.by_category[a] ? c : a), CATEGORIES[0]);
  const catMax = Math.max(1, ...CATEGORIES.map((c) => me.by_category[c]));
  const dayMax = Math.max(1, ...me.by_day);
  const pos = (v: number) => `${4 + (v / max) * 92}%`;
  return (
    <section className="l-card p-[22px]">
      <div className="flex items-start justify-between">
        <h3 className="text-[15px] font-semibold">Your group · {me.group}</h3>
        <span className="text-[12.5px] tabular-nums text-l-ink3">#{rank + 1} · {me.total} pts</span>
      </div>
      <p className="mt-3 text-[17px] font-semibold leading-snug tracking-tight">{text}</p>

      <div className="relative mt-6 h-12" aria-hidden>
        <div className="absolute inset-x-0 top-5 h-px bg-l-hair" />
        {rival && rival.total !== me.total && (
          <span
            className="absolute top-[13px] h-3.5 rounded border-x border-t border-l-ink3"
            style={{ left: pos(Math.min(me.total, rival.total)), width: `${(Math.abs(rival.total - me.total) / max) * 92}%` }}
          />
        )}
        {s.map((x, i) => (
          <span
            key={x.group}
            className={`absolute top-5 -translate-x-1/2 -translate-y-1/2 rounded-full ${x === me ? "z-[1] h-4 w-4 bg-l-ink shadow-[0_0_0_3px_var(--l-card)]" : i === 0 ? "h-3 w-3 bg-amber-500" : "h-2 w-2 bg-l-ink3"}`}
            style={{ left: pos(x.total) }}
          >
            {(x === me || i === 0) && <small className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-l-ink2">{x.group}</small>}
          </span>
        ))}
      </div>

      {moves.length > 0 && (
        <div className="mt-4 rounded-2xl bg-l-sub px-4 py-3">
          <small className="text-[11.5px] font-semibold uppercase tracking-[.08em] text-l-ink3">Your best move</small>
          <p className="mt-1 text-[13.5px] font-medium">
            {moves[0].text} <span className="text-l-ink3">· {CATEGORY_LABEL[moves[0].category]}</span>
          </p>
          <ul className="mt-1.5 flex flex-col gap-0.5 text-[12.5px] text-l-ink2">
            {moves.slice(1).map((m) => (
              <li key={m.category}>
                {m.text} · {CATEGORY_LABEL[m.category]}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h4 className="mb-1 mt-5 text-[12px] font-semibold uppercase tracking-[.08em] text-l-ink3">Where points came from</h4>
      {CATEGORIES.map((c) => (
        <div key={c} className="grid grid-cols-[96px_1fr_64px] items-center gap-2.5 py-1.5 text-[12.5px]">
          <span className="text-l-ink2">{CATEGORY_LABEL[c]}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-l-sub">
            <i className={`block h-full rounded-full ${c === weakest ? "bg-amber-500" : "bg-l-ink"}`} style={{ width: `${(me.by_category[c] / catMax) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">
            {me.by_category[c]}
            {c === weakest && <small className="ml-1 text-[10.5px] font-semibold text-amber-600">lowest</small>}
          </span>
        </div>
      ))}

      <h4 className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-[.08em] text-l-ink3">Points per day</h4>
      <div className="flex h-14 items-end gap-2">
        {me.by_day.map((v, i) => (
          <span key={DAYS[i]} className="flex flex-1 flex-col items-center gap-1">
            <i className="block w-full rounded-md bg-l-ink/80" style={{ height: `${Math.max(3, (v / dayMax) * 40)}px` }} title={`${DAYS[i]}: ${v}`} />
            <small className="text-[10.5px] text-l-ink3">{DAYS[i]}</small>
          </span>
        ))}
      </div>

      {cup.my_awards.length > 0 && (
        <>
          <h4 className="mb-1 mt-4 text-[12px] font-semibold uppercase tracking-[.08em] text-l-ink3">Recent awards</h4>
          {cup.my_awards.slice(0, 4).map((a) => (
            <div key={a.id} className="flex justify-between gap-3 border-t border-l-hair py-2 text-[12.5px] first:border-t-0">
              <span className="truncate text-l-ink2">{a.reason}</span>
              <b className="shrink-0 tabular-nums">+{a.points}</b>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
