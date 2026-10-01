import { useEffect, useState } from "react";
import type { StartupItem, StartupRun } from "@/application/services/startupStoryService";
import { bossInfo, ui } from "./startupStoryCatalog";

function useSecondsLeft(endsAt: string, clockOffset: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);
  return Math.max(0, Math.ceil((Date.parse(endsAt) - (now + clockOffset)) / 1000));
}

export function DevPhase({ run, clockOffset, onShip, pending }: { run: StartupRun; clockOffset: number; onShip: () => void; pending: boolean; items?: StartupItem[]; skin?: string }) {
  const project = run.project!;
  const left = useSecondsLeft(project.ends_at, clockOffset);
  const total = Math.max(1, (Date.parse(project.ends_at) - Date.parse(project.started_at)) / 1000);
  const percent = Math.min(100, Math.max(0, 100 - (left / total) * 100));
  const boss = project.boss ? bossInfo(project.boss, run.oss) : undefined;
  return <section className="space-y-4">
    <div className={`${ui.card} space-y-3 p-4`}>
      {boss && <p className="text-xs font-black uppercase tracking-widest">👹 {boss.name}</p>}
      <h2 className="text-xl font-black">{project.type} · {project.theme}</h2>
      <div className="h-4 overflow-hidden rounded-full border-2 border-[#292542] bg-white" role="progressbar" aria-label="Build progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}>
        <div className="h-full bg-[#7bc4a8] transition-[width]" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm font-bold">{left > 0 ? `Building... ${left}s` : "Ready to ship! 🚀"}</p>
      <button className={`${ui.button} w-full bg-[#f4ba87]`} disabled={left > 0 || pending} onClick={onShip}>Ship it</button>
    </div>
  </section>;
}
