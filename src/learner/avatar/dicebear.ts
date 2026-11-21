import { createAvatar, type Style } from "@dicebear/core";
import { notionists, lorelei, adventurer, funEmoji, pixelArt, thumbs } from "@dicebear/collection";
import type { AvatarConfig, DiceStyle } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STYLES: Record<DiceStyle, Style<any>> = { notionists, lorelei, adventurer, "fun-emoji": funEmoji, "pixel-art": pixelArt, thumbs };

type SchemaProp = { items?: { enum?: string[] }; default?: unknown };
const schemaOf = (s: DiceStyle): Record<string, SchemaProp> =>
  ((STYLES[s] as unknown as { schema?: { properties?: Record<string, SchemaProp> } }).schema?.properties ?? {});

export interface OptionRow {
  key: string;
  kind: "part" | "color";
  values: string[];
  optional: boolean;
}

const SKIP = new Set(["backgroundColor", "backgroundType", "base", "shape", "seed", "flip", "rotate", "scale", "radius", "size", "translateX", "translateY", "clip", "randomizeIds", "backgroundRotation"]);
const EXTRA_COLORS = ["000000", "3f3f46", "71717a", "f4f4f5", "ffffff", "7c2d12", "b45309", "f59e0b", "16a34a", "0ea5e9", "6366f1", "db2777", "e11d48"];

/** Customizable parts and colors for a style, read from the style's own schema. */
export function optionsFor(style: DiceStyle): OptionRow[] {
  const sc = schemaOf(style);
  const rows: OptionRow[] = [];
  for (const [k, v] of Object.entries(sc)) {
    if (SKIP.has(k) || k.endsWith("Probability")) continue;
    const e = v.items?.enum;
    if (e && (e.length > 1 || sc[`${k}Probability`])) rows.push({ key: k, kind: "part", values: [...e].sort(), optional: !!sc[`${k}Probability`] });
    else if (k.endsWith("Color")) {
      const d = Array.isArray(v.default) ? (v.default as string[]) : [];
      const vals = [...new Set([...d, ...(d.length < 4 ? EXTRA_COLORS : [])])];
      if (vals.length > 1) rows.push({ key: k, kind: "color", values: vals, optional: false });
    }
  }
  return rows;
}

/** DiceBear options for a saved avatar (null part = turned off). */
export function buildOptions(cfg: AvatarConfig, override: Record<string, string | null> = {}, withBg = false): Record<string, unknown> {
  const style = cfg.style as DiceStyle;
  const sc = schemaOf(style);
  const sel = { ...(cfg.options?.[style] ?? {}), ...override };
  const o: Record<string, unknown> = { seed: cfg.seed };
  for (const [k, v] of Object.entries(sel)) {
    const prob = sc[`${k}Probability`] ? `${k}Probability` : null;
    if (v === null) {
      if (prob) o[prob] = 0;
      continue;
    }
    o[k] = [v];
    if (prob) o[prob] = 100;
  }
  if (withBg && cfg.bg) o.backgroundColor = [cfg.bg];
  return o;
}

const cache = new Map<string, string>();

export function avatarDataUri(cfg: AvatarConfig, override: Record<string, string | null> = {}): string {
  const style = cfg.style as DiceStyle;
  const opts = buildOptions(cfg, override);
  const k = style + JSON.stringify(opts);
  let u = cache.get(k);
  if (!u) {
    u = createAvatar(STYLES[style], opts).toDataUri();
    cache.set(k, u);
  }
  return u;
}
