import type { StartupDev } from "@/application/services/startupStoryService";
import { roleLook } from "../startupStoryCatalog";

const INK = "#292542";
const skins = ["#f5d0b0", "#e8b48a", "#c98b5e", "#8d5a3b"];
const hairs = ["#2b2233", "#5a3825", "#c9772e", "#1d3557", "#7b2d5b", "#e0c068"];

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function Accessory({ role }: { role?: string }) {
  switch (role) {
    case "designer": return <ellipse cx="-2" cy="-43" rx="10" ry="3" fill="#e3683e" stroke={INK} strokeWidth="0.6" />;
    case "devops": return <g><rect x="-11" y="-38" width="3" height="7" fill={INK} /><rect x="8" y="-38" width="3" height="7" fill={INK} /><rect x="8" y="-32" width="6" height="1.5" fill={INK} /></g>;
    case "pm": return <g><rect x="9" y="-19" width="8" height="10" fill="#fffaf0" stroke={INK} strokeWidth="0.6" /><rect x="11" y="-16" width="4" height="1" fill={INK} /><rect x="11" y="-13" width="4" height="1" fill={INK} /></g>;
    case "qa": return <g><circle cx="13" cy="-15" r="3.5" fill="#bfe3f7" stroke={INK} strokeWidth="1" /><rect x="15" y="-12" width="1.5" height="5" fill={INK} transform="rotate(-35 15 -12)" /></g>;
    case "po": return <rect x="10" y="-17" width="7" height="7" fill="#fbe39a" stroke={INK} strokeWidth="0.5" />;
    case "sa": return <rect x="12" y="-20" width="2" height="9" fill="#2d9cdb" />;
    default: return null;
  }
}

type Props = {
  dev: StartupDev;
  x: number;
  y: number;
  seated: boolean;
  moving: boolean;
  working: boolean;
  reaction?: string;
  tired: boolean;
  animate: boolean;
};

export function OfficePerson({ dev, x, y, seated, moving, working, reaction, tired, animate }: Props) {
  const look = roleLook(dev.role);
  const h = hash(dev.name + dev.id);
  const skin = skins[h % skins.length];
  const hair = hairs[(h >> 3) % hairs.length];
  const arm = working ? look.anim : "";
  const body = reaction ? "ss-jump" : moving ? "ss-walk-bob" : working ? "ss-bob" : "ss-breathe";
  return <g style={{ transform: `translate(${x}px, ${y}px)`, transition: animate ? "transform 1.4s linear" : "none" }}>
    <ellipse cx="0" cy="0" rx="10" ry="3" fill={INK} opacity="0.18" />
    <g className={body}>
      {!seated && <>
        <rect x="-6" y="-10" width="5" height="10" fill="#2b2542" className={moving ? "ss-leg-a" : ""} style={{ transformBox: "fill-box", transformOrigin: "50% 0" }} />
        <rect x="1" y="-10" width="5" height="10" fill="#2b2542" className={moving ? "ss-leg-b" : ""} style={{ transformBox: "fill-box", transformOrigin: "50% 0" }} />
      </>}
      <rect x="-8" y="-25" width="16" height="16" fill={look.color} stroke={INK} strokeWidth="0.6" />
      <rect x="-3" y="-25" width="6" height="2" fill="#fffaf0" />
      <rect x="-12" y="-24" width="4" height="12" fill={look.color} stroke={INK} strokeWidth="0.5" className={arm} style={{ transformBox: "fill-box", transformOrigin: "50% 0" }} />
      <rect x="8" y="-24" width="4" height="12" fill={look.color} stroke={INK} strokeWidth="0.5" className={arm === "ss-type" ? "ss-type-alt" : ""} style={{ transformBox: "fill-box", transformOrigin: "50% 0" }} />
      <rect x="-9" y="-42" width="18" height="17" fill={skin} stroke={INK} strokeWidth="0.6" />
      <rect x="-10" y="-44" width="20" height="6" fill={hair} />
      <rect x="-10" y="-40" width="3" height="8" fill={hair} />
      <rect x="-5" y="-34" width="2" height="3" fill={INK} />
      <rect x="3" y="-34" width="2" height="3" fill={INK} />
      <rect x="-7" y="-30" width="3" height="1.5" fill="#f7a5a4" />
      <rect x="4" y="-30" width="3" height="1.5" fill="#f7a5a4" />
      {reaction && <rect x="-2" y="-29" width="4" height="2" fill={INK} />}
      <Accessory role={dev.role} />
      {dev.genmate_id && <text x="-12" y="-44" fontSize="8">🎓</text>}
      {reaction && <text y="-50" fontSize="13" textAnchor="middle">{reaction}</text>}
      {!reaction && tired && <text x="11" y="-42" fontSize="9">😴</text>}
    </g>
    <text y="10" fontSize="9" fontWeight="800" textAnchor="middle" fill={INK} stroke="#fffaf0" strokeWidth="2.5" paintOrder="stroke">{dev.name}</text>
  </g>;
}
