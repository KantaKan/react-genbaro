import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TourStep } from "./steps";

const PAD = 8;
const PANEL_W = 320;

function findTarget(name: string): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return all.find((el) => el.getClientRects().length > 0) ?? null;
}

function nextIndex(steps: TourStep[], from: number, dir: 1 | -1): number {
  for (let i = from; i >= 0 && i < steps.length; i += dir) {
    if (findTarget(steps[i].target)) return i;
  }
  return -1;
}

export function Tour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [index, setIndex] = useState(() => nextIndex(steps, 0, 1));
  const [rect, setRect] = useState<DOMRect | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closed = useRef(false);
  const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const close = useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    onClose();
  }, [onClose]);

  const go = useCallback(
    (dir: 1 | -1) => {
      const i = nextIndex(steps, index + dir, dir);
      if (i === -1) {
        if (dir === 1) close();
        return;
      }
      setIndex(i);
    },
    [steps, index, close]
  );

  useEffect(() => {
    if (index === -1) close();
  }, [index, close]);

  useLayoutEffect(() => {
    if (index === -1) return;
    const el = findTarget(steps[index].target);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    const measure = () => setRect(el.getBoundingClientRect());
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [index, steps, reduce]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.target instanceof HTMLButtonElement) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight" || e.key === "Enter") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, go]);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => before?.focus?.();
  }, []);

  if (index === -1 || !rect) return null;
  const step = steps[index];
  const last = nextIndex(steps, index + 1, 1) === -1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(PANEL_W, vw - 32);
  const below = rect.bottom + PAD + 12 + 200 < vh;
  const top = below ? rect.bottom + PAD + 12 : Math.max(16, rect.top - PAD - 12 - 200);
  const left = Math.min(Math.max(16, rect.left), vw - width - 16);
  const motion = reduce ? "" : "transition-all duration-300";

  return createPortal(
    <div className="learner fixed inset-0 z-50">
      <div
        data-tour-spotlight
        className={`pointer-events-none fixed rounded-2xl outline outline-2 outline-offset-2 outline-amber-500 shadow-[0_0_0_200vmax_rgb(24_20_14/0.58)] ${motion}`}
        style={{ top: `${rect.top - PAD}px`, left: `${rect.left - PAD}px`, width: `${rect.width + PAD * 2}px`, height: `${rect.height + PAD * 2}px` }}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        tabIndex={-1}
        className={`fixed rounded-2xl bg-l-card p-4 text-l-ink shadow-[var(--l-shadow)] outline-none ${motion}`}
        style={{ top: `${top}px`, left: `${left}px`, width: `${width}px` }}
      >
        <div className="text-small text-l-ink3">{`${index + 1} จาก ${steps.length}`}</div>
        <h2 id="tour-title" className="mt-1 text-heading font-semibold">{step.title}</h2>
        <p className="mt-1.5 text-body leading-relaxed text-l-ink2">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <button type="button" onClick={close} className="rounded-lg px-2 py-1.5 text-body text-l-ink3 hover:bg-l-sub hover:text-l-ink">
            ข้าม
          </button>
          <button type="button" onClick={() => go(1)} className="rounded-lg bg-l-ink px-4 py-2 text-body font-semibold text-l-card active:scale-95">
            {last ? "เริ่มใช้งาน" : "ถัดไป"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
