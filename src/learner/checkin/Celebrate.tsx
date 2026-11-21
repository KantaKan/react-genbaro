import { useMemo } from "react";

const COLORS = ["#16a34a", "#f59e0b", "#6366f1", "#ec4899", "#0ea5e9", "#facc15"];

/** A short, light confetti burst. Renders nothing for reduced-motion users. */
export function Celebrate() {
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const bits = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const a = (i / 20) * Math.PI * 2 + Math.random() * 0.4;
        const d = 80 + Math.random() * 110;
        return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: Math.random() * 540, c: COLORS[i % COLORS.length], delay: Math.random() * 80 };
      }),
    []
  );
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      <style>{`@keyframes l-conf{to{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:0}}`}</style>
      {bits.map((b, i) => (
        <i
          key={i}
          className="absolute block h-3 w-2 rounded-sm"
          style={{
            background: b.c,
            ["--x" as string]: `${b.x}px`,
            ["--y" as string]: `${b.y}px`,
            ["--r" as string]: `${b.r}deg`,
            animation: `l-conf 1.2s cubic-bezier(.32,.72,0,1) ${b.delay}ms forwards`,
          }}
        />
      ))}
    </div>
  );
}
