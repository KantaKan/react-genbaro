import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A scroll area without the browser scrollbar: the edge that has more content fades out, a small
 * chevron says there's more below, and the current page's link is kept in view.
 */
export function ScrollFade({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ top: false, bottom: false });
  const { pathname } = useLocation();

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.scrollTop > 2;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    setEdge((e) => (e.top === top && e.bottom === bottom ? e : { top, bottom }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView?.({ block: "center" });
    update();
  }, [pathname, update]);

  const mask = `linear-gradient(to bottom, ${edge.top ? "transparent" : "#000"} 0, #000 32px, #000 calc(100% - 40px), ${edge.bottom ? "transparent" : "#000"} 100%)`;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={ref}
        onScroll={update}
        className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {children}
      </div>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-0 right-1 grid h-5 w-5 place-items-center rounded-full bg-l-card text-l-ink3 shadow-[0_0_0_1px_var(--l-hair),0_2px_6px_-2px_rgba(0,0,0,.2)] transition-opacity duration-200",
          edge.bottom ? "opacity-100" : "opacity-0"
        )}
      >
        <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
    </div>
  );
}
