import { useRef, type ReactNode } from "react";

/** Wraps every check-in style with a plain button for screen readers (they can't drag or hold). */
export function StyleFrame({ children, disabled, busy, onComplete }: { children: ReactNode; disabled: boolean; busy: boolean; onComplete: () => void }) {
  const firing = useRef(false);
  const fire = () => {
    if (disabled || busy || firing.current) return;
    firing.current = true;
    onComplete();
    queueMicrotask(() => (firing.current = false));
  };
  return (
    <div className="relative">
      {children}
      <button type="button" className="sr-only focus:not-sr-only focus:mt-3 focus:inline-block focus:rounded-full focus:bg-l-ink focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-l-card" onClick={fire} aria-disabled={disabled || busy}>
        Check in now
      </button>
    </div>
  );
}
