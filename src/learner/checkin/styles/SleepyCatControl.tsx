import { useState } from "react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

/** Poke the sleeping cat awake, then high-five its paw. */
export default function SleepyCatControl({ disabled, busy, onComplete }: CheckInControlProps) {
  const [awake, setAwake] = useState(false);
  const [hi5, setHi5] = useState(false);
  const [msg, setMsg] = useState("The cat is asleep. Poke it.");
  const ink = "#431407";
  const poke = () => {
    if (!awake) {
      setAwake(true);
      setMsg("It wants a high five. Tap the paw.");
      play("blip");
    } else if (!hi5) setMsg("Not me. The paw!");
  };
  const five = () => {
    if (!awake || hi5 || disabled || busy) return;
    setHi5(true);
    setMsg("Purrrr…");
    play("thud");
    setTimeout(onComplete, 700);
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 280, height: 230 }}>
        <svg viewBox="0 0 280 230" width="280" height="230" aria-hidden className="absolute inset-0">
          <defs>
            <radialGradient id="fur" cx="40%" cy="30%" r="80%">
              <stop offset="0" stopColor="#fed7aa" />
              <stop offset=".6" stopColor="#fb923c" />
              <stop offset="1" stopColor="#ea580c" />
            </radialGradient>
          </defs>
          <ellipse cx="146" cy="212" rx="110" ry="10" fill="rgba(0,0,0,.08)" />
          <path d="M226 186 q44 -6 34 -52 q-6 -22 -24 -10" fill="none" stroke="#ea580c" strokeWidth="20" strokeLinecap="round" />
          <g style={{ transform: awake ? (hi5 ? "translateY(-8px) rotate(-6deg)" : "none") : "translateY(80px)", transition: "transform .6s cubic-bezier(.34,1.56,.64,1)", transformOrigin: "192px 200px" }}>
            <path d="M166 210 V112 q0 -26 26 -26 q26 0 26 26 V210Z" fill="url(#fur)" stroke="#7c2d12" strokeWidth="3" />
            <ellipse cx="192" cy="118" rx="11" ry="9" fill="#f9a8d4" />
            <circle cx="178" cy="100" r="5" fill="#f9a8d4" />
            <circle cx="192" cy="95" r="5" fill="#f9a8d4" />
            <circle cx="206" cy="100" r="5" fill="#f9a8d4" />
          </g>
          <ellipse cx="160" cy="170" rx="92" ry="44" fill="url(#fur)" stroke="#7c2d12" strokeWidth="3" />
          <path d="M150 132 q8 16 0 30 M176 130 q8 18 0 34 M202 136 q6 14 0 28" stroke="#c2410c" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".7" />
          <g style={{ transform: awake ? "rotate(-6deg)" : "none", transformOrigin: "96px 160px", transition: "transform .5s" }}>
            <path d="M44 100 L52 46 L88 76 Z M148 100 L140 46 L104 76 Z" fill="url(#fur)" stroke="#7c2d12" strokeWidth="3" strokeLinejoin="round" />
            <path d="M54 90 L58 60 L78 78Z M138 90 L134 60 L114 78Z" fill="#fbcfe8" />
            <circle cx="96" cy="124" r="56" fill="url(#fur)" stroke="#7c2d12" strokeWidth="3" />
            <path d="M84 72 v14 M96 70 v16 M108 72 v14" stroke="#c2410c" strokeWidth="4.5" strokeLinecap="round" opacity=".75" />
            <ellipse cx="96" cy="146" rx="26" ry="18" fill="#fff7ed" />
            {!awake && <path d="M64 120 q10 8 20 0 M108 120 q10 8 20 0" stroke={ink} strokeWidth="3.5" fill="none" strokeLinecap="round" />}
            {awake && !hi5 && (
              <>
                <ellipse cx="74" cy="118" rx="10" ry="12" fill={ink} />
                <ellipse cx="118" cy="118" rx="10" ry="12" fill={ink} />
                <circle cx="78" cy="113" r="4" fill="#fff" />
                <circle cx="122" cy="113" r="4" fill="#fff" />
              </>
            )}
            {hi5 && <path d="M64 122 q10 -10 20 0 M108 122 q10 -10 20 0" stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" />}
            <ellipse cx="66" cy="138" rx="9" ry="5" fill="#fb7185" opacity=".35" />
            <ellipse cx="126" cy="138" rx="9" ry="5" fill="#fb7185" opacity=".35" />
            <path d="M90 138 h12 l-6 6z" fill="#f472b6" />
            <path d="M96 144 v5 M86 152 q5 5 10 -3 q5 8 10 3" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M74 146 l-30 -4 M74 152 l-30 4 M118 146 l30 -4 M118 152 l30 4" stroke={ink} strokeWidth="1.6" strokeLinecap="round" opacity=".6" />
          </g>
          {!awake && (
            <text x="150" y="58" fontSize="18" fontWeight="800" fill="#a1a1aa">
              z<animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite" />
            </text>
          )}
          {hi5 && <path d="M192 70 l6 -18 l4 16 l16 -10 l-8 16 l18 2 l-16 8 l10 14 l-16 -6 l-4 16 l-6 -16 l-14 10 l6 -16 l-16 -4 l16 -6 l-8 -14z" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />}
        </svg>
        <button type="button" aria-label="Poke the cat" onClick={poke} className="absolute rounded-full" style={{ left: 30, top: 50, width: 130, height: 140 }} />
        {awake && <button type="button" aria-label="High five" onClick={five} className="absolute rounded-2xl" style={{ left: 162, top: 84, width: 60, height: 90 }} />}
      </div>
      <p className="text-[13px] font-medium text-l-ink2">{msg}</p>
    </div>
  );
}
