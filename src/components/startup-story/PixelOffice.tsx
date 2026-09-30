import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { StartupDev } from "@/application/services/startupStoryService";
import { roleLook } from "./startupStoryCatalog";

type Station = { id: string; kind: "desk" | "sticky" | "kanban" | "whiteboard" | "rack"; x: number; y: number };

const stations: Station[] = [
  { id: "sticky", kind: "sticky", x: 34, y: 96 },
  { id: "kanban", kind: "kanban", x: 112, y: 96 },
  { id: "whiteboard", kind: "whiteboard", x: 190, y: 96 },
  { id: "rack", kind: "rack", x: 272, y: 96 },
  { id: "desk-1", kind: "desk", x: 40, y: 150 },
  { id: "desk-2", kind: "desk", x: 118, y: 150 },
  { id: "desk-3", kind: "desk", x: 196, y: 150 },
  { id: "desk-4", kind: "desk", x: 274, y: 150 },
];

const preferred: Record<string, Station["kind"]> = { po: "sticky", pm: "kanban", sa: "whiteboard", devops: "rack" };

function assignStations(staff: StartupDev[]) {
  const free = [...stations];
  const take = (pred: (s: Station) => boolean) => {
    const i = free.findIndex(pred);
    return i < 0 ? undefined : free.splice(i, 1)[0];
  };
  const placed = new Map<string, Station>();
  for (const dev of staff) {
    const want = preferred[dev.role ?? ""];
    const station = (want && take((s) => s.kind === want)) || take((s) => s.kind === "desk") || take(() => true);
    if (station) placed.set(dev.id, station);
  }
  return placed;
}

const skins = ["#f5d0b0", "#e8b48a", "#c98b5e", "#8d5a3b"];
const hairs = ["#2b2233", "#5a3825", "#c9772e", "#1d3557", "#7b2d5b", "#e0c068"];

const personX = (s: Station) => (s.kind === "desk" ? s.x : s.x + 16);

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function Person({ dev, station, busy }: { dev: StartupDev; station: Station; busy: boolean }) {
  const look = roleLook(dev.role);
  const h = hash(dev.name + dev.id);
  const skin = skins[h % skins.length];
  const hair = hairs[(h >> 3) % hairs.length];
  const seated = station.kind === "desk";
  const anim = busy ? look.anim : "ss-idle";
  const x = personX(station);
  const y = station.y;
  return <g transform={`translate(${x - 7} ${y - (seated ? 26 : 30)})`}>
    <g className={busy ? "ss-bob" : "ss-breathe"}>
      {!seated && <><rect x="3" y="22" width="3" height="8" fill="#2b2542" /><rect x="8" y="22" width="3" height="8" fill="#2b2542" /></>}
      <rect x="2" y="12" width="10" height="11" fill={look.color} />
      <rect x="0" y="0" width="14" height="12" fill={skin} />
      <rect x="0" y="0" width="14" height="4" fill={hair} />
      <rect x="0" y="0" width="2" height="7" fill={hair} />
      <rect x="4" y="6" width="2" height="2" fill="#292542" />
      <rect x="9" y="6" width="2" height="2" fill="#292542" />
      <rect x="-1" y="13" width="3" height="7" fill={look.color} className={anim} style={{ transformOrigin: "50% 0", transformBox: "fill-box" }} />
      <rect x="12" y="13" width="3" height="7" fill={look.color} className={anim === "ss-type" ? "ss-type-alt" : ""} style={{ transformOrigin: "50% 0", transformBox: "fill-box" }} />
      {dev.genmate_id && <text x="7" y="-2" fontSize="6" textAnchor="middle">🎓</text>}
    </g>
  </g>;
}

