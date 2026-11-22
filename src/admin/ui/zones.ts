import { ZONES } from "@/learner/today/BarometerFace";
import type { Zone } from "../wellbeing";

export const ZONE_BG: Record<string, string> = { comfort: "#a3e635", "stretch-enjoying": "#fde047", "stretch-overwhelmed": "#fdba74", panic: "#fb7185" };
export const zoneLabel = (z: Zone) => {
  const m = ZONES.find((x) => x.id === z);
  return m ? (m.b === "zone" ? m.a : `${m.a} · ${m.b}`) : "Not written";
};
