import { useEffect, useRef, useState } from "react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

const STEP = 700; // ms per countdown number

/** Hold through 3-2-1 to launch; letting go early aborts. */
export default function RocketControl({ disabled, busy, onComplete }: CheckInControlProps) {
  const [count, setCount] = useState<number | null>(null);
  const [gone, setGone] = useState(false);
  const [msg, setMsg] = useState("Hold to launch");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => (timers.current.forEach(clearTimeout), (timers.current = []));
  useEffect(() => () => void clear(), []);
  const down = () => {
    if (gone || disabled || busy) return;
    setMsg("Hold… hold…");
    [3, 2, 1].forEach((n, i) => timers.current.push(setTimeout(() => (setCount(n), play("blip")), i * STEP)));
    timers.current.push(
      setTimeout(() => {
        setGone(true);
        setCount(null);
        setMsg("To the moon. And to class.");
        play("win");
        onComplete();
      }, 3 * STEP)
    );
  };
  const up = () => {
    if (gone || timers.current.length === 0) return;
    clear();
    if (count !== null) setMsg("Launch aborted. Hold for the full countdown.");
    setCount(null);
  };
  const lit = count !== null || gone;
  return (
    <div className="relative h-[300px] overflow-hidden rounded-2xl bg-[radial-gradient(120%_100%_at_50%_0%,#1e1b4b,#0b0a1a)]">
      <style>{`@keyframes l-wob{0%{transform:translate(-1px,0)}50%{transform:translate(1px,1px)}100%{transform:translate(-1px,0)}}@keyframes l-flick{from{transform:scaleY(.85)}to{transform:scaleY(1.15)}}@keyframes l-tw{50%{opacity:.2}}`}</style>
      {count !== null && <div className="pointer-events-none absolute inset-x-0 top-5 text-center text-[54px] font-extrabold text-white [text-shadow:0_0_30px_rgba(129,140,248,.8)]">{count}</div>}
      <button
        type="button"
        aria-label="Hold to launch"
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        className="absolute inset-0 grid select-none place-items-end justify-center"
        style={{ touchAction: "none" }}
      >
        <svg viewBox="0 0 300 300" width="260" height="260" aria-hidden className="overflow-visible">
          {Array.from({ length: 18 }, (_, i) => (
            <circle key={i} cx={(i * 67) % 300} cy={(i * 41) % 180} r={i % 3 ? 1.2 : 2} fill="#fff" style={{ animation: `l-tw 2s ease-in-out ${i * 0.13}s infinite` }} />
          ))}
          <rect x="70" y="284" width="160" height="14" rx="4" fill="#475569" />
          <g style={{ transform: gone ? "translateY(-520px)" : "none", transition: "transform 1.4s cubic-bezier(.55,0,.8,.4)", animation: count !== null ? "l-wob .1s linear infinite" : "none" }}>
            {lit && (
              <g style={{ transformBox: "fill-box", transformOrigin: "50% 0", animation: "l-flick .12s ease-in-out infinite alternate" }}>
                <path d="M134 252 q16 50 16 50 q0 0 16 -50z" fill="#facc15" />
                <path d="M142 252 q8 28 8 28 q0 0 8 -28z" fill="#fff" />
              </g>
            )}
            <path d="M120 232 l-30 26 v-40 l30 -20z M180 232 l30 26 v-40 l-30 -20z" fill="#e11d48" />
            <path d="M150 56 q38 50 30 176 h-60 q-8 -126 30 -176z" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" />
            <path d="M150 56 q20 26 27 60 h-54 q7 -34 27 -60z" fill="#e11d48" />
            <circle cx="150" cy="146" r="17" fill="#cbd5e1" />
            <circle cx="150" cy="146" r="12" fill="#38bdf8" />
            <rect x="128" y="232" width="44" height="14" rx="4" fill="#475569" />
            <text x="150" y="211" textAnchor="middle" fontSize="9" fontWeight="800" fill="#334155" letterSpacing=".1em">BARO-1</text>
          </g>
        </svg>
      </button>
      <p className="pointer-events-none absolute inset-x-0 top-3 text-center text-body font-medium text-indigo-200">{msg}</p>
    </div>
  );
}
