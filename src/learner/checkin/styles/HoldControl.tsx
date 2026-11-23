import { useEffect, useRef, useState } from "react";
import { Clock3 } from "lucide-react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

const MS = 900;

export default function HoldControl({ tone, disabled, busy, onComplete }: CheckInControlProps) {
  const [pressing, setPressing] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>();
  const color = tone === "late" ? "var(--l-amber)" : "var(--l-green)";
  useEffect(() => () => clearTimeout(t.current), []);
  const start = () => {
    if (disabled || busy || t.current) return; // a second finger doesn't start another timer
    setPressing(true);
    play("tick");
    t.current = setTimeout(() => {
      t.current = undefined;
      setPressing(false);
      onComplete();
    }, MS);
  };
  const stop = () => {
    clearTimeout(t.current);
    t.current = undefined;
    setPressing(false);
  };
  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      className="relative grid h-[66px] w-full max-w-[320px] select-none place-items-center overflow-hidden rounded-[18px] bg-zinc-900 text-title font-semibold text-white shadow-[0_14px_30px_-16px_rgba(0,0,0,.5)] transition-transform duration-300 active:scale-[.97] dark:bg-zinc-100 dark:text-zinc-900"
      style={{ touchAction: "none" }}
    >
      <span className="absolute inset-y-0 left-0" style={{ background: color, width: pressing ? "100%" : "0%", transition: pressing ? `width ${MS}ms linear` : "width .3s" }} />
      <span className="relative inline-flex items-center gap-2">
        <Clock3 className="h-5 w-5" strokeWidth={2} />
        {busy ? "Checking you in…" : "Hold to check in"}
      </span>
    </button>
  );
}
