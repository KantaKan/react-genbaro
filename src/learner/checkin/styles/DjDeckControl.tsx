import { useRef, useState } from "react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

const NEED = 720; // degrees of scratching

/** Spin the record in circles; two full turns drop the beat. */
export default function DjDeckControl({ disabled, busy, onComplete }: CheckInControlProps) {
  const [rot, setRot] = useState(0);
  const [acc, setAcc] = useState(0);
  const [dropped, setDropped] = useState(false);
  const last = useRef<number | null>(null);
  const total = useRef(0);
  const tick = useRef(0);
  const angle = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  const down = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dropped || disabled || busy) return;
    last.current = angle(e);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (last.current === null || dropped) return;
    const a = angle(e);
    let d = a - last.current;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    last.current = a;
    total.current += Math.abs(d);
    setRot((r) => r + d);
    setAcc(total.current);
    if (total.current - tick.current > 30) {
      tick.current = total.current;
      play("tick");
    }
    if (total.current >= NEED) {
      setDropped(true);
      last.current = null;
      play("win");
      onComplete();
    }
  };
  const frac = Math.min(1, acc / NEED);
  return (
    <div className="flex flex-col items-center gap-2">
      <style>{`@keyframes l-spin{to{transform:rotate(360deg)}}@keyframes l-eq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(2.4)}}`}</style>
      <div className="relative flex h-[220px] w-[300px] max-w-full items-center gap-4 rounded-[20px] bg-gradient-to-b from-zinc-700 to-zinc-900 px-4 shadow-[0_0_0_1px_#52525b]">
        <button
          type="button"
          aria-label="Scratch the record"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={() => (last.current = null)}
          className="relative grid h-[184px] w-[184px] shrink-0 cursor-grab place-items-center rounded-full bg-zinc-600"
          style={{ touchAction: "none" }}
        >
          <svg viewBox="0 0 200 200" className="absolute -inset-2.5 h-[204px] w-[204px] -rotate-90" aria-hidden>
            <circle cx="100" cy="100" r="96" fill="none" stroke="#ec4899" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${frac * 603} 700`} />
          </svg>
          <span
            className="relative grid h-[172px] w-[172px] place-items-center rounded-full bg-[radial-gradient(circle,#27272a,#09090b_90%,#27272a)]"
            style={{ transform: dropped ? undefined : `rotate(${rot}deg)`, animation: dropped ? "l-spin .8s linear infinite" : "none" }}
          >
            {[150, 132, 114, 96].map((d) => (
              <i key={d} className="absolute rounded-full border border-zinc-700" style={{ width: d, height: d }} />
            ))}
            <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-pink-500 text-[8px] font-extrabold tracking-widest text-white">BARO</span>
          </span>
        </button>
        <div className="flex h-full flex-1 flex-col justify-end pb-6">
          <div className="flex items-end gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <i key={i} className="block h-3.5 w-1.5 origin-bottom rounded-sm bg-pink-500" style={{ animation: dropped ? `l-eq ${0.3 + i * 0.05}s ease-in-out infinite` : "none" }} />
            ))}
          </div>
        </div>
      </div>
      <p className="text-body font-medium text-l-ink2">{dropped ? "DROP THE BEAT" : "Scratch the record in circles to drop the beat"}</p>
    </div>
  );
}
