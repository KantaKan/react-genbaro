import { useState } from "react";
import { createRoot } from "react-dom/client";
import type { CharacterDNA } from "@/application/services/baroCharacterService";
import { BaroCharacterArt } from "@/components/character/BaroCharacterArt";
import { BaroCharacter3D } from "@/components/character/BaroCharacter3D";
import "../index.css";

const examples: Array<{ title: string; dna: CharacterDNA; prop: string }> = [
  { title: "เพื่อนตัวนุ่ม", dna: { version: 1, body: "pebble", ears: "round", eyes: "wide", mark: "heart", palette: "Mint", pattern: "freckles", pattern_seed: 17431, rarity: "normal" }, prop: "flower" },
  { title: "ไข่ดาวหลงทาง", dna: { version: 1, body: "mushroom", ears: "cat", eyes: "spark", mark: "star", palette: "Berry", pattern: "egg", pattern_seed: 88891, rarity: "meme_rare" }, prop: "egg" },
  { title: "บั๊ก 404", dna: { version: 1, body: "boxy", ears: "antenna", eyes: "sleepy", mark: "stripe", palette: "Lagoon", pattern: "error404", pattern_seed: 13290, rarity: "meme_rare" }, prop: "cat-ears" },
  { title: "กลุ่มดาวในตำนาน", dna: { version: 1, body: "cloud", ears: "horn", eyes: "wide", mark: "moon", palette: "Lilac", pattern: "constellation", pattern_seed: 77290, rarity: "legendary" }, prop: "halo" },
];

export function Prototype() {
  const [selected, setSelected] = useState(0);
  const [webglLost, setWebglLost] = useState(false);
  const example = examples[selected];
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  return <main className="min-h-screen bg-[#f7f0e6] px-4 py-8 font-['Trebuchet_MS',sans-serif] text-[#292542] sm:px-8"><div className="mx-auto max-w-6xl"><p className="text-xs font-black uppercase tracking-[.2em] text-[#8b699d]">BARO CHARACTER · VISUAL CHECK</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">ตัวเดิม จากการ์ดสู่ 3D</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-[#5b5870]">หน้านี้ใช้ DNA และพร็อพชุดเดียวกันทั้งสองฝั่ง ลองเทียบรูปทรง หน้า หู สี และลายของตัวธรรมดา/ตัวแรร์ได้โดยไม่ต้องล็อกอิน</p><div className="mt-6 flex flex-wrap gap-2">{examples.map((item, index) => <button key={item.title} type="button" onClick={() => setSelected(index)} aria-pressed={selected === index} className={`min-h-11 rounded-full border-2 border-[#292542] px-4 text-sm font-black ${selected === index ? "bg-[#f4bd80] shadow-[3px_3px_0_#292542]" : "bg-white"}`}>{item.title}</button>)}</div><div className="mt-6 grid gap-5 md:grid-cols-2"><section className="overflow-hidden rounded-[28px] border-[3px] border-[#292542] bg-[#fffaf0] p-4 shadow-[5px_6px_0_#d5c9db]"><h2 className="text-lg font-black">การ์ด 2D</h2><div className="mx-auto mt-3 max-w-[280px]" style={{ height: 360 }}><BaroCharacterArt dna={example.dna} id={`prototype-${selected}`} prop={example.prop} /></div></section><section className="overflow-hidden rounded-[28px] border-[3px] border-[#292542] bg-[#e9e0f0] p-4 shadow-[5px_6px_0_#d5c9db]"><h2 className="text-lg font-black">ฟิกเกอร์ 3D</h2><div className="mt-3 overflow-hidden rounded-2xl" style={{ height: 360 }}>{webglLost ? <div className="mx-auto h-full max-w-[280px]"><BaroCharacterArt dna={example.dna} id={`prototype-fallback-${selected}`} prop={example.prop} /></div> : <BaroCharacter3D dna={example.dna} prop={example.prop} reducedMotion={reducedMotion} onContextLost={() => setWebglLost(true)} />}</div></section></div><p className="mt-5 font-mono text-xs font-bold">{example.dna.body} · {example.dna.ears} · {example.dna.eyes} · {example.dna.pattern} #{example.dna.pattern_seed} · {example.prop}</p></div></main>;
}

const prototypeRoot = createRoot(document.getElementById("root")!);
prototypeRoot.render(<Prototype />);
import.meta.hot?.dispose(() => prototypeRoot.unmount());
