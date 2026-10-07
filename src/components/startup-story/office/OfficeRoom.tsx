import { useMemo } from "react";
import { ROOM_H, ROOM_W, TABLE } from "./officeLayout";
import { block, box, dashed, decor, desk, icons, lbBox, oval, rack } from "./sprites";
import { Sprite } from "./Sprite";

const notes: [string, number, number][] = [["y", 0, 0], ["p", 6, 1], ["s", 12, 0], ["m", 2, 7], ["y", 9, 8], ["v", 4, 13]];
const tableTop = oval(30, 10, "c");
const tableInner = oval(20, 6, "C");
const openSlot = dashed(32, 14);

type BackdropProps = { busyKinds: Set<string>; skin?: string; servers: number; balanced: boolean };

export function RoomBackdrop({ busyKinds, skin, servers, balanced }: BackdropProps) {
  const serverRack = useMemo(() => rack(Math.min(servers, 5)), [servers]);
  const rooftop = skin === "rooftop-bangkok";
  const busy = (kind: string) => busyKinds.has(kind);
  return <g>
    <defs>
      <pattern id="ss-floor" width="32" height="32" patternUnits="userSpaceOnUse">
        <rect width="32" height="32" fill="#e6c595" />
        <rect width="16" height="16" fill="#dcb683" />
        <rect x="16" y="16" width="16" height="16" fill="#dcb683" />
      </pattern>
    </defs>
    <rect width={ROOM_W} height="76" fill={rooftop ? "#f7c6a3" : "#f4e3c3"} />
    <rect y="54" width={ROOM_W} height="16" fill={rooftop ? "#eab38f" : "#ead3ac"} />
    <rect y="70" width={ROOM_W} height="6" fill="#b98b5e" />
    <rect y="76" width={ROOM_W} height={ROOM_H - 76} fill="url(#ss-floor)" />
    <rect y="76" width={ROOM_W} height="4" fill="#292542" opacity="0.08" />

    <Sprite grid={box(20, 21, "b")} x={16} y={14} />
    {notes.map(([c, dx, dy], i) => <Sprite key={i} grid={block(5, 5, c)} x={20 + dx * 2} y={18 + dy * 2}
      className={busy("sticky") && i === 5 ? "ss-pop" : undefined} />)}

    <Sprite grid={box(28, 22, "c")} x={70} y={12} />
    {[0, 9, 18].map((dx) => <Sprite key={dx} grid={block(7, 2, "G")} x={74 + dx * 2} y={16} />)}
    <Sprite grid={block(6, 3, "p")} x={76} y={24} />
    <Sprite grid={block(6, 3, "y")} x={76} y={32} />
    <Sprite grid={block(6, 3, "s")} x={94} y={24} className={busy("kanban") ? "ss-slide" : undefined} />
    <Sprite grid={block(6, 3, "m")} x={112} y={24} />
    <Sprite grid={block(6, 3, "m")} x={112} y={32} />

    <Sprite grid={decor.window} pal={rooftop ? { s: "#f08a5d" } : undefined} x={136} y={10} />

    <Sprite grid={box(26, 19, "W", "g")} x={182} y={12} />
    <Sprite grid={block(7, 1, "S")} x={188} y={18} />
    <Sprite grid={block(5, 1, "P")} x={188} y={24} />
    <Sprite grid={block(9, 1, "m")} x={188} y={30} />
    <Sprite grid={["kk...", "..kk.", "....k"]} x={214} y={20} className={busy("whiteboard") ? "ss-pop" : undefined} />
    <Sprite grid={block(22, 1, "G")} x={186} y={50} />

    <Sprite grid={decor.poster} x={240} y={16} />
    <Sprite grid={serverRack} x={256} y={70 - serverRack.length * 2} blink={busy("rack")} />
    {balanced && <Sprite grid={lbBox} x={254} y={64} blink={busy("rack")} />}

    <Sprite grid={box(20, 17, "b")} x={318} y={58} />
    <Sprite grid={block(18, 1, "B")} x={320} y={68} />
    <Sprite grid={decor.coffee} x={322} y={36} />
    <Sprite grid={decor.mug} x={342} y={50} />

    <Sprite grid={decor.plant} x={6} y={72} />
  </g>;
}

export function Desk({ x, y, tier, busy, blackLaptop }: { x: number; y: number; tier: number; busy: boolean; blackLaptop?: boolean }) {
  const laptop = blackLaptop ? desk.blackLaptop : desk.laptop;
  if (tier === 0) return <g opacity="0.4"><Sprite grid={openSlot} x={x - 32} y={y - 28} /></g>;
  const base = tier === 1 ? desk.foldingBase : tier === 4 ? desk.standingBase : tier >= 5 ? desk.rgbBase : desk.base;
  return <g>
    {tier === 1 && <Sprite grid={laptop} x={x - 12} y={y - 32} blink={busy} />}
    {tier === 2 && <>
      <Sprite grid={desk.monitor} x={x - 26} y={y - 38} blink={busy} />
      <Sprite grid={laptop} x={x - 4} y={y - 32} />
    </>}
    {tier === 3 && <>
      <Sprite grid={desk.monitor} x={x - 26} y={y - 38} blink={busy} />
      <Sprite grid={desk.monitor} x={x - 6} y={y - 38} />
      <Sprite grid={decor.plant} x={x + 16} y={y - 38} />
    </>}
    {tier === 4 && <>
      <Sprite grid={desk.ultrawide} x={x - 28} y={y - 38} blink={busy} />
      <Sprite grid={decor.plant} x={x + 18} y={y - 40} />
    </>}
    {tier >= 5 && <>
      <Sprite grid={desk.monitorBlack} x={x - 30} y={y - 38} blink={busy} />
      <Sprite grid={desk.monitorBlack} x={x - 10} y={y - 38} />
      <Sprite grid={desk.pcTower} x={x + 12} y={y - 42} blink />
    </>}
    <Sprite grid={base} x={x - 32} y={y - 20} />
  </g>;
}

export function MeetingTable() {
  return <g>
    <Sprite grid={box(3, 7, "B")} x={TABLE.x - 3} y={TABLE.y} />
    <Sprite grid={tableTop} x={TABLE.x - 30} y={TABLE.y - 10} />
    <Sprite grid={tableInner} x={TABLE.x - 20} y={TABLE.y - 6} />
    <Sprite grid={icons.clipboard} x={TABLE.x - 6} y={TABLE.y - 8} scale={1} />
  </g>;
}

export function Sofa() {
  return <g>
    <Sprite grid={box(28, 7, "V")} x={300} y={198} />
    <Sprite grid={box(32, 8, "v")} x={296} y={210} />
  </g>;
}
