import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { StartupDev } from "@/application/services/startupStoryService";
import { ROOM_H, ROOM_W } from "./officeLayout";
import { NameTag, OfficePerson } from "./OfficePerson";
import { baristaCart, bossLayers, bossPalettes, box, breakArt, clawMachine, homelab, icons, person, wildLayers } from "./sprites";
import { Sprite } from "./Sprite";

type Prop = "console" | "claw" | "barista" | "mech" | "homelab";
type Spot = { x: number; y: number; seated: boolean };

const SPOTS: Spot[] = [
  { x: 28, y: 120, seated: true },
  { x: 56, y: 120, seated: true },
  { x: 176, y: 88, seated: true },
  { x: 118, y: 100, seated: false },
  { x: 266, y: 92, seated: false },
  { x: 320, y: 112, seated: false },
  { x: 80, y: 170, seated: false },
  { x: 230, y: 160, seated: false },
];

const gags: Record<Prop, { x: number; y: number; lines: string[]; icon?: keyof typeof icons }> = {
  console: { x: 40, y: 10, lines: ["RAGE QUIT. Controller thrown.", "Lag! It was lag!", "One more game. (It's 3am)"] },
  claw: { x: 118, y: 22, lines: ["So close... dropped it.", "The claw is rigged.", "Almost had the duck!"] },
  barista: { x: 176, y: 44, lines: ["Latte art: it's a bug.", "Oat milk ran out. Chaos.", "Triple shot for the on-call."], icon: "bug" },
  mech: { x: 232, y: 20, lines: ["The arm fell off. It's fine.", "Reactor (desk lamp) flickering.", "Duct tape: 100% load-bearing."] },
  homelab: { x: 320, y: 26, lines: ["Fire! ...out. It was the power strip.", "Uptime: 3 minutes.", "It's always DNS. Even at home."], icon: "flame" },
};

const BOSS_SPOT = { x: 168, y: 200 };

function Couch() {
  return <g>
    <Sprite grid={box(30, 5, "P")} x={12} y={100} />
    <Sprite grid={box(32, 7, "p")} x={10} y={108} />
  </g>;
}

function Patch({ stage }: { stage: number }) {
  const plant = stage <= 1 ? breakArt.sprout : stage === 2 ? breakArt.leafy : breakArt.chilli;
  return <g>
    {[3, 10, 17, 23].map((px) => <Sprite key={px} grid={plant} x={140 + px * 2} y={198 - plant.length * 2} />)}
    <Sprite grid={box(28, 6, "B")} x={140} y={196} />
  </g>;
}

function Boss() {
  const pal = bossPalettes.farmer;
  return <g style={{ transform: `translate(${BOSS_SPOT.x}px, ${BOSS_SPOT.y}px)` }}><g className="ss-breathe">
    <Sprite grid={person.body} pal={pal} x={-16} y={-48} />
    <Sprite grid={person.legs} pal={pal} x={-16} y={-8} />
    <Sprite grid={wildLayers.glasses} pal={pal} x={-16} y={-48} />
    {(["ngob", "phaKhaoMa", "hoe"] as const).map((layer) => <Sprite key={layer} grid={bossLayers[layer]} pal={pal} x={-16} y={-48} />)}
  </g></g>;
}

