import { Heart, Sparkles } from "lucide-react";
import type { CareEnergyState } from "@/application/services/careEnergyService";

interface CharacterCarePanelProps {
  state?: CareEnergyState;
  loading: boolean;
  caring: boolean;
  error: boolean;
  onCare: () => void;
  onRetry: () => void;
}

export function CharacterCarePanel({ state, loading, caring, error, onCare, onRetry }: CharacterCarePanelProps) {
  const empty = (state?.balance ?? 0) < 1;

  return <section className="mt-6 rounded-2xl border-2 border-[#292542]/15 bg-[#fff7d6] p-4" aria-labelledby="care-energy-title">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p id="care-energy-title" className="flex items-center gap-2 font-black"><Sparkles className="h-4 w-4 text-[#d58b42]" /> Care Energy</p>
        <p className="mt-1 text-xs leading-5 text-[#686378]">พลังเล็ก ๆ สำหรับเล่นกับคู่หู ไม่เร่ง streak หรือร่าง และใช้เปิด Reward Draw ไม่ได้</p>
      </div>
      <span className="min-w-16 rounded-full border-2 border-[#292542] bg-white px-3 py-1 text-center text-sm font-black" aria-label={`Care Energy ${state?.balance ?? 0}`}>
        {loading ? "…" : `💛 ${state?.balance ?? 0}`}
      </span>
    </div>
    <button type="button" disabled={loading || caring || empty} onClick={onCare} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-[#292542] bg-[#f4bd80] px-5 text-sm font-black shadow-[3px_4px_0_#292542] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
      <Heart className="h-4 w-4 fill-[#f7a5a4]" /> {caring ? "กำลังเล่นด้วยกัน…" : empty ? "Care Energy หมดแล้ว" : "เล่นกับคู่หู · ใช้ 1 พลัง"}
    </button>
    {error && <p role="alert" className="mt-3 text-xs font-bold text-[#a9505e]">ยังใช้ Care Energy ไม่ได้ <button type="button" onClick={onRetry} className="underline">ลองใหม่</button></p>}
  </section>;
}
