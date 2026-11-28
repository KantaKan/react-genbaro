import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "react-query";
import { learnerApi } from "../api";
import { cupApi } from "../cup/api";
import { usePageHeader } from "../shell/LearnerShell";
import { slidesFor } from "./slideOrder";
import { SlideBody } from "./slides";
import type { Extras } from "./types";

const HIDE_KEY = "journey-hide-night";

function readHidden() {
  try {
    return localStorage.getItem(HIDE_KEY) === "1";
  } catch {
    return false;
  }
}

export function JourneyPage() {
  usePageHeader({ title: "Journey" });
  const journey = useQuery(["journey"], learnerApi.getJourney, { staleTime: 5 * 60_000 });
  const cup = useQuery(["my-cup"], cupApi.me, { retry: false });
  const [hideNight, setHideNight] = useState(readHidden);
  const [index, setIndex] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);

  const extras: Extras = { cupMedals: cup.data?.my_medals?.length ?? 0, baroName: null, hideNight };
  const j = journey.data;
  const slides = useMemo(() => (j ? slidesFor(j, extras) : []), [j, extras.cupMedals, extras.hideNight]); // eslint-disable-line react-hooks/exhaustive-deps
  const at = Math.min(index, Math.max(slides.length - 1, 0));
  const go = (d: number) => setIndex((i) => Math.max(0, Math.min(slides.length - 1, Math.min(i, slides.length - 1) + d)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const hide = () => {
    setHideNight(true);
    try {
      localStorage.setItem(HIDE_KEY, "1");
    } catch {
      /* private mode: hiding still works for this visit */
    }
  };

  if (journey.isLoading) return <div className="mx-auto aspect-[9/16] w-full max-w-[380px] animate-pulse rounded-[28px] bg-l-sub" />;
  if (journey.isError) return <p className="text-body text-l-ink2">โหลด Journey ไม่สำเร็จ ลองใหม่อีกครั้ง</p>;
  if (!j?.unlocked)
    return (
      <div className="mx-auto max-w-md rounded-2xl p-6 text-center shadow-[0_0_0_1px_var(--l-hair)]">
        <h2 className="text-title font-semibold">ยังไม่ถึงเวลา</h2>
        <p className="mt-1 text-body text-l-ink2">Journey ของคุณจะเปิดในวันจบคอร์ส</p>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-[380px]">
      <div
        ref={slideRef}
        data-journey-slide
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          go(e.clientX - r.left < r.width / 3 ? -1 : 1);
        }}
        className="relative aspect-[9/16] w-full cursor-pointer select-none overflow-hidden rounded-[28px] font-sans"
      >
        <SlideBody id={slides[at]} j={j} x={extras} onHideNight={hide} />
        <div className="pointer-events-none absolute inset-x-4 top-3 flex gap-1" aria-hidden>
          {slides.map((s, i) => (
            <i key={s} className="block h-[3px] flex-1 rounded-full bg-current" style={{ opacity: i <= at ? 0.9 : 0.25, color: "rgb(0 0 0 / .6)" }} />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-small text-l-ink3">
        <button type="button" onClick={() => go(-1)} disabled={at === 0} className="rounded-lg px-3 py-1.5 disabled:opacity-40">
          ‹ ก่อนหน้า
        </button>
        <span>{`${at + 1} / ${slides.length}`}</span>
        <button type="button" onClick={() => go(1)} disabled={at === slides.length - 1} className="rounded-lg px-3 py-1.5 disabled:opacity-40">
          ถัดไป ›
        </button>
      </div>
    </div>
  );
}
