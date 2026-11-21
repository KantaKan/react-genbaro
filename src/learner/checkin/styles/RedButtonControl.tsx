import { useState } from "react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

/** Lift the hazard cover, then smash the big red button. */
export default function RedButtonControl({ disabled, busy, onComplete }: CheckInControlProps) {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const press = () => {
    if (!open || pressed || disabled || busy) return;
    setPressed(true);
    play("thud");
    setTimeout(onComplete, 520);
  };
  return (
    <div className={`flex flex-col items-center gap-2 ${pressed ? "animate-[l-shake_.45s]" : ""}`}>
      <style>{`@keyframes l-shake{0%,100%{transform:none}20%{transform:translate(-6px,2px)}40%{transform:translate(5px,-3px)}60%{transform:translate(-4px,3px)}80%{transform:translate(3px,-2px)}}`}</style>
      <div className="relative" style={{ width: 280, height: 220 }}>
        <svg viewBox="0 0 280 220" width="280" height="220" aria-hidden className="absolute inset-0">
          <defs>
            <linearGradient id="met" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f4f4f5" />
              <stop offset=".5" stopColor="#a1a1aa" />
              <stop offset="1" stopColor="#e4e4e7" />
            </linearGradient>
            <radialGradient id="dome" cx="38%" cy="28%" r="80%">
              <stop offset="0" stopColor="#fecaca" />
              <stop offset=".25" stopColor="#f87171" />
              <stop offset=".7" stopColor="#dc2626" />
              <stop offset="1" stopColor="#7f1d1d" />
            </radialGradient>
            <pattern id="haz" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="16" fill="#facc15" />
              <rect x="8" width="8" height="16" fill="#18181b" />
            </pattern>
          </defs>
          <ellipse cx="140" cy="206" rx="118" ry="9" fill="rgba(0,0,0,.12)" />
          <rect x="20" y="22" width="240" height="176" rx="22" fill="url(#met)" stroke="#71717a" strokeWidth="1.5" />
          {[[38, 40], [242, 40], [38, 180], [242, 180]].map(([x, y]) => (
            <g key={`${x}${y}`}>
              <circle cx={x} cy={y} r="6" fill="#d4d4d8" stroke="#71717a" />
              <path d={`M${x - 4} ${y - 1} l8 2`} stroke="#52525b" strokeWidth="1.6" />
            </g>
          ))}
          <rect x="58" y="36" width="160" height="22" rx="5" fill="#18181b" />
          <text x="138" y="51" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#facc15" letterSpacing=".14em">CHECK-IN · DON'T PANIC</text>
          <circle cx="232" cy="47" r="6" fill={pressed ? "#22c55e" : "#ef4444"} stroke="#7f1d1d">
            {!pressed && <animate attributeName="opacity" values="1;.25;1" dur="1s" repeatCount="indefinite" />}
          </circle>
          <ellipse cx="140" cy="148" rx="66" ry="24" fill="#27272a" />
          <ellipse cx="140" cy="144" rx="60" ry="20" fill="#3f3f46" />
          <g style={{ transform: pressed ? "translateY(9px)" : "none", transition: "transform .12s" }}>
            <ellipse cx="140" cy="140" rx="50" ry="15" fill="#991b1b" />
            <path d="M90 140 Q90 92 140 92 Q190 92 190 140 Z" fill="url(#dome)" />
            <ellipse cx="120" cy="106" rx="18" ry="8" fill="#fff" opacity=".55" transform="rotate(-20 120 106)" />
          </g>
          <g style={{ transformBox: "fill-box", transformOrigin: "50% 0", transform: open ? "scaleY(-.32)" : "none", transition: "transform .7s cubic-bezier(.34,1.56,.64,1)" }}>
            <rect x="80" y="84" width="120" height="70" rx="12" fill="rgba(186,230,253,.28)" stroke="url(#haz)" strokeWidth="7" />
          </g>
          <rect x="112" y="78" width="56" height="9" rx="3" fill="#52525b" />
        </svg>
        <button type="button" aria-label="Press the button" onClick={press} className="absolute rounded-full" style={{ left: 90, top: 92, width: 100, height: 52 }} />
        {!open && <button type="button" aria-label="Lift the safety cover" onClick={() => (setOpen(true), play("thud"))} className="absolute rounded-xl" style={{ left: 80, top: 84, width: 120, height: 70 }} />}
      </div>
      <p className="text-[13px] font-medium text-l-ink2">{open ? (pressed ? "Boom." : "Cover open. There is no going back.") : "Lift the safety cover first"}</p>
    </div>
  );
}
