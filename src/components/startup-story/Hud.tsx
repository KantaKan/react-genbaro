import { PixelIcon } from "./office/PixelIcon";
import { useEffect, useRef, useState } from "react";
import type { StartupItem, StartupRun } from "@/application/services/startupStoryService";
import { actName, baht, fansLabel, rarityStyle, ui } from "./startupStoryCatalog";
import { WorldEventBadge } from "./WorldEventBadge";

function useMoneyJuice(money: number) {
  const [shown, setShown] = useState(money);
  const [delta, setDelta] = useState<{ amount: number; key: number } | null>(null);
  const last = useRef(money);
  useEffect(() => {
    const from = last.current;
    last.current = money;
    if (from === money) return;
    setDelta({ amount: money - from, key: Date.now() });
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(money);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      setShown(Math.round(from + (money - from) * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [money]);
  return { shown, delta };
}

export function Hud({ run, items }: { run: StartupRun; items: StartupItem[] }) {
  const { shown, delta } = useMoneyJuice(run.money);
  const owned = (run.items ?? []).map((id) => items.find((it) => it.id === id)).filter((it): it is StartupItem => Boolean(it));
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {run.mode === "ranked" && <span className={`${ui.chip} bg-[#292542] !text-[#fffaf0]`}>Weekly Seed</span>}
      <span key={delta?.key} className={`${ui.chip} relative inline-flex items-center gap-1 bg-[#fbe39a] tabular-nums ${delta ? "ss-bump" : ""}`}>
        <PixelIcon name="coin" size={1.5} />{baht(shown)}
        {delta && <span aria-hidden="true" className={`ss-float pointer-events-none absolute -top-1 right-1 text-xs font-semibold ${delta.amount > 0 ? "text-[#2b7d5d]" : "text-[#c4302b]"}`}>{delta.amount > 0 ? "+" : "−"}{baht(Math.abs(delta.amount))}</span>}
      </span>
      {run.oss && <span className={`${ui.chip} bg-[#292542] !text-[#fffaf0]`}>Open Source</span>}
      <span className={`${ui.chip} inline-flex items-center gap-1 bg-[#f7c6d9]`}><PixelIcon name={run.oss ? "star" : "heart"} size={1.5} />{run.fans.toLocaleString()} {fansLabel(run.oss)}</span>
      {run.endless && <span className={`${ui.chip} bg-[#cab2f1]`}>Endless</span>}
      <span className={`${ui.chip} bg-white`}>{actName(run.act)} · Act {run.act}{run.endless ? "" : "/3"} · Project {(run.project_index % 3) + 1}/3</span>
      <WorldEventBadge run={run} />
      {(run.next_bugs || run.next_power || run.next_traffic) ? <span className={`${ui.chip} bg-[#f7c6d9]`} title="From an event. Applies to your next ship only.">
        Next project:{run.next_bugs ? ` +${run.next_bugs} bugs` : ""}{run.next_power ? ` ${run.next_power > 0 ? "+" : "−"}${Math.round(Math.abs(run.next_power) * 100)}% power` : ""}{run.next_traffic ? ` ${1 + run.next_traffic}x traffic` : ""}
      </span> : null}
    </div>
    {owned.length > 0 && <ul className="flex flex-wrap gap-1" aria-label="Your items">
      {owned.map((it, i) => <li key={`${it.id}-${i}`} title={`${it.name}: ${it.desc}`} className={`${ui.chip} ${rarityStyle[it.rarity]} px-2 py-1`}><PixelIcon name={it.icon} size={1.5} /><span className="sr-only">{it.name}</span></li>)}
    </ul>}
  </div>;
}