function Furniture({ station, busy }: { station: Station; busy: boolean }) {
  const { x, y, kind } = station;
  switch (kind) {
    case "desk":
      return <g>
        <rect x={x + 7} y={y - 24} width="14" height="10" fill="#292542" />
        <rect x={x + 8} y={y - 23} width="12" height="8" fill={busy ? "#7bc4a8" : "#3b3a55"} className={busy ? "ss-screen" : ""} />
        <rect x={x + 13} y={y - 14} width="2" height="3" fill="#292542" />
        <rect x={x - 22} y={y - 11} width="44" height="4" fill="#b98b5e" />
        <rect x={x - 20} y={y - 7} width="3" height="10" fill="#8a6440" />
        <rect x={x + 17} y={y - 7} width="3" height="10" fill="#8a6440" />
      </g>;
    case "sticky":
      return <g>
        <rect x={x - 22} y={y - 62} width="30" height="34" fill="#e9d6b3" stroke="#292542" strokeWidth="1" />
        {[["#fbe39a", 0, 0], ["#f7c6d9", 10, 2], ["#bfe3f7", 20, 0], ["#7bc4a8", 4, 12], ["#fbe39a", 15, 13], ["#cab2f1", 8, 23]].map(([c, dx, dy], i) =>
          <rect key={i} x={x - 20 + Number(dx)} y={y - 60 + Number(dy)} width="7" height="7" fill={String(c)} className={busy && i === 5 ? "ss-pop" : ""} style={{ transformBox: "fill-box", transformOrigin: "center" }} />)}
      </g>;
    case "kanban":
      return <g>
        <rect x={x - 26} y={y - 64} width="40" height="36" fill="#fffaf0" stroke="#292542" strokeWidth="1" />
        {[0, 13, 26].map((dx) => <rect key={dx} x={x - 25 + dx} y={y - 63} width="12" height="3" fill="#292542" opacity="0.2" />)}
        <rect x={x - 24} y={y - 58} width="9" height="5" fill="#f7c6d9" />
        <rect x={x - 24} y={y - 51} width="9" height="5" fill="#fbe39a" />
        <rect x={x - 11} y={y - 58} width="9" height="5" fill="#bfe3f7" className={busy ? "ss-slide" : ""} />
        <rect x={x + 2} y={y - 58} width="9" height="5" fill="#7bc4a8" />
      </g>;
    case "whiteboard":
      return <g>
        <rect x={x - 26} y={y - 64} width="40" height="30" fill="#ffffff" stroke="#292542" strokeWidth="1" />
        <rect x={x - 22} y={y - 59} width="9" height="6" fill="none" stroke="#2d9cdb" strokeWidth="1" />
        <rect x={x - 3} y={y - 59} width="9" height="6" fill="none" stroke="#2d9cdb" strokeWidth="1" />
        <rect x={x - 12} y={y - 46} width="9" height="6" fill="none" stroke="#e3683e" strokeWidth="1" />
        <path d={`M${x - 13} ${y - 56} H${x - 3} M${x - 8} ${y - 53} V${y - 46}`} stroke="#292542" strokeWidth="0.8" className={busy ? "ss-draw-line" : ""} />
        <rect x={x - 24} y={y - 34} width="36" height="2" fill="#8a8aa0" />
      </g>;
    case "rack":
      return <g>
        <rect x={x - 22} y={y - 66} width="18" height="40" fill="#3b3a55" stroke="#292542" strokeWidth="1" />
        {[0, 9, 18, 27].map((dy, i) => <g key={dy}>
          <rect x={x - 20} y={y - 63 + dy} width="14" height="6" fill="#292542" />
          <rect x={x - 9} y={y - 61 + dy} width="2" height="2" fill={i % 2 ? "#7bc4a8" : "#fbe39a"} className={busy ? `ss-led ss-led-${i}` : ""} />
        </g>)}
      </g>;
  }
}

const css = `
.ss-bob { animation: ss-bob 1.1s ease-in-out infinite; }
.ss-breathe { animation: ss-bob 3.2s ease-in-out infinite; }
.ss-type { animation: ss-type .28s steps(2) infinite; }
.ss-type-alt { animation: ss-type .28s steps(2) infinite .14s; }
.ss-point { animation: ss-point 1.4s ease-in-out infinite; }
.ss-draw { animation: ss-draw 1.8s ease-in-out infinite; }
.ss-note { animation: ss-point 2s ease-in-out infinite; }
.ss-test { animation: ss-draw 1s ease-in-out infinite; }
.ss-idle { }
.ss-screen { animation: ss-screen 1.2s steps(3) infinite; }
.ss-pop { animation: ss-pop 2s ease-out infinite; }
.ss-slide { animation: ss-slide 3s ease-in-out infinite; }
.ss-draw-line { stroke-dasharray: 30; animation: ss-dash 2.4s linear infinite; }
.ss-led { animation: ss-led 1s steps(2) infinite; }
.ss-led-1 { animation-delay: .25s; } .ss-led-2 { animation-delay: .5s; } .ss-led-3 { animation-delay: .75s; }
@keyframes ss-bob { 50% { transform: translateY(-1px); } }
@keyframes ss-type { 50% { transform: translateY(1.5px); } }
@keyframes ss-point { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(110deg); } }
@keyframes ss-draw { 0%,100% { transform: rotate(60deg); } 50% { transform: rotate(130deg); } }
@keyframes ss-screen { 0% { fill: #7bc4a8; } 50% { fill: #bfe3f7; } 100% { fill: #fbe39a; } }
@keyframes ss-pop { 0%,60% { transform: scale(0); } 75% { transform: scale(1.2); } 100% { transform: scale(1); } }
@keyframes ss-slide { 0%,20% { transform: translateX(0); } 60%,100% { transform: translateX(13px); } }
@keyframes ss-dash { from { stroke-dashoffset: 30; } to { stroke-dashoffset: 0; } }
@keyframes ss-led { 50% { opacity: .2; } }
@media (prefers-reduced-motion: reduce) { .ss-office * { animation: none !important; } }
`;

