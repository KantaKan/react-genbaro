import { useEffect, useRef, useState } from "react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

const MS = 1500;
const CROWD = Array.from({ length: 18 }, (_, i) => i);
const CONFETTI = Array.from({ length: 22 }, (_, i) => i);

/** Exclusive to the week's GenMate Cup champions: hold to run the victory lap. */
export default function VictoryLapControl({ disabled, busy, onComplete }: CheckInControlProps) {
  const [holding, setHolding] = useState(false);
  const [won, setWon] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(t.current), []);
  const start = () => {
    if (disabled || busy || won || t.current) return;
    setHolding(true);
    play("tick");
    t.current = setTimeout(() => {
      t.current = undefined;
      setHolding(false);
      setWon(true);
      onComplete();
    }, MS);
  };
  const stop = () => {
    clearTimeout(t.current);
    t.current = undefined;
    setHolding(false);
  };
  const lit = holding || won;
  return (
    <div className="relative w-full max-w-[420px] overflow-hidden rounded-[22px] bg-[radial-gradient(120%_90%_at_50%_0%,#3f2d0a,#0c0a09_70%)] px-4 pb-4 pt-5 text-amber-50 shadow-[0_18px_40px_-20px_rgba(0,0,0,.7)]">
      {/* spotlights */}
      {[-1, 1].map((d) => (
        <span
          key={d}
          aria-hidden
          className="pointer-events-none absolute -top-6 h-[180px] w-24 origin-top bg-gradient-to-b from-amber-200/50 to-transparent blur-md transition-all duration-700"
          style={{ left: d < 0 ? "18%" : "62%", transform: `rotate(${d * (lit ? 8 : 22)}deg)`, opacity: lit ? 0.9 : 0.35 }}
        />
      ))}
      <div className="relative grid place-items-center">
        <svg aria-hidden viewBox="0 0 64 64" width="64" className={`transition-transform duration-700 ${won ? "-translate-y-1 scale-110" : ""}`}>
          <defs>
            <linearGradient id="vl-gold" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#fde68a" />
              <stop offset=".6" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <path d="M18 8h28v12a14 14 0 0 1-28 0z" fill="url(#vl-gold)" />
          <path d="M18 12H9a8 8 0 0 0 9 10M46 12h9a8 8 0 0 1-9 10" stroke="#f59e0b" strokeWidth="3" fill="none" />
          <rect x="29" y="33" width="6" height="11" fill="#d97706" />
          <rect x="21" y="44" width="22" height="7" rx="2" fill="url(#vl-gold)" />
        </svg>
      </div>
      {/* crowd */}
      <div aria-hidden className="relative mt-2 flex justify-center gap-1">
        {CROWD.map((i) => (
          <span
            key={i}
            className="block h-3 w-3 rounded-t-full bg-amber-100/25"
            style={{ transform: lit ? `translateY(${i % 2 ? -4 : -2}px)` : "none", transition: `transform .25s ${i * 20}ms` }}
          />
        ))}
      </div>
      {won &&
        CONFETTI.map((i) => (
          <i
            key={i}
            aria-hidden
            className="pointer-events-none absolute top-0 block h-2 w-1.5 animate-[l-fall_1.6s_ease-in_forwards] rounded-sm bg-amber-300 motion-reduce:hidden"
            style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 60}ms`, background: i % 3 ? "#fcd34d" : "#f59e0b" }}
          />
        ))}
      <button
        type="button"
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        style={{ touchAction: "none" }}
        className="relative mt-4 grid h-[58px] w-full select-none place-items-center overflow-hidden rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 text-[15px] font-semibold text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,.6)] transition-transform duration-300 active:scale-[.98]"
      >
        <span aria-hidden className="absolute inset-y-0 left-0 bg-white/40" style={{ width: holding ? "100%" : "0%", transition: holding ? `width ${MS}ms linear` : "width .3s" }} />
        <span className="relative">{won ? "Champions are in" : busy ? "Checking you in…" : "Hold for your victory lap"}</span>
      </button>
      <style>{`@keyframes l-fall{from{transform:translateY(-10px) rotate(0)}to{transform:translateY(240px) rotate(540deg);opacity:0}}`}</style>
    </div>
  );
}
