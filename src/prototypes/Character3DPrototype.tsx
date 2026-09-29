import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Box, Moon, ScanFace, Sparkles, Sun } from "lucide-react";
import type { CharacterDNA } from "@/application/services/baroCharacterService";
import { BaroCharacterArt } from "@/components/character/BaroCharacterArt";
import { BaroCharacter3D } from "@/components/character/BaroCharacter3D";
import "../index.css";

type Example = {
  title: string;
  note: string;
  dna: CharacterDNA;
  prop: string;
};

const examples: Example[] = [
  { title: "โมจิสวนหย่อม", note: "ชอบนั่งฟังเพื่อนเล่าเรื่อง", dna: { version: 1, body: "pebble", ears: "round", eyes: "wide", mark: "heart", palette: "Mint", pattern: "freckles", pattern_seed: 17431, rarity: "normal" }, prop: "flower" },
  { title: "ไข่ดาวหลงทาง", note: "มาถึงห้องก่อนเจ้าของทุกวัน", dna: { version: 1, body: "mushroom", ears: "cat", eyes: "spark", mark: "star", palette: "Berry", pattern: "egg", pattern_seed: 88891, rarity: "meme_rare" }, prop: "egg" },
  { title: "บั๊ก 404", note: "หา motivation ไม่เจอ แต่เจอ snack", dna: { version: 1, body: "boxy", ears: "antenna", eyes: "sleepy", mark: "stripe", palette: "Lagoon", pattern: "error404", pattern_seed: 13290, rarity: "meme_rare" }, prop: "pixel-glasses" },
  { title: "เส้นสุดท้าย", note: "บอกว่าอีกห้านาที ตั้งแต่ชั่วโมงก่อน", dna: { version: 1, body: "pebble", ears: "leaf", eyes: "oval", mark: "spots", palette: "Honey", pattern: "ramen", pattern_seed: 55021, rarity: "meme_rare" }, prop: "headphones" },
  { title: "มันบดนักคิด", note: "คิดลึก แต่ตอบในแชตว่า เค", dna: { version: 1, body: "cloud", ears: "round", eyes: "sleepy", mark: "heart", palette: "Berry", pattern: "potato", pattern_seed: 42069, rarity: "meme_rare" }, prop: "tiny-crown" },
  { title: "กลุ่มดาวในตำนาน", note: "เก็บทุกวันที่พยายามไว้บนตัว", dna: { version: 1, body: "cloud", ears: "horn", eyes: "wide", mark: "moon", palette: "Lilac", pattern: "constellation", pattern_seed: 77290, rarity: "legendary" }, prop: "halo" },
];

const rarityMeta = {
  normal: { label: "Everyday companion", chance: "83%", className: "bg-[hsl(var(--character-normal))] text-[hsl(var(--character-normal-foreground))]" },
  meme_rare: { label: "Meme rare", chance: "15%", className: "bg-[hsl(var(--character-meme))] text-[hsl(var(--character-meme-foreground))]" },
  legendary: { label: "Legendary", chance: "2%", className: "bg-[hsl(var(--character-legendary))] text-[hsl(var(--character-legendary-foreground))]" },
};

const traitLabels: Array<[keyof CharacterDNA, string]> = [
  ["body", "ทรงตัว"],
  ["ears", "หู"],
  ["eyes", "แววตา"],
  ["mark", "สัญลักษณ์"],
  ["pattern", "ลายประจำตัว"],
  ["palette", "ชุดสี"],
];

