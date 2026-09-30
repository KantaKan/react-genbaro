import type { LawnMood, ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { getThailandHour } from "@/utils/date-utils";

export const LAWN_SCENE_LIMIT = 12;
export const LAWN_LITE_LIMIT = 6;
export const LAWN_ZONE_CAPACITY = 4;
export const LAWN_WINDOW_MS = 30 * 60 * 1000;

export type LawnZone = "picnic" | "bench" | "play";
export type LawnAction = "walk" | "idle" | "rest" | "bench-sit" | "wave" | "smile" | "high-five" | "meal" | "rps" | "play";
export type LawnLighting = "morning" | "evening";

export interface LawnActionSpec {
  label: string;
  emoji: string;
  participants: ReadonlyArray<1 | 2>;
  zones: ReadonlyArray<LawnZone>;
  variants?: ReadonlyArray<string>;
}

export const LAWN_ZONES: ReadonlyArray<LawnZone> = ["picnic", "bench", "play"];

export const LAWN_ACTIONS: Record<LawnAction, LawnActionSpec> = {
  walk: { label: "เดินเล่น", emoji: "", participants: [1], zones: LAWN_ZONES },
  idle: { label: "ยืนสูดอากาศ", emoji: "", participants: [1], zones: LAWN_ZONES },
  rest: { label: "งีบพักสบาย ๆ", emoji: "💤", participants: [1], zones: ["bench", "play"] },
  "bench-sit": { label: "นั่งม้านั่ง", emoji: "", participants: [1, 2], zones: ["bench"] },
  wave: { label: "โบกมือทักกัน", emoji: "👋", participants: [2], zones: LAWN_ZONES },
  smile: { label: "ยิ้มให้กัน", emoji: "😊", participants: [2], zones: LAWN_ZONES },
  "high-five": { label: "แปะมือกัน", emoji: "✋", participants: [2], zones: ["bench", "play"], variants: ["high-five", "handhold"] },
  meal: { label: "กินข้าวด้วยกัน", emoji: "🍙", participants: [2], zones: ["picnic"] },
  rps: { label: "เป่ายิ้งฉุบกันขำ ๆ", emoji: "✌️", participants: [2], zones: ["picnic", "play"] },
  play: { label: "เล่นกันแบบตลก ๆ", emoji: "🎈", participants: [2], zones: ["play"], variants: ["pillow", "paper-sword", "chase"] },
};

const moodActions: Partial<Record<LawnMood, LawnAction[]>> = {
  greeting: ["wave", "smile", "high-five"],
  relaxing: ["bench-sit", "rest"],
  meal: ["meal"],
  playful: ["play", "rps"],
};

const soloActions = (Object.keys(LAWN_ACTIONS) as LawnAction[]).filter((action) => LAWN_ACTIONS[action].participants.includes(1));
const pairActions = (Object.keys(LAWN_ACTIONS) as LawnAction[]).filter((action) => LAWN_ACTIONS[action].participants.includes(2));

export interface LawnActivity {
  id: string;
  action: LawnAction;
  variant?: string;
  zone: LawnZone;
  members: ShowcaseEntry[];
}

export interface LawnPlacement {
  entry: ShowcaseEntry;
  zone: LawnZone;
  action: LawnAction;
  variant?: string;
  activityId: string;
  facing: "left" | "right";
}

export interface LawnPlan {
  windowIndex: number;
  total: number;
  lighting: LawnLighting;
  activities: LawnActivity[];
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

export function lawnLighting(now: number): LawnLighting {
  const hour = getThailandHour(now);
  return hour >= 6 && hour < 17 ? "morning" : "evening";
}

const byStableHash = (a: ShowcaseEntry, b: ShowcaseEntry) => lawnHash(a.owner_id) - lawnHash(b.owner_id) || a.owner_id.localeCompare(b.owner_id);
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

function selectVisitors(entries: ShowcaseEntry[], viewerId: string | null | undefined, mine: ShowcaseEntry | null | undefined, windowIndex: number, limit: number) {
  const own = entries.find((entry) => entry.owner_id === viewerId) ?? (mine && !mine.hidden ? mine : undefined);
  const others = entries.filter((entry) => entry.owner_id !== viewerId).sort(byStableHash);
  const capacity = Math.max(0, limit - (own ? 1 : 0));
  let visitors = others;
  if (others.length > capacity) {
    const start = (windowIndex * capacity) % others.length;
    visitors = Array.from({ length: capacity }, (_, index) => others[(start + index) % others.length]);
  }
  return { chosen: own ? [own, ...visitors] : visitors, total: others.length + (own ? 1 : 0) };
}

function circleMatching(entries: ShowcaseEntry[], round: number): Array<[ShowcaseEntry, ShowcaseEntry]> {
  const ring: Array<ShowcaseEntry | null> = [...entries].sort(byStableHash);
  if (ring.length % 2) ring.push(null);
  if (ring.length < 2) return [];
  const [fixed, ...rest] = ring;
  const shift = round % rest.length;
  const order = [fixed, ...rest.slice(shift), ...rest.slice(0, shift)];
  const pairs: Array<[ShowcaseEntry, ShowcaseEntry]> = [];
  for (let index = 0; index < order.length / 2; index++) {
    const a = order[index];
    const b = order[order.length - 1 - index];
    if (a && b) pairs.push([a, b]);
  }
  return pairs;
}

export function planLawn({ entries, viewerId, mine, now, limit = LAWN_SCENE_LIMIT }: LawnPlanInput): LawnPlan {
  const windowIndex = lawnWindow(now);
  const { chosen, total } = selectVisitors(entries, viewerId, mine, windowIndex, limit);
  const activeMood = (entry: ShowcaseEntry) => (entry.mood && entry.mood_until && Date.parse(entry.mood_until) > now ? entry.mood : undefined);
  const pairable = (entry: ShowcaseEntry) => activeMood(entry) !== "quiet";
  const preferredActions = (entry: ShowcaseEntry) => moodActions[activeMood(entry) ?? "surprise"] ?? [];
  const previous = selectVisitors(entries, viewerId, mine, windowIndex - 1, limit).chosen;
  const recentPairs = chosen.filter(pairable).length > 2 ? new Set(circleMatching(previous.filter(pairable), windowIndex - 1).map(([a, b]) => pairKey(a.owner_id, b.owner_id))) : new Set<string>();
  const free: Record<LawnZone, number> = { picnic: LAWN_ZONE_CAPACITY, bench: LAWN_ZONE_CAPACITY, play: LAWN_ZONE_CAPACITY };
  const activities: LawnActivity[] = [];
  const paired = new Set<string>();

  const fit = (candidates: LawnAction[], seed: number, size: 1 | 2, preferred: LawnAction[] = []) => {
    const rotate = (list: LawnAction[]) => list.map((_, index) => list[(seed + index) % list.length]);
    const ordered = [...rotate(candidates.filter((action) => preferred.includes(action))), ...rotate(candidates.filter((action) => !preferred.includes(action)))];
    for (const action of ordered) {
      const zones = LAWN_ACTIONS[action].zones;
      for (let offset = 0; offset < zones.length; offset++) {
        const zone = zones[(seed + offset) % zones.length];
        if (free[zone] >= size) return { action, zone };
      }
    }
    return null;
  };

  for (const [a, b] of circleMatching(chosen.filter(pairable), windowIndex)) {
    const key = pairKey(a.owner_id, b.owner_id);
    const seed = lawnHash(`${windowIndex}:${key}`);
    if (recentPairs.has(key) || seed % 10 >= 7) continue;
    const slot = fit(pairActions, seed >>> 4, 2, [...preferredActions(a), ...preferredActions(b)]);
    if (!slot) continue;
    free[slot.zone] -= 2;
    paired.add(a.owner_id).add(b.owner_id);
    const variants = LAWN_ACTIONS[slot.action].variants;
    activities.push({ id: `pair:${key}`, ...slot, variant: variants?.[(seed >>> 9) % variants.length], members: [a, b] });
  }

  for (const entry of chosen) {
    if (paired.has(entry.owner_id)) continue;
    const seed = lawnHash(`${windowIndex}:${entry.owner_id}`);
    const slot = fit(soloActions, seed >>> 4, 1, preferredActions(entry)) ?? fit(["idle"], seed, 1);
    if (!slot) continue;
    free[slot.zone] -= 1;
    activities.push({ id: `solo:${entry.owner_id}`, ...slot, members: [entry] });
  }

  activities.sort((a, b) => LAWN_ZONES.indexOf(a.zone) - LAWN_ZONES.indexOf(b.zone) || lawnHash(`${windowIndex}:${a.id}`) - lawnHash(`${windowIndex}:${b.id}`));
  const placements = activities.flatMap((activity) => activity.members.map((entry, index): LawnPlacement => ({
    entry, zone: activity.zone, action: activity.action, variant: activity.variant, activityId: activity.id,
    facing: activity.members.length === 2 ? (index === 0 ? "right" : "left") : lawnHash(`${windowIndex}:face:${entry.owner_id}`) % 2 ? "left" : "right",
  })));
  return { windowIndex, total, lighting: lawnLighting(now), activities, placements };
}
