import { useEffect, useRef, useState } from "react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

const FILL_MS = 1500;
const STEP = 50;

/** Hold the mug to brew; it drains if you let go. Full → latte art → check in. */
export default function CoffeeControl({ disabled, busy, onComplete }: CheckInControlProps) {
  const [p, setP] = useState(0);
  const [hold, setHold] = useState(false);
  const level = useRef(0);
  const done = useRef(false);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  useEffect(() => {
    const id = setInterval(() => {
      if (done.current) return;
      level.current = Math.max(0, Math.min(1, level.current + (hold ? STEP / FILL_MS : -STEP / 900)));
      setP(level.current);
      if (level.current >= 1) {
        done.current = true;
        setTimeout(() => complete.current(), 700);
      }
    }, STEP);
    return () => clearInterval(id);
  }, [hold]);
  const full = p >= 1;
  const label = full ? "Perfect latte. Checking you in…" : hold ? `Brewing… ${Math.round(p * 100)}%` : p > 0 ? "Keep holding or it goes cold" : "Hold the mug to brew your check-in";
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        aria-label="Hold the mug to brew your check-in"
        disabled={disabled || busy}
        onPointerDown={() => {
          if (done.current) return;
          setHold(true);
          play("tick");
        }}
        onPointerUp={() => setHold(false)}
        onPointerLeave={() => setHold(false)}
        className="select-none"
        style={{ touchAction: "none" }}
      >
        <svg viewBox="0 0 240 230" width="220" height="210" aria-hidden>
          <defs>
            <linearGradient id="mugG" x1="0" x2="1">
              <stop offset="0" stopColor="#e4e4e7" />
              <stop offset=".35" stopColor="#fff" />
              <stop offset="1" stopColor="#d4d4d8" />
            </linearGradient>
            <radialGradient id="cofG" cx="45%" cy="40%" r="70%">
              <stop offset="0" stopColor="#c08457" />
              <stop offset=".55" stopColor="#8a4b21" />
              <stop offset="1" stopColor="#4a2511" />
            </radialGradient>
          </defs>
          <ellipse cx="120" cy="212" rx="96" ry="10" fill="rgba(0,0,0,.08)" />
          <ellipse cx="120" cy="200" rx="92" ry="16" fill="#f4f4f5" stroke="#d4d4d8" />
          <path d="M176 96 q40 -4 38 34 q-2 34 -44 34" fill="none" stroke="#d4d4d8" strokeWidth="16" strokeLinecap="round" />
          <path d="M176 96 q40 -4 38 34 q-2 34 -44 34" fill="none" stroke="#fafafa" strokeWidth="10" strokeLinecap="round" />
          <path d="M58 78 L182 78 L172 182 Q170 196 154 196 L86 196 Q70 196 68 182 Z" fill="url(#mugG)" stroke="#d4d4d8" strokeWidth="1.5" />
          <text x="122" y="150" textAnchor="middle" fontSize="15" fontWeight="800" fill="#18181b" opacity=".85" letterSpacing=".12em">BARO</text>
          <text x="122" y="166" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="#71717a" letterSpacing=".2em">COFFEE CLUB</text>
          <ellipse cx="120" cy="78" rx="62" ry="11" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="1.5" />
          <ellipse cx="120" cy="79" rx="56" ry="8.5" fill="#3f3f46" />
          <g style={{ transformBox: "fill-box", transformOrigin: "center", transform: `scale(${p})` }}>
            <ellipse cx="120" cy="79" rx="56" ry="8.5" fill="url(#cofG)" />
            <path d="M120 85 c-10 -6 -16 -10 -10 -14 c4 -2 8 0 10 3 c2 -3 6 -5 10 -3 c6 4 0 8 -10 14z" fill="#fde7c8" opacity={full ? 1 : 0} style={{ transition: "opacity .5s" }} />
          </g>
          {hold && !full && <rect x="117" y="0" width="6" height="80" rx="3" fill="#7c3f17" />}
          {full &&
            [100, 124, 146].map((x, i) => (
              <path key={x} d={`M${x} 60 q-8 -12 0 -24 q8 -12 0 -24`} stroke="#d4d4d8" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".8">
                <animate attributeName="opacity" values="0;.9;0" dur="2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
              </path>
            ))}
        </svg>
      </button>
      <p className="text-[13px] font-medium text-l-ink2">{label}</p>
    </div>
  );
}
