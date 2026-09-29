import { lazy, Suspense, useEffect, useState } from "react";
import { Box, X } from "lucide-react";
import type { ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { BaroCharacterArt } from "./BaroCharacterArt";

const BaroCharacter3D = lazy(() => import("./BaroCharacter3D").then((module) => ({ default: module.BaroCharacter3D })));

export function Character3DViewer({ entry, onClose }: { entry: ShowcaseEntry; onClose: () => void }) {
  const [supported, setSupported] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const available = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
      setSupported(available);
      setShow3D(available);
    } catch {
      setSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onClose]);

  const view3D = supported && show3D && !contextLost;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292542]/75 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label={`ดูตัวละครของ ${entry.name}`} className="w-full max-w-xl overflow-hidden rounded-[28px] border-[3px] border-[#292542] bg-[#fffaf0] text-[#292542] shadow-[8px_10px_0_#1d1934]">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#8b699d]">FROM THE CARD TO THE LAWN</p><h2 className="mt-1 text-xl font-black">คู่หูของ {entry.name}</h2><p className="mt-1 font-mono text-[10px] font-bold">{entry.character.serial}</p></div><button type="button" autoFocus onClick={onClose} aria-label="ปิดตัวละคร" className="rounded-full border-2 border-[#292542] bg-white p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><X className="h-5 w-5" /></button></div>
      <div className="relative mx-4 h-72 overflow-hidden rounded-[20px] border-2 border-[#292542] bg-[#e9e0f0] sm:h-96">
        {view3D ? <Suspense fallback={<div role="status" className="flex h-full items-center justify-center text-sm font-bold">กำลังปั้นคู่หู 3D…</div>}><BaroCharacter3D dna={entry.character.dna} prop={entry.prop} reducedMotion={reducedMotion} onContextLost={() => { setContextLost(true); setShow3D(false); }} /></Suspense> : <div className="mx-auto flex h-full w-56 items-center justify-center"><BaroCharacterArt dna={entry.character.dna} id={`lawn-preview-${entry.character.id}`} prop={entry.prop} /></div>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5"><div><p className="text-xs font-black">{entry.character.dna.rarity.replace("_", " ")} · {entry.character.dna.pattern}</p><p className="mt-1 text-xs text-[#5b5870]">{contextLost ? "การแสดงผล 3D หยุดทำงาน จึงกลับมาแสดงภาพ 2D" : supported ? reducedMotion ? "หมุนดูได้ · หยุดการขยับอัตโนมัติแล้ว" : "ลากเพื่อหมุนดูรอบตัว" : "เครื่องนี้แสดงภาพ 2D แทนได้ครบ"}</p></div><div className="flex rounded-full border-2 border-[#292542] bg-white p-1 text-xs font-black"><button type="button" aria-pressed={!view3D} onClick={() => setShow3D(false)} className={`min-h-9 rounded-full px-4 ${!view3D ? "bg-[#d4efe1]" : ""}`}>2D</button><button type="button" aria-pressed={view3D} onClick={() => setShow3D(true)} disabled={!supported || contextLost} className={`flex min-h-9 items-center gap-1 rounded-full px-4 disabled:opacity-40 ${view3D ? "bg-[#d4efe1]" : ""}`}><Box className="h-3.5 w-3.5" /> 3D</button></div></div>
    </section>
  </div>;
}
