import { useState } from "react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

const TEASES = ["Catch me!", "Almost!", "So close…", "Okay, you got me."];

/** On time it plays catch-me for three dodges; late, it is a plain button with a kind word. */
export default function RunawayControl({ tone, disabled, busy, onComplete }: CheckInControlProps) {
  const late = tone === "late";
  const playful = !late;
  const [n, setN] = useState(0);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const dodge = () => {
    if (!playful || n >= 3) return;
    const next = n + 1;
    setN(next);
    setPos({ x: 18 + Math.random() * 64, y: 22 + Math.random() * 52 });
    play("blip");
  };
  const say = late ? "No rush. Glad you made it." : n === 0 ? "Good morning!" : TEASES[n === 3 ? 3 : n - 1];
  return (
    <div className="relative h-[220px] overflow-hidden rounded-2xl bg-l-sub">
      <span
        className="absolute -translate-x-1/2 -translate-y-[210%] whitespace-nowrap rounded-xl bg-l-card px-2.5 py-1 text-[12.5px] font-semibold shadow-[0_0_0_1px_var(--l-hair)] transition-all duration-300"
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      >
        {say}
      </span>
      <button
        type="button"
        disabled={disabled || busy}
        onPointerEnter={dodge}
        onClick={() => (playful && n < 3 ? dodge() : onComplete())}
        className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.15),0_12px_24px_-10px_rgba(0,0,0,.45)]"
        style={{ left: `${pos.x}%`, top: `${pos.y}%`, transition: "left .38s cubic-bezier(.34,1.56,.64,1), top .38s cubic-bezier(.34,1.56,.64,1)" }}
      >
        Check in
        <span aria-hidden className="ml-2 inline-flex gap-1 align-middle">
          <i className="block h-2 w-2 rounded-full bg-white" />
          <i className="block h-2 w-2 rounded-full bg-white" />
        </span>
        {playful && n >= 3 && <i aria-hidden className="absolute -top-2 right-3 block h-3 w-2 animate-bounce rounded-full bg-sky-300" />}
      </button>
    </div>
  );
}
