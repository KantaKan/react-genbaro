import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Moon, Sparkles, Sun } from "lucide-react";
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
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const example = examples[selected];
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return <main className="min-h-screen bg-background px-4 py-8 font-register-body text-foreground transition-colors sm:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-primary"><Sparkles className="h-4 w-4" /> BARO CHARACTER · VISUAL CHECK</p><h1 className="mt-3 font-register-heading text-4xl leading-tight sm:text-5xl">คู่หูคนเดิม ในทุกมิติ</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">ใช้ DNA และพร็อพชุดเดียวกันทั้งการ์ดกับโมเดล 3D เพื่อให้คู่หูยังดูเป็นตัวเดิมเสมอ</p></div>
        <button type="button" onClick={() => setDark((value) => !value)} aria-label={dark ? "ใช้ธีมสว่าง" : "ใช้ธีมมืด"} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-card-foreground shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
      </div>
      <div className="mt-7 flex flex-wrap gap-2">{examples.map((item, index) => <button key={item.title} type="button" onClick={() => setSelected(index)} aria-pressed={selected === index} className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected === index ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:bg-secondary"}`}>{item.title}</button>)}</div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm"><p className="text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">COLLECTIBLE CARD</p><h2 className="mt-1 font-register-heading text-2xl">การ์ด 2D</h2><div className="mx-auto mt-3 max-w-[280px]" style={{ height: 360 }}><BaroCharacterArt dna={example.dna} id={`prototype-${selected}`} prop={example.prop} /></div></section>
        <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm"><p className="text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">LAWN FIGURE</p><h2 className="mt-1 font-register-heading text-2xl">ฟิกเกอร์ 3D</h2><div className="mt-3 overflow-hidden rounded-xl border border-border bg-secondary" style={{ height: 360 }}>{webglLost ? <div className="mx-auto h-full max-w-[280px]"><BaroCharacterArt dna={example.dna} id={`prototype-fallback-${selected}`} prop={example.prop} /></div> : <BaroCharacter3D dna={example.dna} prop={example.prop} reducedMotion={reducedMotion} onContextLost={() => setWebglLost(true)} />}</div></section>
      </div>
      <p className="mt-5 rounded-xl border border-border bg-muted px-4 py-3 font-register-mono text-xs text-muted-foreground">{example.dna.body} · {example.dna.ears} · {example.dna.eyes} · {example.dna.pattern} #{example.dna.pattern_seed} · {example.prop}</p>
    </div>
  </main>;
}

const prototypeRoot = createRoot(document.getElementById("root")!);
prototypeRoot.render(<Prototype />);
import.meta.hot?.dispose(() => prototypeRoot.unmount());
