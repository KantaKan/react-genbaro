import type { ReactNode } from "react";
import type { LawnPhase, CatPose, YardItem } from "@/lib/lawn-planner";
import type { YardSceneId } from "@/lib/lawn-scenes";

type DioramaPhase = LawnPhase;
type Item = YardItem;
export interface Palette { skyTop: string; skyBottom: string; grass: string; grassDeep: string; path: string; wood: string; woodDark: string; fence: string; leaf: string; leafDeep: string; sand: string; cloth: string; tint: string; tintOpacity: number }
interface Layer { y: number; node: ReactNode }

const ink = "#292542";

const yardPalettes: Record<DioramaPhase, Palette> = {
  morning: { skyTop: "#bfe3f2", skyBottom: "#fdf1d8", grass: "#bfe0a4", grassDeep: "#9fcb88", path: "#f0e2c6", wood: "#d9a877", woodDark: "#b07f58", fence: "#f1d7b0", leaf: "#8fcf92", leafDeep: "#6fb382", sand: "#f5e3b8", cloth: "#f49a8c", tint: "#ffffff", tintOpacity: 0 },
  evening: { skyTop: "#b48ac7", skyBottom: "#f8c39a", grass: "#aec893", grassDeep: "#8fb07e", path: "#e9d2b3", wood: "#cf9a6b", woodDark: "#a2704d", fence: "#e7c29e", leaf: "#7fbc86", leafDeep: "#5f9f76", sand: "#eed3a8", cloth: "#ef8b7e", tint: "#ff9d5c", tintOpacity: 0.12 },
  night: { skyTop: "#1c2146", skyBottom: "#3b4274", grass: "#4f6f5c", grassDeep: "#3f5d4e", path: "#8d8398", wood: "#8a6a5a", woodDark: "#6b5048", fence: "#7a6f80", leaf: "#3f6f5c", leafDeep: "#2f5a4b", sand: "#8e8497", cloth: "#9a6679", tint: "#1b2150", tintOpacity: 0.28 },
};


function Sky({ p, phase, w, h }: { p: Palette; phase: DioramaPhase; w: number; h: number }) {
  return <g>
    <defs><linearGradient id="yard-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.skyTop} /><stop offset="1" stopColor={p.skyBottom} /></linearGradient></defs>
    <rect width={w} height={h} fill="url(#yard-sky)" />
    {phase === "night" && <g className="yard-twinkle">{Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 137) % w} cy={(i * 53) % (h * 0.8)} r={i % 3 ? 1.6 : 2.6} fill="#fff6d6" style={{ animationDelay: `${(i % 7) * 0.4}s` }} />)}<circle cx={w * 0.84} cy={h * 0.12} r="26" fill="#fff3c4" /><circle cx={w * 0.84 + 10} cy={h * 0.12 - 6} r="24" fill={p.skyTop} /></g>}
    {phase === "morning" && <g fill="#fffaf0" opacity=".9"><ellipse cx={w * 0.18} cy={h * 0.08} rx="46" ry="14" /><ellipse cx={w * 0.22} cy={h * 0.06} rx="30" ry="14" /><ellipse cx={w * 0.7} cy={h * 0.1} rx="54" ry="15" /><ellipse cx={w * 0.74} cy={h * 0.075} rx="30" ry="14" /></g>}
    {phase === "evening" && <circle cx={w * 0.15} cy={h * 0.2} r="36" fill="#ffd48a" opacity=".85" />}
  </g>;
}

