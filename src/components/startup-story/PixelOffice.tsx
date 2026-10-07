import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import type { StartupDeskPrices, StartupDev, StartupInfra, StartupItem } from "@/application/services/startupStoryService";
import { baht, comebackLines, deskUpgrade, isSassy, nextDeskPrice, roleLook, sassLine, ui } from "./startupStoryCatalog";
import { assignStations, deskSlots, hangoutSpots, levelUps, ROOM_H, ROOM_W, standupSpots, TABLE, TIRED_AT, DISTRACTED_AT, type Spot } from "./office/officeLayout";
import { Desk, MeetingTable, RoomBackdrop, Sofa } from "./office/OfficeRoom";
import { NameTag, OfficePerson } from "./office/OfficePerson";
import { BreakRoom } from "./office/BreakRoom";
import { Sprite } from "./office/Sprite";
import { block, icons, type IconName } from "./office/sprites";
import { looksFor } from "./office/looks";
import type { ReactionIcon } from "./office/sprites";

export type OfficeReaction = { kind: "party" | "panic"; key: number };

const css = `
.ss-bob { animation: ss-bob 1.1s ease-in-out infinite; }
.ss-breathe { animation: ss-bob 3.2s ease-in-out infinite; }
.ss-walk-bob { animation: ss-bob .35s ease-in-out infinite; }
.ss-jump { animation: ss-jump .5s ease-out 3; }
.ss-step-a { animation: ss-step .36s steps(1) infinite; }
.ss-step-b { animation: ss-step .36s steps(1) infinite -.18s; }
.ss-pop { animation: ss-pop 2s ease-out infinite; transform-box: fill-box; transform-origin: center; }
.ss-slide { animation: ss-slide 3s ease-in-out infinite; }
.ss-led { animation: ss-led 1s steps(2) infinite; }
.ss-claw { animation: ss-claw 1.6s steps(4); }
@keyframes ss-claw { 50% { transform: translateY(28px); } }
@keyframes ss-bob { 50% { transform: translateY(-1px); } }
@keyframes ss-jump { 40% { transform: translateY(-7px); } }
@keyframes ss-step { 50% { opacity: 0; } }
@keyframes ss-pop { 0%,60% { transform: scale(0); } 75% { transform: scale(1.2); } 100% { transform: scale(1); } }
@keyframes ss-slide { 0%,20% { transform: translateX(0); } 60%,100% { transform: translateX(18px); } }
@keyframes ss-led { 50% { opacity: .2; } }
@media (prefers-reduced-motion: reduce) { .ss-office * { animation: none !important; transition: none !important; } }
`;

const nubLines = ["I use Arch btw", "the red nub is all I need", "my laptop is older than the intern", "who needs a touchpad?", "still on the 2012 keyboard"];
const phoneLines = ["just one more reel", "doomscrolling...", "reading tech drama", "5 min break (40 min ago)", "replying to the group chat", "staring at the screen"];
const standupLines = ["no blockers", "still fixing that bug", "yesterday: meetings", "today: ship it", "can we keep it short?", "ขอกาแฟก่อน"];

type Phase = "idle" | "standup" | "work";

function usePhase(busy: boolean, reduced: boolean): Phase {
  const [standupDone, setStandupDone] = useState(false);
  useEffect(() => {
    setStandupDone(false);
    if (!busy || reduced) return;
    const id = window.setTimeout(() => setStandupDone(true), 3200);
    return () => window.clearTimeout(id);
  }, [busy, reduced]);
  if (!busy) return "idle";
  return reduced || standupDone ? "work" : "standup";
}

function useWander(staff: StartupDev[], active: boolean) {
  const [away, setAway] = useState<Record<string, Spot>>({});
  useEffect(() => {
    setAway({});
    if (!active || staff.length === 0) return;
    const id = window.setInterval(() => {
      setAway((prev) => {
        const dev = staff[Math.floor(Math.random() * staff.length)];
        if (prev[dev.id]) {
          const next = { ...prev };
          delete next[dev.id];
          return next;
        }
        const taken = new Set(Object.values(prev));
        const free = hangoutSpots.filter((s) => !taken.has(s));
        return free.length ? { ...prev, [dev.id]: free[Math.floor(Math.random() * free.length)] } : prev;
      });
    }, 3600);
    return () => window.clearInterval(id);
  }, [staff, active]);
  return away;
}

