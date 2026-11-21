import { useRef, useState } from "react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

const CAPS: [number, number, string][] = [
  [92, 70, "#f472b6"], [122, 62, "#60a5fa"], [150, 74, "#facc15"], [104, 96, "#34d399"], [136, 98, "#a78bfa"],
  [78, 96, "#fb923c"], [162, 100, "#f87171"], [118, 120, "#22d3ee"], [90, 122, "#facc15"], [148, 124, "#f472b6"],
];

function rarity(): [string, string, string] {
  const r = Math.random();
  if (r < 0.05) return ["SSR", "#f59e0b", "Legendary Learner"];
  if (r < 0.2) return ["SR", "#a855f7", "Debugging Wizard"];
  if (r < 0.5) return ["R", "#3b82f6", "Semicolon Survivor"];
  return ["N", "#71717a", "Regular Human"];
}

/** Turn the knob, a capsule drops, open it for a (cosmetic) rarity card. */
export default function GachaControl({ disabled, busy, onComplete }: CheckInControlProps) {
  const [stage, setStage] = useState<"idle" | "turning" | "capsule" | "card">("idle");
  const [card, setCard] = useState<[string, string, string] | null>(null);
  const used = useRef(false);
  const capColor = useRef(CAPS[Math.floor(Math.random() * CAPS.length)][2]);
  const turn = () => {
    if (stage !== "idle" || disabled || busy) return;
    setStage("turning");
    play("blip");
    setTimeout(() => (setStage("capsule"), play("thud")), 900);
  };
  const open = () => {
    if (used.current) return;
    used.current = true;
    setCard(rarity());
    setStage("card");
    play("win");
    onComplete();
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 240, height: 260 }}>
        <svg viewBox="0 0 240 260" width="240" height="260" aria-hidden className="absolute inset-0">
          <defs>
            <radialGradient id="gl" cx="35%" cy="25%" r="80%">
              <stop offset="0" stopColor="#fff" stopOpacity=".9" />
              <stop offset=".3" stopColor="#e0f2fe" stopOpacity=".35" />
              <stop offset="1" stopColor="#93c5fd" stopOpacity=".25" />
            </radialGradient>
            <linearGradient id="gbd" x1="0" x2="1">
              <stop offset="0" stopColor="#be123c" />
              <stop offset=".45" stopColor="#f43f5e" />
              <stop offset="1" stopColor="#9f1239" />
            </linearGradient>
            <clipPath id="gdc">
              <circle cx="120" cy="96" r="70" />
            </clipPath>
          </defs>
          <ellipse cx="120" cy="248" rx="80" ry="8" fill="rgba(0,0,0,.1)" />
          <rect x="54" y="150" width="132" height="96" rx="16" fill="url(#gbd)" />
          <rect x="92" y="212" width="40" height="26" rx="8" fill="#4c0519" />
          <g clipPath="url(#gdc)" style={{ animation: stage === "turning" ? "l-jig .3s 3" : "none" }}>
            {CAPS.map(([x, y, c], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="15" fill="#fff" />
                <path d={`M${x - 15} ${y} a15 15 0 0 1 30 0z`} fill={c} />
              </g>
            ))}
          </g>
          <circle cx="120" cy="96" r="70" fill="url(#gl)" stroke="#bae6fd" strokeWidth="3" />
          <ellipse cx="94" cy="62" rx="18" ry="10" fill="#fff" opacity=".7" transform="rotate(-30 94 62)" />
          <rect x="66" y="146" width="108" height="14" rx="7" fill="#881337" />
          <g style={{ transformBox: "fill-box", transformOrigin: "center", transform: stage === "idle" ? "none" : "rotate(360deg)", transition: "transform .9s cubic-bezier(.34,1.3,.64,1)" }}>
            <circle cx="112" cy="190" r="22" fill="#fde047" stroke="#ca8a04" strokeWidth="3" />
            <rect x="108" y="172" width="8" height="36" rx="4" fill="#ca8a04" />
          </g>
        </svg>
        <button type="button" aria-label="Turn the knob" onClick={turn} className="absolute rounded-full" style={{ left: 90, top: 168, width: 44, height: 44 }} />
        {stage === "capsule" && (
          <button
            type="button"
            aria-label="Open the capsule"
            onClick={open}
            className="absolute h-11 w-11 animate-bounce rounded-full shadow-[inset_0_0_0_2px_rgba(0,0,0,.12),0_8px_14px_-6px_rgba(0,0,0,.4)]"
            style={{ left: 98, top: 214, background: `linear-gradient(180deg, ${capColor.current} 50%, #fff 50%)` }}
          />
        )}
        {stage === "card" && card && (
          <div
            data-testid="gacha-card"
            className="absolute left-1/2 top-1/2 w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-3.5 text-center text-zinc-900"
            style={{ boxShadow: `0 0 0 2px ${card[1]}, 0 18px 40px -16px ${card[1]}` }}
          >
            <span className="sr-only">{card[0]}</span>
            <div className="text-[26px] font-black tracking-wider" style={{ color: card[1] }} aria-hidden>
              {card[0]}
            </div>
            <div className="text-[12px] font-semibold">{card[2]}</div>
          </div>
        )}
      </div>
      <p className="text-[13px] font-medium text-l-ink2">{stage === "idle" ? "Turn the knob" : stage === "capsule" ? "A capsule! Tap to open it." : stage === "card" ? "Nice pull." : "…"}</p>
      <style>{`@keyframes l-jig{0%,100%{transform:translateY(0)}33%{transform:translateY(-4px)}66%{transform:translateY(3px)}}`}</style>
    </div>
  );
}