export function BreakRoom({ staff, bossVisiting, bossVisits, reduced }: { staff: StartupDev[]; bossVisiting: boolean; bossVisits: number; reduced: boolean }) {
  const [gag, setGag] = useState<{ prop: Prop; line: string; key: number } | null>(null);
  const claw = useMemo(clawMachine, []);
  const cart = useMemo(baristaCart, []);
  const lab = useMemo(homelab, []);
  useEffect(() => {
    if (!gag) return;
    const id = window.setTimeout(() => setGag(null), 2600);
    return () => window.clearTimeout(id);
  }, [gag]);

  const play = (prop: Prop) => {
    const pool = gags[prop].lines;
    const won = prop === "claw" && Math.random() < 0.1;
    setGag({ prop, line: won ? "WON a rubber duck!" : pool[Math.floor(Math.random() * pool.length)], key: Date.now() });
  };
  const tappable = (prop: Prop, label: string, node: ReactNode) =>
    <g role="button" tabIndex={0} aria-label={label} className="cursor-pointer outline-none focus-visible:opacity-80" onClick={() => play(prop)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(prop); } }}>{node}</g>;

  const placed = staff.slice(0, SPOTS.length).map((dev, i) => ({ dev, spot: SPOTS[i] }));
  const drawables: { y: number; node: ReactNode }[] = [
    { y: 82, node: tappable("claw", "Claw machine", <g>
      <Sprite grid={claw} x={100} y={24} />
      <Sprite grid={breakArt.claw} x={100} y={34} className={gag?.prop === "claw" && !reduced ? "ss-claw" : undefined} />
    </g>) },
    { y: 125, node: tappable("console", "Game console couch", <Couch />) },
    { y: 92, node: tappable("barista", "Barista cart", <Sprite key="cart" grid={cart} x={152} y={48} />) },
    { y: 70, node: tappable("mech", "Cardboard mech suit", <Sprite grid={breakArt.mech} x={216} y={24} className={gag?.prop === "mech" && !reduced ? "ss-jump" : undefined} />) },
    { y: 80, node: tappable("homelab", "Homelab shelf", <Sprite grid={lab} x={300} y={28} blink />) },
    { y: 208, node: <Patch key="patch" stage={Math.min(3, Math.max(1, bossVisits))} /> },
    ...(bossVisiting ? [{ y: BOSS_SPOT.y, node: <Boss key="boss" /> }] : []),
    ...placed.map(({ dev, spot }) => ({
      y: spot.y,
      node: <OfficePerson key={dev.id} dev={dev} x={spot.x} y={spot.y} seated={spot.seated} moving={false} working={false} tired={(dev.burnout ?? 0) >= 80}
        distracted={(dev.burnout ?? 0) >= 60} animate={!reduced} />,
    })),
  ].sort((a, b) => a.y - b.y);

  const bubble = gag ? gags[gag.prop] : null;
  return <>
    <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} className="ss-office block h-auto w-full" shapeRendering="crispEdges">
      <rect width={ROOM_W} height="76" fill="#bfe3f7" />
      <rect y="62" width={ROOM_W} height="8" fill="#7bc4a8" />
      <rect y="70" width={ROOM_W} height="6" fill="#8a5f3c" />
      {Array.from({ length: Math.ceil((ROOM_H - 76) / 12) }, (_, i) => <rect key={i} y={76 + i * 12} width={ROOM_W} height="12" fill={i % 2 ? "#e6c595" : "#dcb683"} />)}
      <Sprite grid={breakArt.tv} x={20} y={8} />
      <Sprite grid={breakArt.console} x={32} y={64} blink />
      {drawables.map((d, i) => <g key={i}>{d.node}</g>)}
      {placed.map(({ dev, spot }) => <NameTag key={dev.id} name={dev.name} x={spot.x} y={spot.y} animate={false} />)}
      {bossVisiting && <NameTag name="The Boss" x={BOSS_SPOT.x} y={BOSS_SPOT.y + 10} animate={false} />}
      {gag && bubble?.icon && <Sprite key={gag.key} grid={icons[bubble.icon]} x={bubble.x - 12} y={bubble.y + 14} className={reduced ? undefined : "ss-pop"} />}
    </svg>
    {gag && bubble && <span key={gag.key} role="status" className="pointer-events-none absolute z-10 max-w-[12rem] -translate-x-1/2 border-2 border-[#292542] bg-white px-2 py-0.5 text-xs font-bold text-[#292542]"
      style={{ left: `clamp(6rem, ${(bubble.x / ROOM_W) * 100}%, calc(100% - 6rem))`, top: `${(bubble.y / ROOM_H) * 100}%` }}>{gag.line}</span>}
  </>;
}
