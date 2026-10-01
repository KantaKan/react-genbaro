import type { StartupPerk, StartupRun } from "@/application/services/startupStoryService";
import { roleLook, spriteFor, ui } from "./startupStoryCatalog";

export function PerkPick({ run, perks, pending, onPick }: { run: StartupRun; perks: StartupPerk[]; pending: boolean; onPick: (index: number) => void }) {
  const pendingPerk = run.pending_perk;
  const dev = run.staff.find((d) => d.id === pendingPerk?.dev_id);
  if (!pendingPerk || !dev) return null;
  return <section className="space-y-4">
    <div className={`${ui.card} space-y-1 p-5 text-center`}>
      <p className="text-4xl">🆙</p>
      <h2 className="text-2xl font-black">{spriteFor(dev)} {dev.name} reached Lv {dev.level}!</h2>
      <p className="text-sm font-bold">{roleLook(dev.role).label} · pick a perk. It sticks for the rest of the run.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      {pendingPerk.offer.map((id, i) => {
        const perk = perks.find((p) => p.id === id);
        return <button key={id} className={`${ui.cardBase} space-y-2 bg-[#cab2f1] p-4 text-left transition hover:-translate-y-1 disabled:opacity-50`} disabled={pending} onClick={() => onPick(i)}>
          <p className="text-lg font-black">✨ {perk?.name ?? id}</p>
          {perk && <p className="text-sm font-bold">{perk.desc}</p>}
        </button>;
      })}
    </div>
  </section>;
}
