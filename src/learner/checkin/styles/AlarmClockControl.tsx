import { useEffect, useRef, useState } from "react";
import type { CheckInControlProps } from "../types";
import { bangkokNow } from "../../lib/time";
import { play } from "../sound";

const MSGS = ["It won't stop ringing. Hit it.", "Still ringing!", "One more hit!", "Okay okay, you're awake."];

export default function AlarmClockControl({ disabled, busy, onComplete }: CheckInControlProps) {
  const [hits, setHits] = useState(0);
  const fired = useRef(false);
  const ringing = hits < 3;
  useEffect(() => {
    if (!ringing) return;
    const id = setInterval(() => play("tick"), 260);
    return () => clearInterval(id);
  }, [ringing]);
  const hit = () => {
    if (!ringing || disabled || busy) return;
    const n = hits + 1;
    setHits(n);
    play("thud");
    if (n === 3 && !fired.current) {
      fired.current = true;
      onComplete();
    }
  };
  const m = bangkokNow().minutes;
  const ha = ((Math.floor(m / 60) % 12) + (m % 60) / 60) * 30;
  const ma = (m % 60) * 6;
  return (
    <div className="flex flex-col items-center gap-2">
      <style>{`@keyframes l-ring{0%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}100%{transform:rotate(-5deg)}}`}</style>
      <button type="button" aria-label="Hit the alarm" onClick={hit} className="select-none">
        <svg viewBox="0 0 240 240" width="220" height="220" aria-hidden>
          <defs>
            <radialGradient id="bell" cx="35%" cy="30%" r="80%">
              <stop offset="0" stopColor="#fef9c3" />
              <stop offset=".5" stopColor="#facc15" />
              <stop offset="1" stopColor="#a16207" />
            </radialGradient>
            <radialGradient id="abody" cx="35%" cy="30%" r="80%">
              <stop offset="0" stopColor="#fda4af" />
              <stop offset=".55" stopColor="#e11d48" />
              <stop offset="1" stopColor="#881337" />
            </radialGradient>
          </defs>
          <ellipse cx="120" cy="222" rx="80" ry="8" fill="rgba(0,0,0,.1)" />
          {ringing && <path d="M22 70 l-14 -8 M18 96 h-14 M218 70 l14 -8 M222 96 h14" stroke="#a1a1aa" strokeWidth="4" strokeLinecap="round" />}
          <g style={{ transformOrigin: "50% 60%", transformBox: "fill-box", animation: ringing ? "l-ring .12s linear infinite" : "none", transform: `scale(${1 + Math.min(hits, 2) * 0.06})` }}>
            <path d="M70 196 l-16 22 M170 196 l16 22" stroke="#52525b" strokeWidth="8" strokeLinecap="round" />
            <path d="M46 70 a30 30 0 0 1 52 -22 z M194 70 a30 30 0 0 0 -52 -22 z" fill="url(#bell)" stroke="#854d0e" strokeWidth="2" />
            <path d="M120 50 v-16" stroke="#52525b" strokeWidth="5" />
            <rect x="104" y="24" width="32" height="12" rx="6" fill="#71717a" />
            <circle cx="120" cy="128" r="80" fill="url(#abody)" />
            <circle cx="120" cy="128" r="64" fill="#fff" stroke="#fecdd3" strokeWidth="4" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              const r2 = i % 3 ? 50 : 46;
              return <line key={i} x1={120 + 54 * Math.sin(a)} y1={128 - 54 * Math.cos(a)} x2={120 + r2 * Math.sin(a)} y2={128 - r2 * Math.cos(a)} stroke="#27272a" strokeWidth={i % 3 ? 2 : 4} strokeLinecap="round" />;
            })}
            <line x1="120" y1="128" x2="120" y2="96" stroke="#18181b" strokeWidth="6" strokeLinecap="round" transform={`rotate(${ha} 120 128)`} />
            <line x1="120" y1="128" x2="120" y2="82" stroke="#18181b" strokeWidth="4" strokeLinecap="round" transform={`rotate(${ma} 120 128)`} />
            <circle cx="120" cy="128" r="6" fill="#e11d48" />
          </g>
          {!ringing && (
            <g fill="#a1a1aa" fontSize="18">
              <text x="60" y="40">✦</text>
              <text x="160" y="30">✦</text>
            </g>
          )}
        </svg>
      </button>
      <p className="text-body font-medium text-l-ink2">{MSGS[Math.min(hits, 3)]}</p>
    </div>
  );
}
