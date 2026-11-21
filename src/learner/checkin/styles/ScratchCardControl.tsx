import { useEffect, useRef, useState } from "react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

const W = 340;
const H = 170;

/** Scratch the silver foil off a ticket. Without canvas support, a Reveal button does it. */
export default function ScratchCardControl({ tone, disabled, busy, onComplete }: CheckInControlProps) {
  const late = tone === "late";
  const cv = useRef<HTMLCanvasElement>(null);
  const [canvasOk, setCanvasOk] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const fired = useRef(false);
  const finish = () => {
    if (fired.current || disabled || busy) return;
    fired.current = true;
    setRevealed(true);
    onComplete();
  };
  useEffect(() => {
    let x: CanvasRenderingContext2D | null = null;
    try {
      x = cv.current?.getContext("2d") ?? null;
    } catch {
      x = null;
    }
    if (!x) return setCanvasOk(false);
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#e4e4e7");
    g.addColorStop(0.5, "#a1a1aa");
    g.addColorStop(1, "#d4d4d8");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) {
      x.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`;
      x.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }
    x.fillStyle = "rgba(63,63,70,.55)";
    x.font = "800 15px system-ui";
    x.textAlign = "center";
    x.fillText("✦  SCRATCH HERE  ✦", W / 2, 92);
    x.globalCompositeOperation = "destination-out";
    x.lineWidth = 36;
    x.lineCap = "round";
    x.lineJoin = "round";
  }, []);
  const last = useRef<[number, number] | null>(null);
  const moves = useRef(0);
  const at = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * H) / r.height];
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const x = cv.current?.getContext("2d");
    if (!last.current || !x) return;
    const p = at(e);
    x.beginPath();
    x.moveTo(...last.current);
    x.lineTo(...p);
    x.stroke();
    last.current = p;
    if (++moves.current % 6 === 0) play("tick");
    if (moves.current % 10 === 0) {
      const d = x.getImageData(0, 0, W, H).data;
      let clear = 0;
      for (let i = 3; i < d.length; i += 40) if (d[i] === 0) clear++;
      if (clear / (d.length / 40) > 0.55) finish();
    }
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative overflow-hidden rounded-[14px] bg-gradient-to-br from-amber-100 via-amber-200 to-pink-200 shadow-[0_20px_40px_-22px_rgba(0,0,0,.4)]"
        style={{ width: W, maxWidth: "100%", aspectRatio: `${W}/${H}` }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-zinc-900">
          <small className="text-[10px] font-bold tracking-[.2em] text-amber-800">BARO DAILY TICKET</small>
          <div className={`-rotate-6 rounded-[10px] border-[3px] border-current px-3.5 text-[34px] font-extrabold tracking-wide ${late ? "text-amber-700" : "text-green-700"}`}>{late ? "LATE" : "PRESENT"}</div>
          <small className="text-[10px] tracking-widest text-amber-800">{late ? "still counts, see you tomorrow" : "you win: a normal day of class"}</small>
        </div>
        {canvasOk && (
          <canvas
            ref={cv}
            width={W}
            height={H}
            className="absolute inset-0 h-full w-full cursor-grab transition-opacity duration-500"
            style={{ opacity: revealed ? 0 : 1, touchAction: "none" }}
            onPointerDown={(e) => {
              last.current = at(e);
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
            onPointerUp={() => (last.current = null)}
            onPointerMove={move}
          />
        )}
      </div>
      {canvasOk ? (
        <p className="text-[13px] font-medium text-l-ink2">Scratch the silver with your finger or mouse</p>
      ) : (
        <button type="button" onClick={finish} className="rounded-full bg-l-ink px-4 py-2 text-[13px] font-semibold text-l-card">
          Reveal
        </button>
      )}
    </div>
  );
}
