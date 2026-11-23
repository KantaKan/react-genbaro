import { useRef, useState } from "react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

const N = 12;

export default function BubbleWrapControl({ disabled, busy, onComplete }: CheckInControlProps) {
  const [popped, setPopped] = useState<boolean[]>(() => Array(N).fill(false));
  const fired = useRef(false);
  const left = popped.filter((p) => !p).length;
  const pop = (i: number) => {
    if (popped[i] || disabled || busy) return;
    const next = popped.map((p, j) => p || j === i);
    setPopped(next);
    play("pop");
    if (next.every(Boolean) && !fired.current) {
      fired.current = true;
      onComplete();
    }
  };
  return (
    <div className="relative flex flex-col items-center gap-3">
      <span className="absolute right-0 top-0 rounded-full bg-l-card px-2.5 py-1 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">{left ? `${left} left` : "All popped!"}</span>
      <div className="mt-6 grid -rotate-2 grid-cols-4 gap-2.5 rounded-[18px] bg-gradient-to-br from-white/70 to-slate-200/50 p-4 shadow-[0_0_0_1px_rgba(148,163,184,.3),0_20px_40px_-24px_rgba(0,0,0,.35)] dark:from-white/10 dark:to-slate-500/10">
        {popped.map((p, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Pop bubble ${i + 1}`}
            onPointerDown={() => pop(i)}
            className="h-12 w-12 rounded-full transition-transform duration-150 active:scale-90 sm:h-14 sm:w-14"
            style={
              p
                ? { background: "radial-gradient(circle, rgba(226,232,240,.6), rgba(203,213,225,.5))", transform: "scale(.86)", clipPath: "polygon(10% 30%,30% 8%,55% 14%,80% 6%,94% 32%,88% 60%,96% 84%,64% 92%,40% 86%,14% 94%,6% 66%)" }
                : {
                    background: "radial-gradient(circle at 34% 30%, rgba(255,255,255,.95) 0 12%, rgba(255,255,255,.2) 24%, rgba(186,230,253,.35) 60%, rgba(148,163,184,.45))",
                    boxShadow: "inset -4px -6px 10px rgba(100,116,139,.25), inset 2px 3px 6px rgba(255,255,255,.9), 0 4px 8px -4px rgba(0,0,0,.2)",
                  }
            }
          />
        ))}
      </div>
      <p className="text-body font-medium text-l-ink2">Pop every bubble to check in</p>
    </div>
  );
}
