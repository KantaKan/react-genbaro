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


function seeded(seed: number) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function Cloud({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}><ellipse rx="52" ry="14" /><circle cx="-18" cy="-8" r="16" /><circle cx="10" cy="-12" r="20" /><circle cx="32" cy="-4" r="12" /></g>;
}

function Sky({ p, phase, w, h, seed, motion }: { p: Palette; phase: DioramaPhase; w: number; h: number; seed: number; motion: boolean }) {
  const rand = seeded(seed);
  const clouds = Array.from({ length: 4 }, (_, i) => ({ x: (i + 0.3 + rand() * 0.5) * (w / 4), y: 22 + rand() * h * 0.1, s: 0.6 + rand() * 0.7 }));
  return <g>
    <defs><linearGradient id={`yard-sky-${seed}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.skyTop} /><stop offset="1" stopColor={p.skyBottom} /></linearGradient></defs>
    <rect width={w} height={h} fill={`url(#yard-sky-${seed})`} />
    {phase === "night" && <g className="yard-twinkle">{Array.from({ length: 46 }, () => ({ x: rand() * w, y: rand() * h * 0.45, r: rand() > 0.8 ? 2.6 : 1.4, d: rand() * 3 })).map((star, i) => <circle key={i} cx={star.x} cy={star.y} r={star.r} fill="#fff6d6" style={{ animationDelay: `${star.d}s` }} />)}<circle cx={w * 0.84} cy={h * 0.1} r="46" fill="#fff3c4" opacity=".12" /><path d={`M${w * 0.84} ${h * 0.1 - 26} A26 26 0 1 0 ${w * 0.84} ${h * 0.1 + 26} A19 26 0 1 1 ${w * 0.84} ${h * 0.1 - 26} Z`} fill="#fff3c4" /></g>}
    {phase === "evening" && <g><circle cx={w * 0.14} cy={h * 0.22} r="80" fill="#ffd48a" opacity=".22" /><circle cx={w * 0.14} cy={h * 0.22} r="38" fill="#ffc977" /></g>}
    {phase !== "night" && <g className={motion ? "yard-drift" : undefined} opacity={phase === "evening" ? 0.75 : 0.9}>{clouds.map((cloud, i) => <Cloud key={i} {...cloud} fill={phase === "evening" ? "#ffd9c7" : "#fffaf0"} />)}</g>}
    {phase === "morning" && <g fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" className={motion ? "yard-birds" : undefined}>{[0, 1, 2].map((i) => <path key={i} d={`M${w * (0.36 + i * 0.05)} ${h * (0.08 + (i % 2) * 0.03)} q6 -7 12 0 q6 -7 12 0`} />)}</g>}
  </g>;
}

function GrassTufts({ seed, w, left = 0, top, bottom, n = 36, color }: { seed: number; w: number; left?: number; top: number; bottom: number; n?: number; color: string }) {
  const rand = seeded(seed);
  return <g stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none">{Array.from({ length: n }, () => ({ x: left + rand() * w, y: top + rand() * (bottom - top), s: 0.7 + rand() * 0.6 })).map((tuft, i) => <path key={i} d={`M${tuft.x - 6 * tuft.s} ${tuft.y} l${3 * tuft.s} ${-9 * tuft.s} M${tuft.x} ${tuft.y} v${-12 * tuft.s} M${tuft.x + 6 * tuft.s} ${tuft.y} l${-3 * tuft.s} ${-9 * tuft.s}`} />)}</g>;
}

function Butterflies({ points, motion }: { points: Array<[number, number, string]>; motion: boolean }) {
  return <g>{points.map(([x, y, c], i) => <g key={i} transform={`translate(${x} ${y})`}><g className={motion ? "yard-flutter" : undefined} style={{ animationDelay: `${i * 0.7}s` }}><path d="M0 0 q-12 -14 -14 -2 q2 8 14 2 q12 -14 14 -2 q-2 8 -14 2" fill={c} stroke={ink} strokeWidth="1.8" /><path d="M0 -4 v8" stroke={ink} strokeWidth="2" /></g></g>)}</g>;
}

function FallingLeaves({ x, y, p, motion }: { x: number; y: number; p: Palette; motion: boolean }) {
  if (!motion) return null;
  return <g transform={`translate(${x} ${y})`}>{[0, 1, 2].map((i) => <path key={i} className="yard-leaf" style={{ animationDelay: `${i * 2.6}s` }} d={`M${-40 + i * 40} -150 q6 -8 12 0 q-6 8 -12 0 Z`} fill={i % 2 ? p.leaf : "#f2c46b"} stroke={ink} strokeWidth="1.5" />)}</g>;
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

function Fence({ p }: { p: Palette }) {
  const rand = seeded(17);
  return <g>{Array.from({ length: 26 }, (_, i) => {
    const top = 92 - rand() * 8;
    const tilt = rand() > 0.85 ? (rand() - 0.5) * 8 : 0;
    return <path key={i} transform={`rotate(${tilt} ${i * 40 + 14} 150)`} d={`M${i * 40} 150 V${top} l14 -14 l14 14 V150`} fill={p.fence} {...stroke} strokeWidth="2.5" opacity={rand() > 0.8 ? 0.85 : 1} />;
  })}</g>;
}

function Vines() {
  return <g><path d="M0 104 Q60 120 110 102 T230 108 M760 100 Q820 118 880 102 T1000 110" fill="none" stroke="#6fb382" strokeWidth="3" />{[[30, 110], [80, 110], [150, 104], [205, 106], [790, 106], [850, 110], [930, 104], [975, 108]].map(([x, y], i) => <g key={i}><ellipse cx={x} cy={y} rx="7" ry="4" fill="#8fcf92" transform={`rotate(${i * 40} ${x} ${y})`} /><circle cx={x + 5} cy={y - 5} r="3.5" fill={["#f6a6b8", "#fff1a8", "#c9b3f2"][i % 3]} stroke={ink} strokeWidth="1" /></g>)}</g>;
}

function Clothesline({ p }: { p: Palette }) {
  return <g {...stroke} strokeWidth="2.5"><path d="M430 150 V58 M610 150 V58" stroke={p.woodDark} strokeWidth="6" /><path d="M430 62 Q520 82 610 62" fill="none" strokeWidth="1.8" /><path d="M462 70 h28 l4 10 h-6 v24 h-24 v-24 h-6 Z" fill="#f49a8c" /><path d="M520 74 h14 v22 l10 6 -4 6 -18 -8 Z" fill="#fff1a8" /><rect x="560" y="70" width="26" height="30" rx="3" fill="#bfe3f2" /></g>;
}

function VeggiePatch({ x, y, p }: { x: number; y: number; p: Palette }) {
  return <g transform={`translate(${x} ${y})`}><rect x="-62" y="-18" width="124" height="30" rx="8" fill="#9a6b4f" {...stroke} /><g>{[-44, -18, 8, 34].map((dx, i) => <g key={dx} transform={`translate(${dx} -18)`}><path d="M0 0 q-10 -16 -2 -22 M0 0 q10 -16 2 -22 M0 0 v-18" stroke={p.leafDeep} strokeWidth="4" strokeLinecap="round" fill="none" />{i % 2 === 0 ? <path d="M-6 2 L0 14 L6 2 Z" fill="#f4973b" {...stroke} strokeWidth="1.5" /> : <circle cy="4" r="7" fill="#e2557a" {...stroke} strokeWidth="1.5" />}</g>)}</g></g>;
}

function WateringCan({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`} {...stroke} strokeWidth="2.5"><path d="M-14 0 V-22 H14 V0 Z" fill="#8fd3f0" /><path d="M14 -16 L30 -28" strokeWidth="4" /><path d="M-14 -18 Q-26 -14 -14 -4" fill="none" /></g>;
}

function Birdhouse({ x, y, p }: { x: number; y: number; p: Palette }) {
  return <g transform={`translate(${x} ${y})`} {...stroke}><path d="M0 0 V-70" stroke={p.woodDark} strokeWidth="6" /><path d="M-20 -70 V-100 H20 V-70 Z" fill={p.wood} /><path d="M-26 -98 L0 -122 L26 -98 Z" fill="#e8726a" /><circle cy="-86" r="6" fill={ink} /></g>;
}

function Gnome({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`} {...stroke} strokeWidth="2.5"><path d="M-14 0 Q-16 -20 0 -22 Q16 -20 14 0 Z" fill="#6f9fd8" /><path d="M-10 -22 Q-8 -34 0 -34 Q8 -34 10 -22 Q0 -12 -10 -22 Z" fill="#fffaf0" /><circle cy="-30" r="6" fill="#f6c5a4" /><path d="M-10 -34 L2 -58 L10 -34 Z" fill="#e2557a" /></g>;
}

function Mailbox({ x, y, p }: { x: number; y: number; p: Palette }) {
  return <g transform={`translate(${x} ${y})`} {...stroke}><path d="M0 0 V-50" stroke={p.woodDark} strokeWidth="6" /><path d="M-22 -50 V-72 Q0 -90 22 -72 V-50 Z" fill="#f49a8c" /><path d="M22 -70 v-18 h12 v8 h-12" fill="#fff1a8" strokeWidth="2" /></g>;
}

function Hedge({ p }: { p: Palette }) {
  const rand = seeded(29);
  return <g>{Array.from({ length: 13 }, (_, i) => ({ x: i * 80 + rand() * 30, s: 0.6 + rand() * 0.45, flower: rand() > 0.55 })).map((bush, i) => <g key={i}><Bush x={bush.x} y={140 + (1 - bush.s) * 20} p={p} s={bush.s} />{bush.flower && <circle cx={bush.x - 4} cy={140 - 30 * bush.s} r="4" fill={i % 2 ? "#f6a6b8" : "#fff1a8"} stroke={ink} strokeWidth="1.2" />}</g>)}</g>;
}

function StoneLantern({ x, y, p, lit }: { x: number; y: number; p: Palette; lit: boolean }) {
  return <g transform={`translate(${x} ${y})`} {...stroke}><rect x="-8" y="-40" width="16" height="40" fill="#b9b3c4" /><rect x="-20" y="-50" width="40" height="10" rx="3" fill="#a7a1b3" /><rect x="-14" y="-74" width="28" height="24" fill="#c9c4d3" /><rect x="-7" y="-68" width="14" height="12" fill={lit ? "#ffcf7a" : p.skyBottom} /><path d="M-26 -74 L0 -94 L26 -74 Z" fill="#a7a1b3" />{lit && <circle cy="-62" r="26" fill="#ffd98f" opacity=".25" stroke="none" />}</g>;
}

function KoiPond({ x, y, p }: { x: number; y: number; p: Palette }) {
  return <g transform={`translate(${x} ${y})`}><ellipse rx="112" ry="24" fill="#8fc8de" {...stroke} /><ellipse rx="96" ry="16" fill="#a9d8ea" /><path d="M-40 -4 q10 -6 18 0 q-8 6 -18 0 l-7 -5 v10 Z" fill="#f4973b" /><path d="M30 4 q10 -6 18 0 q-8 6 -18 0 l-7 -5 v10 Z" fill="#fffaf0" /><circle cx="36" cy="3" r="3" fill="#e2557a" /><ellipse cx="-78" cy="2" rx="14" ry="6" fill={p.leaf} {...stroke} strokeWidth="1.5" /><g fill="#b9b3c4" {...stroke} strokeWidth="2"><ellipse cx="-112" cy="10" rx="14" ry="8" /><ellipse cx="104" cy="12" rx="16" ry="8" /></g></g>;
}

function Planks({ seed, y, h }: { seed: number; y: number; h: number }) {
  const rand = seeded(seed);
  const rows = 3;
  return <g stroke={ink} strokeWidth="1.6" opacity=".3">{Array.from({ length: rows }, (_, r) => <g key={r}><path d={`M0 ${y + ((r + 1) * h) / rows} H1000`} />{Array.from({ length: 4 }, () => rand() * 1000).map((sx, i) => <path key={i} d={`M${sx} ${y + (r * h) / rows} v${h / rows}`} />)}</g>)}</g>;
}

function Bonsai({ x, y, p }: { x: number; y: number; p: Palette }) {
  return <g transform={`translate(${x} ${y})`} {...stroke}><path d="M-22 0 L-18 -14 H18 L22 0 Z" fill="#6b8fb8" /><path d="M0 -14 Q-10 -30 4 -42 Q14 -50 6 -60" fill="none" stroke={p.woodDark} strokeWidth="6" /><ellipse cx="-12" cy="-44" rx="16" ry="9" fill={p.leafDeep} /><ellipse cx="12" cy="-58" rx="18" ry="10" fill={p.leaf} /></g>;
}

function CatBowl({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`} {...stroke} strokeWidth="2.5"><path d="M-18 -8 H18 L14 4 H-14 Z" fill="#f49a8c" /><g fill="#b07f58" stroke="none"><circle cx="-6" cy="-10" r="3" /><circle cx="2" cy="-11" r="3" /><circle cx="9" cy="-10" r="3" /></g></g>;
}

function Eave({ p, phase, motion }: { p: Palette; phase: DioramaPhase; motion: boolean }) {
  return <g><path d="M0 0 H1000 V26 Q500 40 0 26 Z" fill={p.woodDark} {...stroke} /><path d="M0 16 H1000" stroke={ink} strokeWidth="2" opacity=".35" />{[170, 450, 700].map((x, i) => <g key={x} transform={`translate(${x} 30)`}><path d="M0 0 v22" stroke={ink} strokeWidth="1.8" /><g className={motion ? "yard-chime" : undefined} style={{ animationDelay: `${i * 0.8}s` }}><path d="M-12 36 Q-12 22 0 22 Q12 22 12 36 Z" fill={phase === "morning" ? "#dff1f7" : "#ffcf7a"} {...stroke} strokeWidth="2" /><path d="M-6 30 h4 M3 30 h4" stroke={["#e2557a", "#6fae6a", "#6b8fb8"][i]} strokeWidth="3" /><path d="M0 36 v10" stroke={ink} strokeWidth="1.5" /><rect x="-5" y="46" width="10" height="16" rx="2" fill="#fffaf0" stroke={ink} strokeWidth="1.5" /></g>{phase !== "morning" && <circle cy="30" r="24" fill="#ffd98f" opacity=".2" />}</g>)}</g>;
}

function Islet({ x, y, s, p }: { x: number; y: number; s: number; p: Palette }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M-70 0 Q-50 70 0 86 Q50 70 70 0 Z" fill={p.woodDark} {...stroke} /><ellipse rx="72" ry="24" fill={p.grass} {...stroke} /><Bush x={-20} y={2} p={p} s={0.8} /><Flowers x={30} y={0} /></g>;
}

function Waterfall({ x, y, motion }: { x: number; y: number; motion: boolean }) {
  return <g transform={`translate(${x} ${y})`}><path d="M-18 0 Q-24 120 -30 260 H24 Q20 120 16 0 Z" fill="#a9d8ea" stroke={ink} strokeWidth="2.5" opacity=".9" /><g stroke="#fffaf0" strokeWidth="3" strokeLinecap="round" className={motion ? "yard-fall" : undefined}>{[-10, 0, 9].map((dx, i) => <path key={i} d={`M${dx} ${10 + i * 20} v40 M${dx - 3} ${110 + i * 16} v40 M${dx - 6} ${200 + i * 10} v30`} />)}</g><ellipse cx="-2" cy="262" rx="44" ry="10" fill="#fffaf0" opacity=".85" /></g>;
}

const backdrops: Record<YardSceneId, (p: Palette, phase: DioramaPhase, motion: boolean) => ReactNode> = {
  backyard: (p, phase, motion) => <>
    <Sky p={p} phase={phase} w={1000} h={520} seed={11} motion={motion} />
    <Clothesline p={p} />
    <rect y="96" width="1000" height="60" fill={p.fence} />
    <Fence p={p} />
    <rect y="112" width="1000" height="8" fill={p.woodDark} opacity=".5" />
    <Vines />
    <path d="M0 150 H1000 V520 H0 Z" fill={p.grass} />
    <path d="M0 330 Q300 300 520 340 T1000 330 V520 H0 Z" fill={p.grassDeep} opacity=".45" />
    <Stones p={p} points={[[120, 490, 1.2], [180, 455, 1.1], [240, 420, 1], [300, 392, 0.95], [372, 370, 0.9], [450, 352, 0.85], [530, 330, 0.8], [590, 300, 0.7], [620, 262, 0.65], [635, 228, 0.6], [640, 196, 0.55], [640, 168, 0.5]]} />
    <Bush x={60} y={200} p={p} /><Bush x={960} y={196} p={p} s={1.1} /><Bush x={500} y={176} p={p} s={0.8} />
    <GrassTufts seed={3} w={1000} top={170} bottom={515} color={p.grassDeep} />
    <VeggiePatch x={70} y={494} p={p} />
    <WateringCan x={138} y={506} />
    <Birdhouse x={118} y={262} p={p} />
    <Gnome x={62} y={378} />
    <Mailbox x={978} y={268} p={p} />
    <Tree x={850} y={300} p={p} />
    <ellipse cx="850" cy="305" rx="120" ry="30" fill={ink} opacity=".1" />
    <FallingLeaves x={850} y={300} p={p} motion={motion} />
    <BenchBack x={700} y={330} p={p} />
    <Blanket x={500} y={430} p={p} />
    <PlayPatch x={840} y={452} p={p} />
    <ellipse cx="310" cy="296" rx="120" ry="18" fill={ink} opacity=".1" />
    <Flowers x={40} y={420} /><Flowers x={960} y={380} /><Flowers x={380} y={480} /><Flowers x={660} y={480} />
    {phase === "morning" && <Butterflies motion={motion} points={[[430, 214, "#f6a6b8"], [560, 380, "#fff1a8"], [120, 330, "#c9b3f2"]]} />}
    {phase !== "morning" && <Lanterns points={[[240, 246], [390, 246]]} />}
  </>,
  engawa: (p, phase, motion) => <>
    <Sky p={p} phase={phase} w={1000} h={560} seed={23} motion={motion} />
    <path d="M0 110 Q250 80 500 104 T1000 96 V560 H0 Z" fill={p.grassDeep} opacity=".6" />
    <path d="M0 130 H1000 V560 H0 Z" fill={p.grass} />
    <Hedge p={p} />
    <GrassTufts seed={7} w={1000} top={160} bottom={395} n={26} color={p.grassDeep} />
    <StoneLantern x={52} y={318} p={p} lit={phase !== "morning"} />
    <KoiPond x={850} y={368} p={p} />
    <Stones p={p} points={[[500, 380, 0.8], [470, 350, 0.72], [450, 320, 0.66], [460, 290, 0.6], [490, 262, 0.55], [520, 236, 0.5], [540, 210, 0.45], [548, 186, 0.4]]} />
    <Tree x={150} y={300} p={p} s={0.9} />
    <BenchBack x={820} y={300} p={p} />
    <PlayPatch x={620} y={250} p={p} rx={90} ry={30} />
    <ellipse cx="330" cy="318" rx="100" ry="15" fill={ink} opacity=".1" />
    <rect y="400" width="1000" height="160" fill={p.woodDark} />
    <rect y="400" width="1000" height="70" fill={p.wood} opacity=".9" />
    <Planks seed={5} y={400} h={70} />
    <path d="M0 400 H1000" stroke={ink} strokeWidth="4" />
    <Bonsai x={760} y={470} p={p} />
    <CatBowl x={940} y={478} />
    <g transform="translate(860 440)"><rect x="-44" y="-16" width="88" height="30" rx="12" fill="#c9b3f2" {...stroke} /></g>
    <g transform="translate(120 446)"><rect x="-40" y="-14" width="80" height="28" rx="12" fill="#f6c5a4" {...stroke} /></g>
    <Flowers x={60} y={380} /><Flowers x={930} y={370} /><Flowers x={700} y={380} />
    <Eave p={p} phase={phase} motion={motion} />
    {phase === "morning" && <Butterflies motion={motion} points={[[420, 220, "#fff1a8"], [700, 180, "#f6a6b8"]]} />}
  </>,
  island: (p, phase, motion) => <>
    <Sky p={p} phase={phase} w={1000} h={720} seed={37} motion={motion} />
    {phase === "morning" && <path d="M560 330 A260 260 0 0 1 1080 330" fill="none" stroke="url(#yard-rainbow)" strokeWidth="34" opacity=".45"><title>rainbow</title></path>}
    <defs><linearGradient id="yard-rainbow" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f8a0a0" /><stop offset=".33" stopColor="#f8cf7a" /><stop offset=".66" stopColor="#b5e3a1" /><stop offset="1" stopColor="#8fd3f0" /></linearGradient></defs>
    <Islet x={110} y={250} s={0.8} p={p} />
    <Islet x={900} y={170} s={0.6} p={p} />
    <path d="M150 262 Q170 330 196 392" fill="none" stroke={p.woodDark} strokeWidth="3" strokeDasharray="10 5" />
    <path d="M144 262 Q164 334 188 396" fill="none" stroke={ink} strokeWidth="1.5" opacity=".6" />
    <path d="M110 430 Q140 640 500 690 Q860 640 890 430 Z" fill={p.woodDark} {...stroke} />
    <Waterfall x={860} y={470} motion={motion} />
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
    <GrassTufts seed={9} w={560} left={220} top={330} bottom={540} n={22} color={p.grassDeep} />
    <FallingLeaves x={500} y={330} p={p} motion={motion} />
    {phase !== "night" && <g fill="#fffaf0" opacity=".9">{[[80, 650, 1.6], [300, 700, 1.9], [620, 705, 2], [900, 660, 1.7], [980, 610, 1.1]].map(([x, y, sc], i) => <Cloud key={i} x={x} y={y} s={sc} fill="#fffaf0" />)}</g>}
    {phase === "morning" && <Butterflies motion={motion} points={[[620, 300, "#f6a6b8"], [360, 470, "#c9b3f2"]]} />}
    {phase !== "morning" && <Lanterns points={[[230, 380], [360, 380], [640, 300]]} />}
  </>,
};

const fronts: Record<YardSceneId, (p: Palette) => Layer[]> = {
  backyard: (p) => [{ y: 290, node: <TableFront x={315} y={268} p={p} /> }, { y: 342, node: <BenchFront x={700} y={346} p={p} /> }],
  engawa: (p) => [
    { y: 312, node: <TableFront x={330} y={288} p={p} w={170} /> },
    { y: 316, node: <BenchFront x={820} y={318} p={p} /> },
    { y: 520, node: <g><rect y="470" width="1000" height="90" fill={p.woodDark} /><path d="M0 470 H1000" stroke={ink} strokeWidth="5" /><rect y="476" width="1000" height="84" fill={p.wood} opacity=".45" /><Planks seed={13} y={476} h={84} /></g> },
    { y: 790, node: <g>{[0, 952].map((x) => <g key={x} transform={`translate(${x} 0)`}><rect width="48" height="560" fill="#fffaf0" opacity=".92" {...stroke} />{Array.from({ length: 8 }, (_, i) => <path key={i} d={`M0 ${40 + i * 66} H48`} stroke={p.woodDark} strokeWidth="3" />)}<path d="M24 0 V560" stroke={p.woodDark} strokeWidth="3" /></g>)}</g> },
  ],
  island: (p) => [{ y: 426, node: <TableFront x={290} y={402} p={p} w={170} /> }, { y: 436, node: <BenchFront x={720} y={436} p={p} /> }],
};

export function YardBackdrop({ sceneId, phase, width, height, motion = false }: { sceneId: YardSceneId; phase: DioramaPhase; width: number; height: number; motion?: boolean }) {
  return <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" aria-hidden="true">{backdrops[sceneId](yardPalettes[phase], phase, motion)}</svg>;
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
