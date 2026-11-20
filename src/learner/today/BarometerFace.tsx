import { useId } from "react";

export type ZoneId = "comfort" | "stretch-enjoying" | "stretch-overwhelmed" | "panic";

export const ZONES: { id: ZoneId; a: string; b: string; c1: string; c2: string; soft: string; mouth: "smile" | "soft" | "flat" | "frown" }[] = [
  { id: "comfort", a: "Comfort", b: "zone", c1: "#a3e635", c2: "#65a30d", soft: "#f7fee7", mouth: "smile" },
  { id: "stretch-enjoying", a: "Stretch", b: "enjoying it", c1: "#fde047", c2: "#eab308", soft: "#fefce8", mouth: "soft" },
  { id: "stretch-overwhelmed", a: "Stretch", b: "overwhelmed", c1: "#fdba74", c2: "#f97316", soft: "#fff7ed", mouth: "flat" },
  { id: "panic", a: "Panic", b: "zone", c1: "#fb7185", c2: "#e11d48", soft: "#fff1f2", mouth: "frown" },
];

export function BarometerFace({ zone, size = 46 }: { zone: ZoneId; size?: number }) {
  const z = ZONES.find((x) => x.id === zone)!;
  const id = useId();
  const ink = "#3b2a12";
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden>
      <defs>
        <radialGradient id={id} cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor={z.c1} />
          <stop offset="1" stopColor={z.c2} />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill={`url(#${id})`} />
      <ellipse cx="18" cy="11" rx="9" ry="4.5" fill="#fff" opacity=".28" />
      {z.mouth === "smile" ? (
        <path d="M15.5 21.5q2.5-3 5 0M27.5 21.5q2.5-3 5 0" stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <ellipse cx="18" cy="20.5" rx="2" ry="2.6" fill={ink} />
          <ellipse cx="30" cy="20.5" rx="2" ry="2.6" fill={ink} />
        </>
      )}
      {z.mouth === "smile" && <path d="M14.5 27.5q9.5 10 19 0" fill={ink} />}
      {z.mouth === "soft" && <path d="M17 28.5q7 5.5 14 0" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />}
      {z.mouth === "flat" && <path d="M18 30h12" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />}
      {z.mouth === "frown" && <path d="M17 32q7-5.5 14 0" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />}
    </svg>
  );
}
