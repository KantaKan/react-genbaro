import { useMemo, useRef, useState } from "react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

const SYM = ["🍒", "⭐", "🔔", "🍋", "💎", "🍀"];
const ROWS = 16;
const H = 84;

export default function LuckySlotControl({ tone, disabled, busy, onComplete }: CheckInControlProps) {
  const win = tone === "late" ? "⏰" : "✅";
  const strips = useMemo(() => [0, 1, 2].map(() => Array.from({ length: ROWS }, () => SYM[Math.floor(Math.random() * SYM.length)])), []);
  const [spun, setSpun] = useState(false);
  const [stopped, setStopped] = useState(false);
  const used = useRef(false);
  const pull = () => {
    if (used.current || disabled || busy) return;
    used.current = true;
    setSpun(true);
    play("thud");
    onComplete();
    setTimeout(() => {
      setStopped(true);
      play("win");
    }, 2300);
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[300px] max-w-full rounded-[26px_26px_18px_18px] bg-gradient-to-b from-violet-600 to-violet-900 px-3.5 pb-4 pt-3 shadow-[inset_0_2px_0_rgba(255,255,255,.25),inset_0_-6px_0_rgba(0,0,0,.25),0_24px_40px_-22px_rgba(76,29,149,.8)]">
        <div className="rounded-2xl bg-gradient-to-b from-indigo-950 to-indigo-800 p-2 text-center text-[13px] font-extrabold tracking-[.14em] text-amber-200 [text-shadow:0_0_8px_#f59e0b]">
          BARO SLOTS
          <div className="mx-1 mt-1.5 flex justify-between">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} className="block h-[7px] w-[7px] rounded-full bg-amber-200 shadow-[0_0_6px_#facc15]" style={{ animation: `l-blink ${stopped ? ".18s" : "1s"} steps(1) ${i % 2 ? ".5s" : "0s"} infinite` }} />
            ))}
          </div>
        </div>
        <div className="relative mt-2.5 flex gap-1.5 rounded-[14px] bg-[#0f0a1f] p-2">
          <span className="pointer-events-none absolute inset-x-1 top-1/2 z-10 h-0.5 bg-red-500/75 shadow-[0_0_6px_#ef4444]" />
          {strips.map((s, i) => (
            <div key={i} className="relative h-[84px] flex-1 overflow-hidden rounded-[10px] bg-white shadow-[inset_0_10px_12px_-8px_rgba(0,0,0,.45),inset_0_-10px_12px_-8px_rgba(0,0,0,.45)]">
              <div
                className="absolute inset-x-0 top-0"
                style={{ transform: spun ? `translateY(-${ROWS * H}px)` : "none", transition: spun ? `transform ${1.1 + i * 0.5}s cubic-bezier(.2,.9,.25,1)` : "none" }}
              >
                {[...s, win].map((x, j) => (
                  <div key={j} className="grid h-[84px] place-items-center text-[38px]">
                    {x}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 h-[18px] rounded-[9px] bg-gradient-to-b from-indigo-950 to-indigo-800 shadow-[inset_0_3px_6px_rgba(0,0,0,.5)]" />
        <button type="button" aria-label="Pull the lever" onClick={pull} className="absolute -right-[30px] top-[60px] h-[120px] w-[30px]">
          <span className="absolute bottom-2 left-1 h-6 w-5 rounded-md bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-800" />
          <span
            className="absolute bottom-5 left-2.5 h-[86px] w-2 origin-bottom rounded-md bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-500 transition-transform duration-300"
            style={{ transform: spun && !stopped ? "scaleY(-.55)" : "none" }}
          >
            <span className="absolute -left-[7px] -top-4 h-[22px] w-[22px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fca5a5,#dc2626_55%,#7f1d1d)]" />
          </span>
        </button>
      </div>
      <p className="text-[13px] font-medium text-l-ink2">{stopped ? (tone === "late" ? "Late, but still a win" : "JACKPOT: Present!") : "Pull the lever"}</p>
      <style>{`@keyframes l-blink{50%{opacity:.25}}`}</style>
    </div>
  );
}
