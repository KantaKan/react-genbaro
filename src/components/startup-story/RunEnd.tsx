import type { StartupRun } from "@/application/services/startupStoryService";
import { baht, ui } from "./startupStoryCatalog";

export function RunEnd({ run, fameGain, newUnlocks, onDone }: { run: StartupRun; fameGain: number | null; newUnlocks: string[]; onDone: () => void }) {
  const ipo = run.outcome === "ipo";
  return <section className={`${ui.card} space-y-3 p-6 text-center`}>
    <p className="text-5xl">{ipo ? "🔔🔥" : "🐱"}</p>
    <h2 className="text-3xl font-black">{ipo ? "IPO! You rang the bell!" : "Your startup pivoted"}</h2>
    <p className="text-sm font-bold">{ipo ? "From garage to IPO. สุดยอดมาก!" : "Every founder pivots. Your studio keeps everything you learned. ไปต่อกัน!"}</p>
    <p className="text-sm font-bold">{baht(run.money)} · {run.fans.toLocaleString()} fans · {run.bosses_passed} bosses beaten</p>
    <div className="flex flex-wrap justify-center gap-2">
      <span className={`${ui.chip} bg-[#fbe39a]`}>Score {run.score.toLocaleString()}</span>
      {fameGain !== null && <span className={`${ui.chip} bg-[#cab2f1]`}>⭐ +{fameGain} fame</span>}
    </div>
    {newUnlocks.length > 0 && <p className="text-sm font-black">🔓 Unlocked: {newUnlocks.join(", ")}</p>}
    <div><button className={`${ui.button} bg-[#7bc4a8]`} onClick={onDone}>Back to lobby</button></div>
  </section>;
}
