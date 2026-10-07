import type { StartupItem, StartupRun } from "@/application/services/startupStoryService";
import { actName, baht, fansLabel, rarityStyle, ui } from "./startupStoryCatalog";
import { WorldEventBadge } from "./WorldEventBadge";

export function Hud({ run, items }: { run: StartupRun; items: StartupItem[] }) {
  const owned = (run.items ?? []).map((id) => items.find((it) => it.id === id)).filter((it): it is StartupItem => Boolean(it));
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {run.mode === "ranked" && <span className={`${ui.chip} bg-[#292542] !text-[#fffaf0]`}>🏆 Weekly Seed</span>}
      <span className={`${ui.chip} bg-[#fbe39a]`}>💰 {baht(run.money)}</span>
      {run.oss && <span className={`${ui.chip} bg-[#292542] !text-[#fffaf0]`}>🐙 Open Source</span>}
      <span className={`${ui.chip} bg-[#f7c6d9]`}>{run.fans.toLocaleString()} {fansLabel(run.oss)}</span>
      {run.endless && <span className={`${ui.chip} bg-[#cab2f1]`}>🚀 Endless</span>}
      <span className={`${ui.chip} bg-white`}>🗺️ {actName(run.act)} · Act {run.act}{run.endless ? "" : "/3"} · Project {(run.project_index % 3) + 1}/3</span>
      <WorldEventBadge run={run} />
      {(run.next_bugs || run.next_power) ? <span className={`${ui.chip} bg-[#f7c6d9]`} title="From an event. Applies to your next ship only.">
        Next project:{run.next_bugs ? ` +${run.next_bugs} bugs` : ""}{run.next_power ? ` ${run.next_power > 0 ? "+" : "−"}${Math.round(Math.abs(run.next_power) * 100)}% power` : ""}
      </span> : null}
    </div>
    {owned.length > 0 && <ul className="flex flex-wrap gap-1" aria-label="Your items">
      {owned.map((it, i) => <li key={`${it.id}-${i}`} title={`${it.name}: ${it.desc}`} className={`${ui.chip} ${rarityStyle[it.rarity]} px-2 py-1`}>{it.icon} <span className="sr-only">{it.name}</span></li>)}
    </ul>}
  </div>;
}
