import { motion, useReducedMotion } from "framer-motion";
import type { StartupResult } from "@/application/services/startupStoryService";
import { baht, reviewerIcons, ui } from "./startupStoryCatalog";

export type BossOutcome = { name: string; passed: boolean; threshold: number };

export function ReviewDialog({ result, boss, news = [], onClose }: { result: StartupResult; boss?: BossOutcome; news?: string[]; onClose: () => void }) {
  const reduced = useReducedMotion();
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292542]/60 p-4" role="dialog" aria-modal="true" aria-label="Reviews">
    <div className={`${ui.card} max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto p-5`}>
      <p className="text-xs font-black uppercase tracking-widest">{result.type} · {result.theme} · {result.combo} combo</p>
      <h2 className="text-3xl font-black">{result.total}/40</h2>
      {boss && <p className={`rounded-2xl border-2 border-[#292542] p-3 text-sm font-black ${boss.passed ? "bg-[#7bc4a8]" : "bg-[#f7c6d9]"}`}>
        {boss.passed ? `${boss.name} defeated! 🎉` : `${boss.name} needed ${boss.threshold}. Time to pivot 🐱`}
      </p>}
      {result.reviews.map((r, i) => <motion.div key={r.reviewer} className="rounded-2xl border-2 border-[#292542] bg-white p-3"
        initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : 0.25 + i * 0.35, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex items-center justify-between font-black"><span>{reviewerIcons[r.reviewer]} {r.reviewer}</span><span>{r.score}/10</span></div>
        <p className="mt-1 text-sm">{r.line}</p>
      </motion.div>)}
      {news.length > 0 && <div className="rounded-2xl border-2 border-[#292542] bg-[#fbe39a] p-3 text-sm font-bold">
        <p className="text-xs font-black uppercase tracking-widest">📰 Office gossip</p>
        <ul className="mt-1 space-y-1">{news.map((line) => <li key={line}>{line}</li>)}</ul>
      </div>}
      <p className="text-sm font-bold">💰 {result.money_delta >= 0 ? "+" : ""}{baht(result.money_delta)} · ❤️ +{result.fans_delta.toLocaleString()} fans · 🐛 {result.bugs} bugs</p>
      <button className={`${ui.button} w-full bg-[#7bc4a8]`} onClick={onClose} autoFocus>Nice!</button>
    </div>
  </div>;
}
