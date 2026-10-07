import { PixelIcon } from "./office/PixelIcon";
import type { StartupRun } from "@/application/services/startupStoryService";
import { baht, fansLabel, ui } from "./startupStoryCatalog";

export function IpoChoice({ run, pending, onChoose }: { run: StartupRun; pending: boolean; onChoose: (keepGoing: boolean) => void }) {
  return <section className={`${ui.card} space-y-4 p-6 text-center`}>
    <PixelIcon name={run.oss ? "rocket" : "trophy"} size={5} />
    <h2 className="text-3xl font-black">{run.oss ? "v1.0 is live!" : "You rang the IPO bell!"}</h2>
    <p className="text-sm font-bold">{baht(run.money)} · {run.fans.toLocaleString()} {fansLabel(run.oss)}. {run.oss ? "From side project to the backbone of the internet." : "From garage to stock market."} สุดยอดมาก!</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <button className={`${ui.card} space-y-1 bg-[#fbe39a] p-4 text-left transition hover:-translate-y-1 disabled:opacity-50`} disabled={pending} onClick={() => onChoose(false)}>
        <p className="text-lg font-black">Cash out</p>
        <p className="text-sm font-bold">End the run here as a legend. Safe, smug, retired at 25.</p>
      </button>
      <button className={`${ui.card} space-y-1 bg-[#cab2f1] p-4 text-left transition hover:-translate-y-1 disabled:opacity-50`} disabled={pending} onClick={() => onChoose(true)}>
        <p className="text-lg font-black">Keep going</p>
        <p className="text-sm font-bold">Series B, Unicorn, Galactic Conglomerate… bosses get nastier every act until you fall. How deep can you go?</p>
      </button>
    </div>
  </section>;
}
