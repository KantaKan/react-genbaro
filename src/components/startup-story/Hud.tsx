import type { StartupItem, StartupRun } from "@/application/services/startupStoryService";
import { baht, rarityStyle, ui } from "./startupStoryCatalog";

export function Hud({ run, items }: { run: StartupRun; items: StartupItem[] }) {
  const owned = (run.items ?? []).map((id) => items.find((it) => it.id === id)).filter((it): it is StartupItem => Boolean(it));
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      {run.mode === "ranked" && <span className={`${ui.chip} bg-[#292542] !text-[#fffaf0]`}>🏆 Weekly Seed</span>}
      <span className={`${ui.chip} bg-[#fbe39a]`}>💰 {baht(run.money)}</span>
      <span className={`${ui.chip} bg-[#f7c6d9]`}>❤️ {run.fans.toLocaleString()} fans</span>
      <span className={`${ui.chip} bg-white`}>🗺️ Act {run.act}/3 · Project {(run.project_index % 3) + 1}/3</span>
    </div>
    {owned.length > 0 && <ul className="flex flex-wrap gap-1" aria-label="Your items">
      {owned.map((it, i) => <li key={`${it.id}-${i}`} title={`${it.name}: ${it.desc}`} className={`${ui.chip} ${rarityStyle[it.rarity]} px-2 py-1`}>{it.icon} <span className="sr-only">{it.name}</span></li>)}
    </ul>}
  </div>;
}