export function Prototype() {
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [webglLost, setWebglLost] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const example = examples[selected];
  const rarity = rarityMeta[example.dna.rarity];
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    setWebglLost(false);
  }, [selected]);

  return <main className="min-h-screen bg-background font-register-body text-foreground transition-colors">
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><ScanFace className="h-5 w-5" /></div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-muted-foreground">Generation Barometer</p><h1 className="text-lg font-bold tracking-tight">Companion registry</h1></div>
        </div>
        <button type="button" onClick={() => setDark((value) => !value)} aria-label={dark ? "ใช้ธีมสว่าง" : "ใช้ธีมมืด"} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-card-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
      </header>

      <div className="grid gap-6 py-6 lg:grid-cols-12">
        <aside className="order-2 lg:order-1 lg:col-span-3">
          <div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-primary">Specimen index</p><h2 className="mt-1 text-sm font-bold">คู่หูที่พบแล้ว</h2></div><span className="font-register-mono text-xs text-muted-foreground">06 / ∞</span></div>
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">{examples.map((item, index) => {
            const active = index === selected;
            return <button key={item.title} type="button" onClick={() => setSelected(index)} aria-pressed={active} className={`group grid min-h-20 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 rounded-xl border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-primary bg-primary/10" : "border-transparent hover:border-border hover:bg-card"}`}>
              <span className={`grid h-12 w-12 place-items-center overflow-hidden rounded-lg ${rarityMeta[item.dna.rarity].className}`}><span className="h-12 w-10"><BaroCharacterArt dna={item.dna} id={`index-${index}`} prop={item.prop} /></span></span>
              <span className="min-w-0"><span className="block truncate text-sm font-bold">{item.title}</span><span className="mt-1 block truncate font-register-mono text-[9px] uppercase text-muted-foreground">{item.dna.pattern} · #{String(item.dna.pattern_seed).slice(-3)}</span></span>
            </button>;
          })}</div>
        </aside>

        <section className="order-1 min-w-0 lg:order-2 lg:col-span-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-6 sm:px-7">
              <div><p className="font-register-mono text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">BARO / GEN-001 / {String(example.dna.pattern_seed).padStart(6, "0")}</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{example.title}</h2></div>
              <div className="flex rounded-xl border border-border bg-background p-1 text-xs font-bold">
                <button type="button" onClick={() => setMode("2d")} aria-pressed={mode === "2d"} className={`min-h-9 rounded-lg px-3 ${mode === "2d" ? "bg-foreground text-background" : "text-muted-foreground"}`}>2D</button>
                <button type="button" onClick={() => setMode("3d")} aria-pressed={mode === "3d"} className={`flex min-h-9 items-center gap-1 rounded-lg px-3 ${mode === "3d" ? "bg-foreground text-background" : "text-muted-foreground"}`}><Box className="h-3.5 w-3.5" /> 3D</button>
              </div>
            </div>

            <div className="character-prototype-stage relative mx-3 overflow-hidden rounded-2xl border border-border bg-secondary sm:mx-5">
              <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(hsl(var(--border)/.35)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/.35)_1px,transparent_1px)] [background-size:32px_32px]" />
              <div className="pointer-events-none absolute inset-x-[12%] bottom-10 h-16 rounded-[50%] bg-foreground/10 blur-xl" />
              <div className="relative mx-auto h-full max-w-lg">{mode === "2d" || webglLost ? <BaroCharacterArt dna={example.dna} id={`prototype-${selected}`} prop={example.prop} /> : <BaroCharacter3D dna={example.dna} prop={example.prop} reducedMotion={reducedMotion} onContextLost={() => setWebglLost(true)} />}</div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] shadow-sm ${rarity.className}`}>{rarity.label} · {rarity.chance}</span>
                <span className="rounded-lg bg-background/85 px-2.5 py-1.5 font-register-mono text-[9px] font-semibold text-muted-foreground backdrop-blur">{mode === "3d" ? "ลากเพื่อหมุนดู" : "ต้นแบบการ์ด"}</span>
              </div>
            </div>

            <div className="grid gap-3 px-5 py-5 sm:grid-cols-[1fr_auto] sm:px-7">
              <p className="text-sm leading-6 text-muted-foreground">“{example.note}”</p>
              <div className="flex items-center gap-2 font-register-mono text-[10px] text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" /> ONE OF A KIND</div>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-3" style={{ order: 3 }}>
          <div className="border-b border-border pb-5"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-primary">Identity passport</p><p className="mt-3 text-sm leading-6 text-muted-foreground">DNA จะไม่เปลี่ยนเมื่อแต่งตัวหรือเติบโต จึงจำได้ว่าเป็นคู่หูตัวเดิมเสมอ</p></div>
          <dl className="divide-y divide-border">{traitLabels.map(([key, label]) => <div key={key} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="truncate text-right font-register-mono text-xs font-semibold capitalize">{String(example.dna[key])}</dd></div>)}</dl>
          <div className="mt-5 border-y border-dashed border-border py-4">
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold">ของประจำตัว</span><span className="font-register-mono text-xs">{example.prop}</span></div>
            <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs font-bold">Pattern seed</span><span className="font-register-mono text-xs">#{example.dna.pattern_seed}</span></div>
          </div>
          <div className="mt-5 grid grid-cols-8 gap-1" aria-label="แถบรหัสประจำตัว">{Array.from({ length: 32 }, (_, index) => <span key={index} className={`h-5 ${((example.dna.pattern_seed >> index % 8) & 1) === 1 ? "bg-foreground" : "bg-border"}`} />)}</div>
          <p className="mt-2 text-right font-register-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Permanent student companion</p>
        </aside>
      </div>
    </div>
  </main>;
}

const prototypeRoot = createRoot(document.getElementById("root")!);
prototypeRoot.render(<Prototype />);
import.meta.hot?.dispose(() => prototypeRoot.unmount());
