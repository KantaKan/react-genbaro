import type { StartupDev, StartupRole } from "@/application/services/startupStoryService";
import { ui } from "./startupStoryCatalog";
import { DevCard } from "./DevCard";

export function FounderPick({ offer, onPick, pending, roles }: { offer: StartupDev[]; onPick: (index: number) => void; pending: boolean; roles?: StartupRole[] }) {
  return <section className="space-y-4">
    <h2 className="text-2xl font-black text-foreground">Pick your founder</h2>
    <div className="grid gap-4 sm:grid-cols-3">
      {offer.map((dev, i) => <button key={dev.id} className={`${ui.card} p-4 text-left transition hover:-translate-y-1 disabled:opacity-50`} onClick={() => onPick(i)} disabled={pending}>
        <DevCard dev={dev} roles={roles} />
      </button>)}
    </div>
  </section>;
}
