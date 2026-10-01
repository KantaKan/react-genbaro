import type { StartupRun } from "@/application/services/startupStoryService";
import { actName, baht, fansLabel, ui } from "./startupStoryCatalog";

export function RunEnd({ run, fameGain, newUnlocks, onDone }: { run: StartupRun; fameGain: number | null; newUnlocks: string[]; onDone: () => void }) {
  const ipo = run.outcome === "ipo";
  const fell = run.endless && !ipo;
  return <section className={`${ui.card} space-y-3 p-6 text-center`}>
    <p className="text-5xl">{ipo ? "🔔🔥" : fell ? "🚀💥" : "🐱"}</p>
    <h2 className="text-3xl font-black">{ipo ? (run.oss ? "v1.0 shipped! The internet loves you 🐙" : "IPO! You rang the bell!") : fell ? "The empire finally fell" : "Your startup pivoted"}</h2>
    {fell && <p className="text-sm font-bold">You IPO'd, then flew straight into the sun. ไม่เป็นไร ตำนานยังอยู่ 🫡</p>}
    <p className="text-sm font-bold">{ipo ? "From garage to IPO. สุดยอดมาก!" : "Every founder pivots. Your studio keeps everything you learned. ไปต่อกัน!"}</p>
    {run.endless && <p className="text-sm font-black">🚀 Went past the IPO and reached Act {run.max_act}: {actName(run.max_act ?? run.act)}</p>}
    <p className="text-sm font-bold">{baht(run.money)} · {run.fans.toLocaleString()} {fansLabel(run.oss)} · {run.bosses_passed} bosses beaten</p>
    <div className="flex flex-wrap justify-center gap-2">
      <span className={`${ui.chip} bg-[#fbe39a]`}>Score {run.score.toLocaleString()}</span>
      {fameGain !== null && <span className={`${ui.chip} bg-[#cab2f1]`}>⭐ +{fameGain} fame</span>}
    </div>
    {newUnlocks.length > 0 && <p className="text-sm font-black">🔓 Unlocked: {newUnlocks.join(", ")}</p>}
    <div><button className={`${ui.button} bg-[#7bc4a8]`} onClick={onDone}>Back to lobby</button></div>
  </section>;
}
