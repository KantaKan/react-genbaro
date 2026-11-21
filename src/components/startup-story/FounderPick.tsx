import type { StartupDev, StartupRole } from "@/application/services/startupStoryService";
import { ui } from "./startupStoryCatalog";
import { DevCard } from "./DevCard";

export function FounderPick({ offer, onPick, pending, roles }: { offer: StartupDev[]; onPick: (index: number) => void; pending: boolean; roles?: StartupRole[] }) {
  return <section className="space-y-4">
    <h2 className="text-2xl font-black text-foreground">Pick your founder</h2>
    <div className="grid gap-4 sm:grid-cols-3">
      {offer.map((dev, i) => <button key={dev.id} className={`${ui.card} p-4 text-left transition hover:-translate-y-1 disabled:opacity-50`} onClick={() => onPick(i)} disabled={pending}>
        {dev.sprite === "octo" && <p className="mb-2 inline-block rounded-full border-2 border-[#292542] bg-[#292542] px-2 py-0.5 text-xs font-black text-[#fffaf0]">SECRET FOUNDER</p>}
        <DevCard dev={dev} roles={roles} />
      </button>)}
    </div>
  </section>;
}
