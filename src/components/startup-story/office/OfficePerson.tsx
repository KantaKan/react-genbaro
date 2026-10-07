import { useMemo } from "react";
import type { StartupDev } from "@/application/services/startupStoryService";
import { roleLook } from "../startupStoryCatalog";
import { gradCap, hairStyleNames, hairStyles, handheld, icons, person, roleGear, tint, type ReactionIcon } from "./sprites";
import { Sprite } from "./Sprite";

const INK = "#292542";
const skins = ["#f5d0b0", "#e8b48a", "#c98b5e", "#8d5a3b"];
const hairs = ["#2b2233", "#5a3825", "#c9772e", "#1d3557", "#7b2d5b", "#e0c068"];

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function looksFor(dev: StartupDev) {
  const h = hash(dev.name + dev.id);
  const hair = hairs[(h >> 3) % hairs.length];
  const shirt = roleLook(dev.role).color;
  return {
    coffee: (h >> 9) % 3 === 0,
    style: hairStyleNames[(h >> 6) % hairStyleNames.length],
    pal: { 1: skins[h % skins.length], 3: hair, 4: tint(hair, 1.35), 5: shirt, 6: tint(shirt, 0.78), 7: "#3b3f6b" },
  };
}

type Props = {
  dev: StartupDev;
  x: number;
  y: number;
  seated: boolean;
  moving: boolean;
  working: boolean;
  reaction?: ReactionIcon;
  tired: boolean;
  distracted: boolean;
  animate: boolean;
};

export function OfficePerson({ dev, x, y, seated, moving, working, reaction, tired, distracted, animate }: Props) {
  const { style, pal, coffee } = useMemo(() => looksFor(dev), [dev]);
  const hair = hairStyles[style];
  const held = distracted ? handheld.phone : !working && coffee ? handheld.cup : undefined;
  const gear = held ?? (dev.role ? roleGear[dev.role] : undefined);
  const body = reaction ? "ss-jump" : moving ? "ss-walk-bob" : working ? "ss-bob" : "ss-breathe";
  return <g style={{ transform: `translate(${x}px, ${y}px)`, transition: animate ? "transform 1.4s linear" : "none" }}>
    <ellipse cx="0" cy="0" rx="10" ry="3" fill={INK} opacity="0.18" />
    <g className={body}>
      {"back" in hair && <Sprite grid={hair.back} pal={pal} x={-16} y={-48} />}
      <Sprite grid={person.body} pal={pal} x={-16} y={-48} />
      {!seated && (moving
        ? <>
          <Sprite grid={person.stepA} pal={pal} x={-16} y={-8} className="ss-step-a" />
          <Sprite grid={person.stepB} pal={pal} x={-16} y={-8} className="ss-step-b" />
        </>
        : <Sprite grid={person.legs} pal={pal} x={-16} y={-8} />)}
      <Sprite grid={hair.front} pal={pal} x={-16} y={-48} />
      {gear && <Sprite grid={gear} x={-16} y={-48} />}
      {dev.genmate_id && <Sprite grid={gradCap} x={-18} y={-54} />}
      {reaction && <Sprite grid={icons[reaction]} x={-12} y={-76} />}
      {!reaction && tired && <Sprite grid={icons.zzz} x={8} y={-60} scale={1} />}
    </g>
  </g>;
}

export function NameTag({ name, x, y, animate }: { name: string; x: number; y: number; animate: boolean }) {
  return <text y="10" fontSize="9" fontWeight="800" textAnchor="middle" fill={INK} stroke="#fffaf0" strokeWidth="2.5" paintOrder="stroke"
    style={{ transform: `translate(${x}px, ${y}px)`, transition: animate ? "transform 1.4s linear" : "none" }}>{name}</text>;
}
