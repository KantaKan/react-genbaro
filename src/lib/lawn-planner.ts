import type { ShowcaseEntry } from "@/application/services/showcaseLawnService";

export const LAWN_SCENE_LIMIT = 12;
export const LAWN_WINDOW_MS = 30 * 60 * 1000;

export interface LawnPlacement {
  entry: ShowcaseEntry;
  slot: number;
  offsetX: number;
  offsetY: number;
  facing: "left" | "right";
}

export interface LawnPlan {
  windowIndex: number;
  total: number;
  placements: LawnPlacement[];
}

export interface LawnPlanInput {
  entries: ShowcaseEntry[];
  viewerId?: string | null;
  mine?: ShowcaseEntry | null;
  now: number;
  limit?: number;
}

export function lawnHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function lawnWindow(now: number) {
  return Math.floor(now / LAWN_WINDOW_MS);
}

export function planLawn({ entries, viewerId, mine, now, limit = LAWN_SCENE_LIMIT }: LawnPlanInput): LawnPlan {
  const windowIndex = lawnWindow(now);
  const own = entries.find((entry) => entry.owner_id === viewerId) ?? (mine && !mine.hidden ? mine : undefined);
  const others = entries.filter((entry) => entry.owner_id !== viewerId)
    .sort((a, b) => lawnHash(a.owner_id) - lawnHash(b.owner_id) || a.owner_id.localeCompare(b.owner_id));
  const capacity = Math.max(0, limit - (own ? 1 : 0));
  let visitors = others;
  if (others.length > capacity) {
    const start = (windowIndex * capacity) % others.length;
    visitors = Array.from({ length: capacity }, (_, index) => others[(start + index) % others.length]);
  }
  const chosen = own ? [own, ...visitors] : visitors;
  const slots = chosen.map((entry) => ({ entry, order: lawnHash(`${windowIndex}:${entry.owner_id}`) }))
    .sort((a, b) => a.order - b.order || a.entry.owner_id.localeCompare(b.entry.owner_id));
  return {
    windowIndex,
    total: others.length + (own ? 1 : 0),
    placements: slots.map(({ entry, order }, slot) => ({
      entry, slot,
      offsetX: (order % 17) - 8,
      offsetY: ((order >>> 5) % 13) - 6,
      facing: (order >>> 11) % 2 === 0 ? "right" : "left",
    })),
  };
}
