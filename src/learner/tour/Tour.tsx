import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TourStep } from "./steps";

const PAD = 8;
const GAP = 12;
const PANEL_W = 320;
const PENDING = -2;

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
  const [index, setIndex] = useState(PENDING);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [panelH, setPanelH] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const closed = useRef(false);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const close = useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    onClose();
  }, [onClose]);

  const go = useCallback(
    (dir: 1 | -1) => {
      const i = nextIndex(stepsRef.current, index + dir, dir);
      if (i === -1) {
        if (dir === 1) close();
        return;
      }
      setIndex(i);
    },
    [index, close]
  );

  useLayoutEffect(() => {
    setIndex(nextIndex(stepsRef.current, 0, 1));
  }, []);

  useEffect(() => {
    if (index === -1) close();
  }, [index, close]);

  useLayoutEffect(() => {
    if (index < 0) return;
    findTarget(stepsRef.current[index].target)?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [index, reduce]);

  useLayoutEffect(() => {
    if (index < 0) return;
    const measure = () => {
      const el = findTarget(stepsRef.current[index].target);
      if (!el) {
        go(1);
        return;
      }
      setRect(el.getBoundingClientRect());
    };
    measure();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    ro?.observe(document.body);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [index, go]);

  useLayoutEffect(() => {
    if (panel.current) setPanelH(panel.current.offsetHeight);
  }, [rect, index]);

  const shown = rect !== null;
  useEffect(() => {
    if (shown) panel.current?.focus();
  }, [shown]);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    return () => before?.focus?.();
  }, []);

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

  if (index < 0 || !rect) return null;
  const step = steps[index];
  const last = nextIndex(steps, index + 1, 1) === -1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(PANEL_W, vw - 32);
  const h = panelH || 240;
  const below = rect.bottom + PAD + GAP + h + 16 <= vh || rect.top - PAD - GAP - h < 16;
  const place = below ? { top: `${Math.min(rect.bottom + PAD + GAP, vh - h - 16)}px` } : { bottom: `${vh - rect.top + PAD + GAP}px` };
  const left = Math.min(Math.max(16, rect.left), vw - width - 16);
  const motion = reduce ? "" : "transition-[width,height] duration-300";

  return createPortal(
    <div className="fixed inset-0 z-50">
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
        className="learner fixed rounded-2xl bg-l-card p-4 text-l-ink shadow-[var(--l-shadow)] outline-none"
        style={{ ...place, left: `${left}px`, width: `${width}px` }}
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
