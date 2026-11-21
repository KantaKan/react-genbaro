import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import type { CheckInControlProps } from "./types";

const KNOB = 54;
const PAD = 6;

export function SlideControl({ tone, disabled, busy, onComplete, skin }: CheckInControlProps & { skin?: "gold" }) {
  const track = useRef<HTMLDivElement>(null);
  const start = useRef<number | null>(null);
  const [dx, setDx] = useState(0);
  const gold = skin === "gold";
  const color = gold ? "#facc15" : tone === "late" ? "var(--l-amber)" : "var(--l-green)";
  const max = () => (track.current?.clientWidth ?? 360) - KNOB - PAD * 2;

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || busy) return;
    start.current = e.clientX - dx;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (start.current === null) return;
    setDx(Math.max(0, Math.min(max(), e.clientX - start.current)));
  };
  const up = () => {
    if (start.current === null) return;
    start.current = null;
    if (dx >= max() * 0.92) onComplete();
    setDx(0);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled && !busy) {
      e.preventDefault();
      onComplete();
    }
  };

  return (
    <div
      ref={track}
      className={`relative h-[66px] w-full max-w-[380px] select-none overflow-hidden rounded-full ${gold ? "bg-gradient-to-b from-stone-800 to-stone-950 shadow-[0_0_0_1.5px_#a16207,0_18px_40px_-16px_rgba(161,98,7,.6)]" : "bg-l-card shadow-[0_0_0_1px_var(--l-hair),0_10px_30px_-18px_rgba(0,0,0,.3)]"}`}
      style={{ touchAction: "none" }}
    >
      <div className="absolute inset-y-0 left-0 rounded-full opacity-[.14]" style={{ width: KNOB + PAD * 2 + dx, background: color }} />
      <div className={`absolute inset-0 grid place-items-center pl-11 text-[15px] font-semibold ${gold ? "text-amber-300" : "text-l-ink2"}`} style={{ opacity: 1 - dx / (max() || 1) }}>
        {busy ? "Checking you in…" : tone === "late" ? "Slide to check in · late" : "Slide to check in"}
      </div>
      <div
        role="slider"
        aria-label="Slide to check in"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((dx / (max() || 1)) * 100)}
        aria-disabled={disabled || busy}
        tabIndex={0}
        onKeyDown={key}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="absolute left-1.5 top-1.5 grid h-[54px] w-[54px] cursor-grab place-items-center rounded-full outline-none ring-offset-2 focus-visible:ring-2"
        style={{
          background: color,
          transform: `translateX(${dx}px)`,
          transition: start.current === null ? "transform .55s cubic-bezier(.34,1.56,.64,1)" : "none",
          boxShadow: `inset 0 1px 1px rgba(255,255,255,.35), 0 6px 14px -6px ${color}`,
        }}
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <ArrowRight className="h-[22px] w-[22px] text-white" strokeWidth={2.2} />}
      </div>
    </div>
  );
}