function useMoving(targets: Record<string, Spot>) {
  const last = useRef<Record<string, Spot>>({});
  const [moving, setMoving] = useState<Set<string>>(new Set());
  const key = Object.entries(targets).map(([id, s]) => `${id}:${s.x},${s.y}`).join("|");
  useEffect(() => {
    const changed = Object.keys(targets).filter((id) => last.current[id] && (last.current[id].x !== targets[id].x || last.current[id].y !== targets[id].y));
    last.current = targets;
    if (changed.length === 0) return;
    setMoving(new Set(changed));
    const id = window.setTimeout(() => setMoving(new Set()), 1400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return moving;
}

function useSpeech(staff: StartupDev[], phase: Phase) {
  const [lines, setLines] = useState<[string, string][]>([]);
  useEffect(() => {
    if (staff.length === 0) return;
    const say = () => {
      const dev = staff[Math.floor(Math.random() * staff.length)];
      const show = (id: string, line: string, delay = 0) => window.setTimeout(() => {
        setLines((prev) => [...prev.filter(([who]) => who !== id), [id, line] as [string, string]].slice(-2));
        window.setTimeout(() => setLines((prev) => prev.filter(([who, text]) => who !== id || text !== line)), 2400);
      }, delay);
      if (isSassy(dev) && Math.random() < 0.45) {
        const sass = sassLine(dev, staff);
        show(dev.id, sass.text);
        if (sass.targetId) show(sass.targetId, comebackLines[Math.floor(Math.random() * comebackLines.length)], 1300);
        return;
      }
      const distracted = phase !== "work" && (dev.burnout ?? 0) >= DISTRACTED_AT;
      const pool = phase === "standup" ? standupLines : distracted ? phoneLines : looksFor(dev).blackLaptop && Math.random() < 0.5 ? nubLines : phase === "work" ? roleLook(dev.role).lines : roleLook(dev.role).idle;
      show(dev.id, pool[Math.floor(Math.random() * pool.length)]);
    };
    say();
    const id = window.setInterval(say, phase === "idle" ? 2600 : 1100);
    return () => window.clearInterval(id);
  }, [staff, phase]);
  return Object.fromEntries(lines);
}

function useReactions(staff: StartupDev[], reaction?: OfficeReaction) {
  const [shown, setShown] = useState<Record<string, ReactionIcon>>({});
  const levels = useRef(new Map<string, number>());
  useEffect(() => {
    if (!reaction) return;
    const icon: ReactionIcon = reaction.kind === "party" ? "party" : "sweat";
    setShown(Object.fromEntries(staff.map((d) => [d.id, icon])));
    const id = window.setTimeout(() => setShown({}), 2600);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction?.key]);
  useEffect(() => {
    const ups = levelUps(levels.current, staff);
    levels.current = new Map(staff.map((d) => [d.id, d.level ?? 1]));
    if (ups.length === 0) return;
    setShown((prev) => ({ ...prev, ...Object.fromEntries(ups.map((id) => [id, "up" as const])) }));
    const id = window.setTimeout(() => setShown({}), 3000);
    return () => window.clearTimeout(id);
  }, [staff]);
  return shown;
}

const START_DESKS = [1, 1];

export type DeskActions = { debt?: number; money: number; act: number; prices: StartupDeskPrices; pending: boolean; onUpgrade: (index: number) => void; onBuy: () => void };

type OfficeProps = { office?: string; deskActions?: DeskActions; staff: StartupDev[]; infra?: StartupInfra; items?: StartupItem[]; bossVisiting?: boolean; bossVisits?: number; desks?: number[]; deskLimit?: number; busy: boolean; skin?: string; reaction?: OfficeReaction };

function useNewestItem(count: number) {
  const last = useRef(count);
  const [fresh, setFresh] = useState(-1);
  useEffect(() => {
    const grew = count > last.current;
    last.current = count;
    if (!grew) return;
    setFresh(count - 1);
    const id = window.setTimeout(() => setFresh(-1), 2400);
    return () => window.clearTimeout(id);
  }, [count]);
  return fresh;
}

const SHELF = { x: 138, y: 56, slots: 2 };

export function PixelOffice({ office, deskActions, staff, infra, items = [], bossVisiting = false, bossVisits = 0, desks = START_DESKS, deskLimit = 0, busy, skin, reaction }: OfficeProps) {
  const reduced = Boolean(useReducedMotion());
  const [room, setRoom] = useState<"office" | "break">(busy ? "office" : "break");
  useEffect(() => setRoom(busy ? "office" : "break"), [busy]);
  const freshItem = useNewestItem(items.length);
  const [openDesk, setOpenDesk] = useState<number | null>(null);
  useEffect(() => {
    if (freshItem >= 0) setRoom("office");
  }, [freshItem]);
  const placed = useMemo(() => assignStations(staff, desks), [staff, desks]);
  const phase = usePhase(busy, reduced);
  const away = useWander(staff, phase === "idle" && !reduced);
  const standup = useMemo(() => standupSpots(staff.length), [staff.length]);
  const targets: Record<string, Spot> = {};
  staff.forEach((dev, i) => {
    const home = placed.get(dev.id)?.spot ?? { x: TABLE.x, y: TABLE.y + 20, seated: false };
    targets[dev.id] = phase === "standup" ? standup[i] : phase === "idle" && away[dev.id] ? away[dev.id] : home;
  });
  const moving = useMoving(targets);
  const lines = useSpeech(staff, phase);
  const reactions = useReactions(staff, reaction);
  const busyKinds = new Set(phase === "work" ? staff.map((d) => placed.get(d.id)?.kind).filter((k): k is NonNullable<typeof k> => Boolean(k)) : []);
  const occupiedDesks = new Set(staff.map((d) => placed.get(d.id)).filter((s) => s?.kind === "desk").map((s) => `${s!.spot.x},${s!.spot.y + 4}`));
  const nubDesks = new Set(staff.filter((d) => looksFor(d).blackLaptop).map((d) => placed.get(d.id)).filter((s) => s?.kind === "desk").map((s) => `${s!.spot.x},${s!.spot.y + 4}`));

  const ownedDesks = deskSlots(desks, 0).filter((d) => d.tier > 0);
  const itemSpots = items.slice(0, ownedDesks.length + SHELF.slots).map((item, i) => {
    const d = ownedDesks[i];
    return d ? { item, i, x: d.x + 20, y: d.y - 31 } : { item, i, x: SHELF.x + (i - ownedDesks.length) * 16, y: SHELF.y - 12 };
  });
  const drawables: { y: number; node: ReactNode }[] = [
    ...deskSlots(desks, deskLimit).map((d, i) => {
      const desk = <Desk x={d.x} y={d.y} tier={d.tier} busy={phase === "work" && occupiedDesks.has(`${d.x},${d.y}`)} blackLaptop={nubDesks.has(`${d.x},${d.y}`)} />;
      const label = d.tier ? `Desk ${i + 1}, tier ${d.tier}` : "Empty desk spot";
      return {
        y: d.y,
        node: deskActions
          ? <g key={`desk-${d.x}-${d.y}`} role="button" tabIndex={0} aria-label={label} aria-expanded={openDesk === i} className="cursor-pointer outline-none focus-visible:opacity-80"
              onClick={() => setOpenDesk(openDesk === i ? null : i)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenDesk(openDesk === i ? null : i); } }}>
              <rect x={d.x - 32} y={d.y - 44} width="64" height="44" fill="transparent" />{desk}</g>
          : <g key={`desk-${d.x}-${d.y}`}>{desk}</g>,
      };
    }),
    ...itemSpots.map(({ item, x, y, i }) => ({ y: y + 13, node: <Sprite key={`item-${i}`} grid={icons[item.icon as IconName] ?? icons.gift} x={x} y={y} scale={1} className={i === freshItem && !reduced ? "ss-pop" : undefined} /> })),
    { y: TABLE.y + 6, node: <MeetingTable key="table" /> },
    { y: 226, node: <Sofa key="sofa" /> },
    ...staff.map((dev) => {
      const t = targets[dev.id];
      const atHome = phase === "work" && !moving.has(dev.id);
      return {
        y: (placed.get(dev.id)?.spot.y ?? t.y) - (t.seated ? 1 : 0),
        node: <OfficePerson key={dev.id} dev={dev} x={t.x} y={t.y} seated={t.seated && !moving.has(dev.id)} moving={moving.has(dev.id)} working={atHome}
          reaction={reactions[dev.id]} tired={(dev.burnout ?? 0) >= TIRED_AT} distracted={!atHome && (dev.burnout ?? 0) >= DISTRACTED_AT} animate={!reduced} />,
      };
    }),
  ].sort((a, b) => a.y - b.y);

  const slots = deskSlots(desks, deskLimit);
  const sitters = new Map<number, string>();
  staff.forEach((dev) => {
    const station = placed.get(dev.id);
    if (station?.kind === "desk") sitters.set(Number(station.id.slice(5)) - 1, dev.name);
  });
  const popSlot = deskActions && openDesk !== null && room === "office" ? slots[openDesk] : undefined;
  const popover = popSlot && deskActions && (() => {
    const owned = popSlot.tier > 0;
    const up = owned ? deskUpgrade(popSlot.tier, deskActions.act, deskActions.money, deskActions.prices, deskActions.debt) : undefined;
    const buyPrice = nextDeskPrice(deskActions.prices, desks.length);
    const act = () => {
      if (owned) deskActions.onUpgrade(openDesk!);
      else deskActions.onBuy();
      setOpenDesk(null);
    };
    return <div role="dialog" aria-label={owned ? `Desk ${openDesk! + 1}` : "Buy a desk"} className={`absolute z-30 w-48 -translate-x-1/2 -translate-y-full space-y-2 p-2 text-xs ${ui.card}`}
      style={{ left: `clamp(6.5rem, ${(popSlot.x / ROOM_W) * 100}%, calc(100% - 6.5rem))`, top: `${((popSlot.y - 30) / ROOM_H) * 100}%` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-black">{owned ? `Desk ${openDesk! + 1} · Tier ${popSlot.tier}` : "Empty spot"}</p>
        <button type="button" aria-label="Close" className="font-black" onClick={() => setOpenDesk(null)}>x</button>
      </div>
      {owned && <p className="font-bold">{sitters.get(openDesk!) ?? "Nobody sitting here"}{popSlot.tier > 1 ? ` · +${popSlot.tier - 1} skill` : ""}</p>}
      <button type="button" className={`${ui.button} w-full bg-[#fbe39a] px-2 py-2 text-xs`}
        disabled={deskActions.pending || (owned ? Boolean(up?.blocked) : deskActions.money < buyPrice)} onClick={act}>
        {owned ? up?.blocked ?? `Upgrade ${baht(up!.price)}` : deskActions.money < buyPrice ? `Not enough ฿ (${baht(buyPrice)})` : `Buy desk ${baht(buyPrice)}`}
      </button>
    </div>;
  })();

  const roomButton = (id: "office" | "break", label: string) =>
    <button type="button" aria-pressed={room === id} onClick={() => setRoom(id)}
      className={`${ui.chipBase} px-2 py-1 ${room === id ? "bg-[#fbe39a] text-[#292542]" : "bg-[#292542] text-[#fffaf0]"}`}>{label}</button>;

  return <figure className={`overflow-hidden ${ui.cardBase}`} aria-label={room === "break" ? "Break room" : busy ? "Your team is working" : "Your office"}>
    <div className="flex gap-2 bg-[#292542] p-1.5">{roomButton("office", "Office")}{roomButton("break", "Break Room")}</div>
    <div className="relative">
    {room === "break" && <>
      <style>{css}</style>
      <BreakRoom staff={busy ? [] : staff} bossVisiting={bossVisiting} bossVisits={bossVisits} reduced={reduced} />
    </>}
    {room === "office" && <>
    <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} className="ss-office block h-auto w-full" shapeRendering="crispEdges">
      <style>{css}</style>
      <g onClick={() => setOpenDesk(null)}><RoomBackdrop busyKinds={busyKinds} skin={skin} servers={infra?.servers.length ?? 4} balanced={(infra?.parts ?? []).includes("lb")} office={office} /></g>
      {items.length > ownedDesks.length && <Sprite grid={block(17, 2, "B")} x={SHELF.x - 2} y={SHELF.y} />}
      {drawables.map((d) => d.node)}
      {staff.map((dev) => <NameTag key={dev.id} name={dev.name} x={targets[dev.id].x} y={targets[dev.id].y} animate={!reduced} />)}
    </svg>
    {staff.map((dev) => {
      const t = targets[dev.id];
      if (!lines[dev.id] || !t) return null;
      const left = `${(t.x / ROOM_W) * 100}%`;
      return <span key={dev.id} className="pointer-events-none absolute z-10 max-w-[9rem] -translate-x-1/2 -translate-y-full truncate whitespace-nowrap rounded-xl border-2 border-[#292542] bg-white px-2 py-0.5 text-xs font-bold text-[#292542] shadow-[2px_2px_0_#292542]"
        style={{ left: `clamp(4.6rem, ${left}, calc(100% - 4.6rem))`, top: `${((t.y - 50) / ROOM_H) * 100}%` }}>{lines[dev.id]}</span>;
    })}
    {popover}
    </>}
    </div>
  </figure>;
}