const stroke = { stroke: ink, strokeWidth: 3.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function Tree({ x, y, p, s = 1 }: { x: number; y: number; p: Palette; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx="0" cy="8" rx="90" ry="22" fill={ink} opacity=".12" />
    <path d="M-16 6 Q-12 -60 -20 -110 L20 -110 Q12 -60 16 6 Z" fill={p.woodDark} {...stroke} />
    <g {...stroke}><circle cx="-55" cy="-140" r="52" fill={p.leafDeep} /><circle cx="50" cy="-145" r="55" fill={p.leafDeep} /><circle cx="0" cy="-185" r="62" fill={p.leaf} /><circle cx="-35" cy="-120" r="42" fill={p.leaf} /><circle cx="38" cy="-118" r="40" fill={p.leaf} /></g>
    <g fill="#f7a8a0"><circle cx="-20" cy="-190" r="6" /><circle cx="30" cy="-160" r="6" /><circle cx="-50" cy="-150" r="5" /></g>
  </g>;
}

function Bush({ x, y, p, s = 1 }: { x: number; y: number; p: Palette; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} {...stroke}><circle cx="-18" cy="-14" r="18" fill={p.leafDeep} /><circle cx="14" cy="-16" r="20" fill={p.leaf} /><circle cx="0" cy="-26" r="16" fill={p.leaf} /><g fill="#fff4c8" stroke="none"><circle cx="-10" cy="-24" r="3" /><circle cx="16" cy="-20" r="3" /></g></g>;
}

function Flowers({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>{[[0, 0, "#f6a6b8"], [14, 6, "#fff1a8"], [-12, 8, "#c9b3f2"]].map(([dx, dy, c], i) => <g key={i} transform={`translate(${dx} ${dy})`}><path d="M0 0 v10" stroke="#5f9f76" strokeWidth="2" /><circle r="5" fill={c as string} stroke={ink} strokeWidth="1.5" /></g>)}</g>;
}

function TableFront({ x, y, p, w = 190 }: { x: number; y: number; p: Palette; w?: number }) {
  return <g transform={`translate(${x} ${y})`} {...stroke}>
    <path d={`M${-w / 2 + 8} 18 L${-w / 2 + 16} 62 M${w / 2 - 8} 18 L${w / 2 - 16} 62`} stroke={p.woodDark} strokeWidth="9" fill="none" />
    <path d={`M${-w / 2 + 8} 18 L${-w / 2 + 16} 62 M${w / 2 - 8} 18 L${w / 2 - 16} 62`} fill="none" />
    <path d={`M${-w / 2} -14 L${w / 2} -14 L${w / 2 + 10} 18 L${-w / 2 - 10} 18 Z`} fill={p.cloth} />
    <path d={`M${-w / 2 + 30} -14 L${-w / 2 + 24} 18 M${-w / 2 + 70} -14 L${-w / 2 + 68} 18 M${w / 2 - 70} -14 L${w / 2 - 68} 18 M${w / 2 - 30} -14 L${w / 2 - 24} 18`} stroke="#fffaf0" strokeWidth="6" opacity=".7" />
    <rect x={-w / 2 - 10} y="18" width={w + 20} height="12" rx="4" fill={p.wood} />
    <g transform="translate(-20 -22)"><ellipse rx="16" ry="6" fill="#fffaf0" /><path d="M-8 -2 l8 -10 l8 10 Z" fill="#fffaf0" /><rect x="-6" y="-4" width="12" height="5" fill={ink} stroke="none" /></g>
    <g transform="translate(40 -24)"><rect x="-7" y="-12" width="14" height="16" rx="3" fill="#bfe3f2" /></g>
  </g>;
}

function BenchBack({ x, y, p }: { x: number; y: number; p: Palette }) {
  return <g transform={`translate(${x} ${y})`} {...stroke}><rect x="-80" y="-78" width="160" height="16" rx="5" fill={p.wood} /><rect x="-80" y="-58" width="160" height="14" rx="5" fill={p.wood} /><path d="M-66 -78 v50 M66 -78 v50" stroke={p.woodDark} strokeWidth="8" /></g>;
}
function BenchFront({ x, y, p }: { x: number; y: number; p: Palette }) {
  return <g transform={`translate(${x} ${y})`} {...stroke}><rect x="-86" y="-24" width="172" height="16" rx="5" fill={p.wood} /><path d="M-70 -8 v24 M70 -8 v24" stroke={p.woodDark} strokeWidth="9" /><path d="M-70 -8 v24 M70 -8 v24" fill="none" /></g>;
}

function Blanket({ x, y, p, w = 190, h = 70 }: { x: number; y: number; p: Palette; w?: number; h?: number }) {
  return <g transform={`translate(${x} ${y})`}><path d={`M${-w / 2 + 20} ${-h / 2} L${w / 2 + 10} ${-h / 2} L${w / 2 - 20} ${h / 2} L${-w / 2 - 10} ${h / 2} Z`} fill="#fffaf0" {...stroke} />{Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${-w / 2 + 20 + i * (w / 5)} ${-h / 2} L${-w / 2 - 10 + i * (w / 5)} ${h / 2}`} stroke={p.cloth} strokeWidth="14" opacity=".75" />)}{Array.from({ length: 3 }, (_, i) => <path key={i} d={`M${-w / 2 + 12 - i * 8} ${-h / 2 + 12 + i * 22} L${w / 2 + 4 - i * 8} ${-h / 2 + 12 + i * 22}`} stroke={p.cloth} strokeWidth="10" opacity=".55" />)}<path d={`M${-w / 2 + 20} ${-h / 2} L${w / 2 + 10} ${-h / 2} L${w / 2 - 20} ${h / 2} L${-w / 2 - 10} ${h / 2} Z`} fill="none" {...stroke} /></g>;
}

function PlayPatch({ x, y, p, rx = 120, ry = 42 }: { x: number; y: number; p: Palette; rx?: number; ry?: number }) {
  return <g transform={`translate(${x} ${y})`}><ellipse rx={rx} ry={ry} fill={p.sand} {...stroke} /><path d={`M${-rx + 30} 0 q14 -12 28 0 M${rx - 60} 10 q14 -12 28 0`} stroke={ink} strokeWidth="2" fill="none" opacity=".35" /><g transform={`translate(${rx - 40} ${-ry + 18})`}><circle r="13" fill="#f48670" {...stroke} /><path d="M-12 0 h24" stroke="#fffaf0" strokeWidth="3" /></g></g>;
}

function Stones({ points, p }: { points: Array<[number, number, number]>; p: Palette }) {
  return <g>{points.map(([x, y, s], i) => <ellipse key={i} cx={x} cy={y} rx={24 * s} ry={11 * s} fill={p.path} stroke={ink} strokeWidth="2.5" />)}</g>;
}

function Lanterns({ points }: { points: Array<[number, number]> }) {
  return <g>{points.map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}><path d="M0 -40 v14" stroke={ink} strokeWidth="2" /><rect x="-10" y="-26" width="20" height="26" rx="8" fill="#ffcf7a" stroke={ink} strokeWidth="2.5" /><circle r="30" cy="-13" fill="#ffd98f" opacity=".25" /></g>)}</g>;
}

export function Fireflies({ w, h, n = 14 }: { w: number; h: number; n?: number }) {
  return <g className="yard-fireflies">{Array.from({ length: n }, (_, i) => <circle key={i} cx={(i * 211) % w} cy={h * 0.3 + ((i * 97) % (h * 0.6))} r="3.2" fill="#fff6a0" style={{ animationDelay: `${(i % 5) * 0.6}s` }} />)}</g>;
}

const backdrops: Record<YardSceneId, (p: Palette, phase: DioramaPhase) => ReactNode> = {
  backyard: (p, phase) => <>
    <Sky p={p} phase={phase} w={1000} h={520} />
    <rect y="96" width="1000" height="60" fill={p.fence} />
    {Array.from({ length: 26 }, (_, i) => <path key={i} d={`M${i * 40} 150 V92 l14 -14 l14 14 V150`} fill={p.fence} {...stroke} strokeWidth="2.5" />)}
    <rect y="112" width="1000" height="8" fill={p.woodDark} opacity=".5" />
    <path d="M0 150 H1000 V520 H0 Z" fill={p.grass} />
    <path d="M0 330 Q300 300 520 340 T1000 330 V520 H0 Z" fill={p.grassDeep} opacity=".45" />
    <Stones p={p} points={[[120, 490, 1.2], [180, 455, 1.1], [240, 420, 1], [300, 392, 0.95], [372, 370, 0.9], [450, 352, 0.85], [530, 330, 0.8], [590, 300, 0.7], [620, 262, 0.65], [635, 228, 0.6], [640, 196, 0.55], [640, 168, 0.5]]} />
    <Bush x={60} y={200} p={p} /><Bush x={960} y={196} p={p} s={1.1} /><Bush x={500} y={176} p={p} s={0.8} />
    <Tree x={850} y={300} p={p} />
    <ellipse cx="850" cy="305" rx="120" ry="30" fill={ink} opacity=".1" />
    <BenchBack x={700} y={330} p={p} />
    <Blanket x={500} y={430} p={p} />
    <PlayPatch x={840} y={452} p={p} />
    <ellipse cx="310" cy="296" rx="120" ry="18" fill={ink} opacity=".1" />
    <Flowers x={40} y={420} /><Flowers x={960} y={380} /><Flowers x={380} y={480} /><Flowers x={660} y={480} />
    {phase !== "morning" && <Lanterns points={[[240, 246], [390, 246]]} />}
  </>,
  engawa: (p, phase) => <>
    <Sky p={p} phase={phase} w={1000} h={560} />
    <path d="M0 110 Q250 80 500 104 T1000 96 V560 H0 Z" fill={p.grassDeep} opacity=".6" />
    <path d="M0 130 H1000 V560 H0 Z" fill={p.grass} />
    {Array.from({ length: 14 }, (_, i) => <Bush key={i} x={i * 76 + 20} y={140} p={p} s={0.75} />)}
    <Stones p={p} points={[[500, 380, 0.8], [470, 350, 0.72], [450, 320, 0.66], [460, 290, 0.6], [490, 262, 0.55], [520, 236, 0.5], [540, 210, 0.45], [548, 186, 0.4]]} />
    <Tree x={150} y={300} p={p} s={0.9} />
    <BenchBack x={820} y={300} p={p} />
    <PlayPatch x={620} y={250} p={p} rx={90} ry={30} />
    <ellipse cx="330" cy="318" rx="100" ry="15" fill={ink} opacity=".1" />
    <rect y="400" width="1000" height="160" fill={p.woodDark} />
    {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${i * 90} 400 V470`} stroke={ink} strokeWidth="2" opacity=".35" />)}
    <rect y="400" width="1000" height="70" fill={p.wood} opacity=".9" />
    {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${i * 90 + 30} 402 V468`} stroke={ink} strokeWidth="2" opacity=".3" />)}
    <path d="M0 400 H1000" stroke={ink} strokeWidth="4" />
    <g transform="translate(860 440)"><rect x="-44" y="-16" width="88" height="30" rx="12" fill="#c9b3f2" {...stroke} /></g>
    <g transform="translate(120 446)"><rect x="-40" y="-14" width="80" height="28" rx="12" fill="#f6c5a4" {...stroke} /></g>
    <Flowers x={60} y={380} /><Flowers x={930} y={370} /><Flowers x={700} y={380} />
    {phase !== "morning" && <Lanterns points={[[40, 120], [960, 120], [500, 110]]} />}
  </>,
  island: (p, phase) => <>
    <Sky p={p} phase={phase} w={1000} h={720} />
    {phase !== "night" && <g fill="#fffaf0" opacity=".85"><ellipse cx="120" cy="560" rx="80" ry="22" /><ellipse cx="900" cy="600" rx="90" ry="24" /><ellipse cx="860" cy="220" rx="60" ry="16" /></g>}
    <path d="M110 430 Q140 640 500 690 Q860 640 890 430 Z" fill={p.woodDark} {...stroke} />
    <path d="M200 520 q20 60 10 110 M780 520 q-20 60 -10 110 M500 640 v40" stroke={p.leafDeep} strokeWidth="6" fill="none" />
    <ellipse cx="500" cy="430" rx="400" ry="185" fill={p.grass} {...stroke} />
    <ellipse cx="500" cy="470" rx="330" ry="120" fill={p.grassDeep} opacity=".35" />
    <Stones p={p} points={[[300, 560, 0.9], [360, 585, 0.9], [440, 600, 0.9], [520, 604, 0.9], [600, 596, 0.9], [676, 576, 0.85], [730, 546, 0.8]]} />
    <Tree x={500} y={330} p={p} s={1.05} />
    <BenchBack x={720} y={420} p={p} />
    <Blanket x={500} y={520} p={p} w={170} h={60} />
    <PlayPatch x={770} y={520} p={p} rx={80} ry={30} />
    <ellipse cx="290" cy="428" rx="100" ry="16" fill={ink} opacity=".1" />
    <Flowers x={200} y={470} /><Flowers x={820} y={440} /><Flowers x={620} y={330} /><Flowers x={380} y={320} />
    {phase !== "morning" && <Lanterns points={[[230, 380], [360, 380], [640, 300]]} />}
  </>,
};

const fronts: Record<YardSceneId, (p: Palette) => Layer[]> = {
  backyard: (p) => [{ y: 290, node: <TableFront x={315} y={268} p={p} /> }, { y: 342, node: <BenchFront x={700} y={346} p={p} /> }],
  engawa: (p) => [
    { y: 312, node: <TableFront x={330} y={288} p={p} w={170} /> },
    { y: 316, node: <BenchFront x={820} y={318} p={p} /> },
    { y: 520, node: <g><rect y="470" width="1000" height="90" fill={p.woodDark} /><path d="M0 470 H1000" stroke={ink} strokeWidth="5" />{Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 104 + 20} y="486" width="70" height="60" rx="6" fill={p.wood} opacity=".5" />)}</g> },
  ],
  island: (p) => [{ y: 426, node: <TableFront x={290} y={402} p={p} w={170} /> }, { y: 436, node: <BenchFront x={720} y={436} p={p} /> }],
};

export function YardBackdrop({ sceneId, phase, width, height }: { sceneId: YardSceneId; phase: DioramaPhase; width: number; height: number }) {
  return <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" aria-hidden="true">{backdrops[sceneId](yardPalettes[phase], phase)}</svg>;
}

export function YardFronts({ sceneId, phase, width, height }: { sceneId: YardSceneId; phase: DioramaPhase; width: number; height: number }) {
  return <>{fronts[sceneId](yardPalettes[phase]).map((layer, index) => <svg key={index} viewBox={`0 0 ${width} ${height}`} className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: layer.y }} aria-hidden="true">{layer.node}</svg>)}</>;
}

export function YardTint({ phase }: { phase: DioramaPhase }) {
  const palette = yardPalettes[phase];
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ zIndex: 800, background: palette.tint, opacity: palette.tintOpacity, mixBlendMode: "multiply" }} />;
}

export function HeldItem({ item }: { item: Item }) {
  const common = { stroke: ink, strokeWidth: 3, strokeLinejoin: "round" as const };
  if (item === "onigiri") return <svg viewBox="-20 -20 40 40"><path d="M0 -16 L16 12 H-16 Z" fill="#fffaf0" {...common} /><rect x="-8" y="2" width="16" height="10" fill={ink} /></svg>;
  if (item === "milk") return <svg viewBox="-20 -20 40 40"><path d="M-9 -8 L-4 -16 H4 L9 -8 V16 H-9 Z" fill="#fffaf0" {...common} /><rect x="-9" y="0" width="18" height="8" fill="#9cd7e8" /></svg>;
  if (item === "book") return <svg viewBox="-24 -20 48 40"><path d="M0 -10 Q-12 -16 -22 -12 V14 Q-12 10 0 16 Q12 10 22 14 V-12 Q12 -16 0 -10 Z" fill="#f4bd80" {...common} /><path d="M0 -10 V16" {...common} /></svg>;
  if (item === "pillow") return <svg viewBox="-24 -20 48 40"><rect x="-20" y="-12" width="40" height="24" rx="10" fill="#c9b3f2" {...common} /><path d="M-8 -12 V12 M8 -12 V12" stroke="#fffaf0" strokeWidth="3" /></svg>;
  return <svg viewBox="-20 -20 40 40"><circle r="13" fill="#f48670" {...common} /><path d="M-12 0 h24" stroke="#fffaf0" strokeWidth="3" /></svg>;
}

const catCoats = [
  { body: "#f6b56b", stripe: "#d98b42", belly: "#fff1dc" },
  { body: "#b8b3c4", stripe: "#8d879c", belly: "#f1eef6" },
  { body: "#fffaf0", stripe: "#f4a261", belly: "#fffaf0" },
];

export function CatArt({ pose, coat }: { pose: CatPose; coat: number }) {
  const c = catCoats[coat % catCoats.length];
  const face = (x: number, y: number, sleepy: boolean) => <g transform={`translate(${x} ${y})`}>
    <path d="M-26 -10 L-22 -38 L-6 -24 Z M26 -10 L22 -38 L6 -24 Z" fill={c.body} {...stroke} />
    <circle r="28" fill={c.body} {...stroke} />
    {coat === 2 && <path d="M-26 -8 Q-18 -30 0 -26 Q-6 -10 -26 -8 Z" fill="#6b5b53" />}
    <path d="M-8 -26 v8 M0 -28 v9 M8 -26 v8" stroke={c.stripe} strokeWidth="3" />
    {sleepy ? <path d="M-15 0 q6 5 12 0 M3 0 q6 5 12 0" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" /> : <g fill={ink}><circle cx="-10" cy="0" r="4" /><circle cx="10" cy="0" r="4" /></g>}
    <path d="M-4 8 q4 4 8 0" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="-17" cy="8" r="4" fill="#f6a6b8" opacity=".7" /><circle cx="17" cy="8" r="4" fill="#f6a6b8" opacity=".7" />
  </g>;
  if (pose === "loaf" || pose === "lap") return <svg viewBox="-60 -60 120 80" className="overflow-visible">
    <path className="yard-tail" d="M40 8 Q66 0 56 -22" fill="none" stroke={ink} strokeWidth="11" strokeLinecap="round" /><path className="yard-tail" d="M40 8 Q66 0 56 -22" fill="none" stroke={c.body} strokeWidth="6" strokeLinecap="round" />
    <ellipse cx="6" cy="0" rx="44" ry="22" fill={c.body} {...stroke} />
    <path d="M10 -18 v14 M22 -16 v12" stroke={c.stripe} strokeWidth="3" />
    {face(-26, -6, true)}
  </svg>;
  const beg = pose === "beg";
  return <svg viewBox="-50 -86 100 110" className="overflow-visible">
    <path className="yard-tail" d="M22 14 Q52 8 44 -24" fill="none" stroke={ink} strokeWidth="11" strokeLinecap="round" /><path className="yard-tail" d="M22 14 Q52 8 44 -24" fill="none" stroke={c.body} strokeWidth="6" strokeLinecap="round" />
    <path d="M-24 18 Q-30 -30 0 -34 Q30 -30 24 18 Z" fill={c.body} {...stroke} />
    <ellipse cx="0" cy="-2" rx="12" ry="16" fill={c.belly} />
    {beg ? <path d="M-14 -22 q-4 -12 4 -14 M14 -22 q4 -12 -4 -14" fill="none" stroke={ink} strokeWidth="9" strokeLinecap="round" /> : <path d="M-10 18 v-10 M10 18 v-10" stroke={ink} strokeWidth="3" />}
    {face(0, -52, false)}
  </svg>;
}
