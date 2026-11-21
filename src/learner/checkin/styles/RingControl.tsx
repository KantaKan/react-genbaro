import type { CheckInControlProps } from "../types";

/** Countdown ring: the arc shrinks toward the next cutoff; tap to check in. */
export default function RingControl({ tone, disabled, busy, onComplete, minutesLeft, deadline }: CheckInControlProps) {
  const color = tone === "late" ? "var(--l-amber)" : "var(--l-green)";
  const L = 2 * Math.PI * 84;
  const total = tone === "late" ? 75 : 45; // window lengths in minutes (late 9:15→10:30, on time 8:30→9:15)
  const frac = Math.max(0, Math.min(1, minutesLeft / total));
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onComplete}
      aria-label={`Tap to check in, ${minutesLeft} minutes until ${deadline}`}
      className="relative mx-auto grid h-[190px] w-[190px] place-items-center rounded-full transition-transform duration-300 active:scale-95"
    >
      <svg viewBox="0 0 190 190" width="190" height="190" className="absolute inset-0 -rotate-90">
        <circle cx="95" cy="95" r="84" fill="none" stroke="var(--l-hair)" strokeWidth="8" />
        <circle cx="95" cy="95" r="84" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${L * frac} ${L}`} style={{ transition: "stroke-dasharray .6s cubic-bezier(.32,.72,0,1)" }} />
      </svg>
      <span className="absolute inset-[17px] flex flex-col items-center justify-center rounded-full bg-l-card shadow-[0_0_0_1px_var(--l-hair),0_14px_30px_-14px_rgba(24,24,27,.25)]">
        <span className="text-[32px] font-semibold leading-none tracking-tighter">{minutesLeft}</span>
        <span className="text-[12px] text-l-ink3">min</span>
        <span className="mt-0.5 text-[12px] text-l-ink3">until {deadline}</span>
        <span className="mt-2 rounded-full px-3 py-1 text-[12px] font-semibold text-white" style={{ background: color }}>
          {busy ? "Checking…" : "Tap to check in"}
        </span>
      </span>
    </button>
  );
}
