import type { StartupDev } from "@/application/services/startupStoryService";
import { roleLook } from "../startupStoryCatalog";
import { hairStyleNames, tint, wildLooks, type Palette } from "./sprites";

const skins = ["#f5d0b0", "#e8b48a", "#c98b5e", "#8d5a3b"];
const hairs = ["#2b2233", "#5a3825", "#c9772e", "#1d3557", "#7b2d5b", "#e0c068"];

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export type Look = {
  coffee: boolean;
  style?: (typeof hairStyleNames)[number];
  pal: Palette;
  wild?: (typeof wildLooks)[string];
};

export function looksFor(dev: StartupDev): Look {
  const h = hash(dev.name + dev.id);
  const wild = dev.wildcard ? wildLooks[dev.wildcard] : undefined;
  if (wild) return { coffee: false, style: wild.hair && wild.hair !== "none" ? wild.hair : undefined, pal: wild.pal ?? {}, wild };
  const hair = hairs[(h >> 3) % hairs.length];
  const shirt = roleLook(dev.role).color;
  return {
    coffee: (h >> 9) % 3 === 0,
    style: hairStyleNames[(h >> 6) % hairStyleNames.length],
    pal: { 1: skins[h % skins.length], 3: hair, 4: tint(hair, 1.35), 5: shirt, 6: tint(shirt, 0.78), 7: "#3b3f6b" },
  };
}
