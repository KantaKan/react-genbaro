/** 8 segments: ink up to 5, amber at 6, red at 7–8 (same thresholds as the learner side). */
export function LeaveMeter({ used, after, size = "sm" }: { used: number; after?: number; size?: "sm" | "md" }) {
  const top = after ?? used;
  const tone = (n: number) => (n >= 7 ? "bg-red-500" : n >= 6 ? "bg-amber-500" : "bg-l-ink2");
  return (
    <span className="inline-flex items-center gap-[2px] align-middle" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <i
          key={i}
          className={`block rounded-[2px] ${size === "md" ? "h-2 w-[18px]" : "h-3 w-[5px]"} ${i < used ? tone(top) : i < top ? `${tone(top)} opacity-50` : "bg-[var(--l-hair)]"}`}
        />
      ))}
    </span>
  );
}

export const warningText = (n: number) => (n >= 7 ? "final warning" : n >= 6 ? "2nd warning" : n >= 4 ? "1st warning" : "");
