import { useRef, useState } from "react";
import type { CheckInControlProps } from "../types";
import { play } from "../sound";

const PIXEL = '"Press Start 2P", ui-monospace, SFMono-Regular, Menlo, monospace';

export default function ArcadeControl({ tone, disabled, busy, onComplete }: CheckInControlProps) {
  const [screenState, setScreen] = useState<"title" | "loading" | "clear">("title");
  const [bars, setBars] = useState(0);
  const [hint, setHint] = useState("PRESS START");
  const used = useRef(false);
  const start = () => {
    if (used.current || disabled || busy) return;
    used.current = true;
    setScreen("loading");
    play("blip");
    for (let i = 1; i <= 8; i++) setTimeout(() => (setBars(i), play("tick")), 150 * i);
    onComplete();
    setTimeout(() => {
      setScreen("clear");
      play("win");
    }, 1700);
  };
  return (
    <div className="mx-auto w-[330px] max-w-full">
      <div
        className="relative flex h-[190px] flex-col items-center justify-center gap-3 overflow-hidden rounded-[22px] bg-slate-950 text-center text-green-400 shadow-[0_0_0_10px_#27272a,0_0_0_12px_#3f3f46,0_24px_40px_-18px_rgba(0,0,0,.6)]"
        style={{ fontFamily: PIXEL }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,.35)_0_1px,transparent_1px_3px)]" />
        {screenState === "title" && (
          <>
            <div className="text-heading text-yellow-300 [text-shadow:3px_3px_0_#b91c1c]">BARO QUEST</div>
            <div className="animate-pulse text-micro">{hint}</div>
          </>
        )}
        {screenState === "loading" && (
          <>
            <div className="text-small text-yellow-300">PLAYER 1 READY</div>
            <div className="flex gap-1">
              {Array.from({ length: 8 }, (_, i) => (
                <i key={i} className="block h-4 w-4" style={{ background: i < bars ? "#4ade80" : "#14532d", boxShadow: i < bars ? "0 0 8px #4ade80" : "none" }} />
              ))}
            </div>
          </>
        )}
        {screenState === "clear" && (
          <>
            <div className="text-body text-green-400 [text-shadow:3px_3px_0_#14532d]">STAGE CLEAR!</div>
            <div className="text-[8px] text-yellow-300">{tone === "late" ? "+1 LATE · CONTINUE?" : "+1 STREAK"}</div>
          </>
        )}
      </div>
      <div className="mt-[18px] flex h-[74px] items-center justify-between rounded-[14px] bg-gradient-to-b from-zinc-700 to-zinc-900 px-5">
        <span aria-hidden className="relative h-11 w-11 rounded-full bg-[radial-gradient(circle,#27272a_50%,#09090b)]">
          <span className="absolute left-1/2 top-0 h-7 w-2 -translate-x-1/2 rounded bg-gradient-to-r from-zinc-500 to-zinc-300" />
          <span className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fca5a5,#dc2626_55%,#7f1d1d)]" />
        </span>
        <button type="button" onClick={start} className="rounded-full bg-yellow-400 px-3 py-2 text-[9px] text-yellow-950 shadow-[0_3px_0_#854d0e]" style={{ fontFamily: PIXEL }}>
          START
        </button>
        <span className="flex gap-2.5">
          {(["A", "B"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => (play("blip"), screenState === "title" && setHint(k === "A" ? "JUMP! (PRESS START)" : "BLOCK! (PRESS START)"))}
              className={`h-9 w-9 rounded-full text-[9px] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,.3),0_3px_0_#09090b] active:translate-y-[3px] ${k === "A" ? "bg-red-500" : "bg-blue-500"}`}
              style={{ fontFamily: PIXEL }}
            >
              {k}
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}