function useSpeech(staff: StartupDev[], busy: boolean, reduced: boolean) {
  const [lines, setLines] = useState<Record<string, string>>({});
  useEffect(() => {
    if (staff.length === 0) return;
    const say = () => {
      const dev = staff[Math.floor(Math.random() * staff.length)];
      const pool = busy ? roleLook(dev.role).lines : roleLook(dev.role).idle;
      const line = pool[Math.floor(Math.random() * pool.length)];
      setLines((prev) => ({ ...prev, [dev.id]: line }));
      window.setTimeout(() => setLines((prev) => (prev[dev.id] === line ? { ...prev, [dev.id]: "" } : prev)), reduced ? 4000 : 2200);
    };
    say();
    const id = window.setInterval(say, busy ? 1100 : 2600);
    return () => window.clearInterval(id);
  }, [staff, busy, reduced]);
  return lines;
}

export function PixelOffice({ staff, busy, skin }: { staff: StartupDev[]; busy: boolean; skin?: string }) {
  const reduced = Boolean(useReducedMotion());
  const placed = useMemo(() => assignStations(staff), [staff]);
  const lines = useSpeech(staff, busy, reduced);
  const rooftop = skin === "rooftop-bangkok";
  const wall = rooftop ? "#f7c6a3" : "#f4e3c3";

  return <figure className="relative overflow-hidden rounded-[22px] border-[4px] border-[#292542] shadow-[6px_7px_0_#292542]" aria-label={busy ? "Your team is working" : "Your office"}>
    <svg viewBox="0 0 320 180" className="ss-office block h-auto w-full" shapeRendering="crispEdges" role="img" aria-hidden="true">
      <style>{css}</style>
      <rect width="320" height="118" fill={wall} />
      <rect y="112" width="320" height="6" fill="#b98b5e" />
      <rect y="118" width="320" height="62" fill="#d9b48a" />
      {[0, 40, 80, 120, 160, 200, 240, 280].map((x) => <rect key={x} x={x} y="118" width="1" height="62" fill="#b98b5e" />)}
      <rect x="210" y="10" width="36" height="24" fill={rooftop ? "#f08a5d" : "#9fd3f0"} stroke="#292542" strokeWidth="1" />
      {[[213, 22, 6, 12], [220, 17, 5, 17], [226, 24, 7, 10], [234, 15, 4, 19], [239, 21, 6, 13]].map(([x, y, w, hgt]) => <rect key={x} x={x} y={y} width={w} height={hgt} fill="#6b6f8e" />)}
      <rect x="296" y="84" width="14" height="28" fill="#3b3a55" />
      <rect x="299" y="88" width="8" height="6" fill="#e3683e" />
      <text x="303" y="106" fontSize="7" textAnchor="middle">☕</text>
      <rect x="6" y="100" width="10" height="12" fill="#b98b5e" />
      <text x="11" y="100" fontSize="12" textAnchor="middle">🪴</text>
      {stations.filter((s) => s.kind !== "desk").map((s) => <Furniture key={s.id} station={s} busy={busy && [...placed.values()].includes(s)} />)}
      {staff.map((dev) => placed.get(dev.id) && <Person key={dev.id} dev={dev} station={placed.get(dev.id)!} busy={busy} />)}
      {stations.filter((s) => s.kind === "desk").map((s) => <Furniture key={s.id} station={s} busy={busy && [...placed.values()].includes(s)} />)}
    </svg>
    {staff.map((dev) => {
      const s = placed.get(dev.id);
      if (!s) return null;
      const left = `${(personX(s) / 320) * 100}%`;
      return <div key={dev.id}>
        <span className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-[#292542]/80 px-1.5 text-xs font-bold text-[#fffaf0]" style={{ left, top: `${((s.y + 4) / 180) * 100}%` }}>{dev.name}</span>
        {lines[dev.id] && <span className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl border-2 border-[#292542] bg-white px-2 py-0.5 text-xs font-bold text-[#292542] shadow-[2px_2px_0_#292542]" style={{ left, top: `${((s.y - (s.kind === "desk" ? 30 : 34)) / 180) * 100}%` }}>{lines[dev.id]}</span>}
      </div>;
    })}
  </figure>;
}
