import type { LawnMood, ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { getThailandHour } from "@/utils/date-utils";
import { POSE_VERBS, SPOT_POSES, type CatSpot, type SpotKind, type YardPose, type YardScene, type YardSpot } from "./lawn-scenes";

export const LAWN_SCENE_LIMIT = 12;
export const LAWN_LITE_LIMIT = 6;
export const LAWN_WINDOW_MS = 30 * 60 * 1000;

export type LawnPhase = "morning" | "evening" | "night";
export type YardItem = "onigiri" | "milk" | "book" | "pillow" | "ball";
export type CatPersonality = "foodie" | "sleepy" | "playful";
export type CatPose = "beg" | "loaf" | "chase" | "lap";

export interface YardPlacement {
  entry: ShowcaseEntry;
  spot: YardSpot;
  pose: YardPose;
  item?: YardItem;
  partnerId?: string;
  facing: "left" | "right";
  activity: string;
}

export interface LawnCat {
  id: string;
  name: string;
  coat: number;
  personality: CatPersonality;
}

export interface CatPlacement {
  cat: LawnCat;
  pose: CatPose;
  x: number;
  y: number;
  lapOf?: string;
}

export interface LawnPlan {
  windowIndex: number;
  total: number;
  phase: LawnPhase;
  placements: YardPlacement[];
  cats: CatPlacement[];
}

export interface LawnPlanInput {
  entries: ShowcaseEntry[];
  scene: YardScene;
  viewerId?: string | null;
  mine?: ShowcaseEntry | null;
  now: number;
  limit?: number;
}

export const LAWN_CATS: ReadonlyArray<LawnCat> = [
  { id: "mochi", name: "โมจิ", coat: 0, personality: "foodie" },
  { id: "khanompang", name: "ขนมปัง", coat: 1, personality: "sleepy" },
  { id: "taohu", name: "เต้าหู้", coat: 2, personality: "playful" },
];

const moodKinds: Partial<Record<LawnMood, SpotKind[]>> = {
  greeting: ["bench", "blanket", "table"],
  relaxing: ["bench", "tree", "blanket"],
  meal: ["table", "blanket"],
  playful: ["play"],
  quiet: ["tree", "path", "bench", "blanket"],
};
const nightKinds: SpotKind[] = ["tree", "blanket", "bench"];
const lapPoses: YardPose[] = ["sit", "read", "doze"];

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

export function lawnPhase(now: number): LawnPhase {
  const hour = getThailandHour(now);
  if (hour >= 6 && hour < 17) return "morning";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

const byStableHash = (a: ShowcaseEntry, b: ShowcaseEntry) => lawnHash(a.owner_id) - lawnHash(b.owner_id) || a.owner_id.localeCompare(b.owner_id);
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const rotate = <T,>(list: T[], seed: number) => list.map((_, index) => list[(seed + index) % list.length]);

export function activeVisit(entry: ShowcaseEntry, now: number) {
  return entry.emote === "visit" && entry.emote_target && entry.emote_until && Date.parse(entry.emote_until) > now ? entry.emote_target : undefined;
}

function selectVisitors(entries: ShowcaseEntry[], viewerId: string | null | undefined, mine: ShowcaseEntry | null | undefined, windowIndex: number, limit: number, now: number) {
  const own = entries.find((entry) => entry.owner_id === viewerId) ?? (mine && !mine.hidden ? mine : undefined);
  const ownVisit = own ? activeVisit(own, now) : undefined;
  const others = entries.filter((entry) => entry.owner_id !== viewerId).sort(byStableHash);
  const capacity = Math.max(0, limit - (own ? 1 : 0));
  const pinned = others.filter((entry) => entry.owner_id === ownVisit || (viewerId && activeVisit(entry, now) === viewerId)).slice(0, capacity);
  const rest = others.filter((entry) => !pinned.includes(entry));
  const room = capacity - pinned.length;
  let visitors = rest;
  if (rest.length > room) {
    const start = (windowIndex * Math.max(room, 1)) % Math.max(rest.length, 1);
    visitors = Array.from({ length: room }, (_, index) => rest[(start + index) % rest.length]);
  }
  return { chosen: [...(own ? [own] : []), ...pinned, ...visitors], total: others.length + (own ? 1 : 0) };
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

function itemFor(pose: YardPose, seed: number): YardItem | undefined {
  if (pose === "eat") return seed % 2 ? "milk" : "onigiri";
  if (pose === "read") return "book";
  if (pose === "pillow") return "pillow";
  if (pose === "kick") return "ball";
  return undefined;
}

function activityFor(scene: YardScene, kind: SpotKind, pose: YardPose) {
  const place = scene.placeLabels[kind];
  return place.startsWith("ใต้") ? `${POSE_VERBS[pose]}${place}` : `${POSE_VERBS[pose]}ที่${place}`;
}

export function planLawn({ entries, scene, viewerId, mine, now, limit = LAWN_SCENE_LIMIT }: LawnPlanInput): LawnPlan {
  const windowIndex = lawnWindow(now);
  const phase = lawnPhase(now);
  const { chosen, total } = selectVisitors(entries, viewerId, mine, windowIndex, Math.min(limit, scene.spots.length), now);
  const activeMood = (entry: ShowcaseEntry) => (entry.mood && entry.mood_until && Date.parse(entry.mood_until) > now ? entry.mood : undefined);
  const pairable = (entry: ShowcaseEntry) => activeMood(entry) !== "quiet";
  const preferredKinds = (entry: ShowcaseEntry) => moodKinds[activeMood(entry) ?? "surprise"] ?? [];
  const previous = selectVisitors(entries, viewerId, mine, windowIndex - 1, Math.min(limit, scene.spots.length), now).chosen;
  const recentPairs = chosen.filter(pairable).length > 2 ? new Set(circleMatching(previous.filter(pairable), windowIndex - 1).map(([a, b]) => pairKey(a.owner_id, b.owner_id))) : new Set<string>();
  const taken = new Set<string>();
  const placements: YardPlacement[] = [];
  const place = (entry: ShowcaseEntry, spotItem: YardSpot, pose: YardPose, seed: number, facing: "left" | "right", partnerId?: string) => {
    taken.add(spotItem.id);
    placements.push({ entry, spot: spotItem, pose, item: itemFor(pose, seed), partnerId, facing, activity: activityFor(scene, spotItem.kind, pose) });
  };

  const edges = scene.spots.flatMap((a) => a.neighbours.filter((id) => a.id < id).map((id) => [a, scene.spots.find((b) => b.id === id)!] as const))
    .filter(([a, b]) => SPOT_POSES[a.kind].pair.length > 0 && a.kind === b.kind);
  const byId = new Map(chosen.map((entry) => [entry.owner_id, entry]));
  const visiting = new Set<string>();
  for (const a of chosen) {
    const b = byId.get(activeVisit(a, now) ?? "");
    if (!b || b === a || visiting.has(a.owner_id) || visiting.has(b.owner_id)) continue;
    const edge = rotate(edges, lawnHash(pairKey(a.owner_id, b.owner_id))).find(([spotA, spotB]) => !taken.has(spotA.id) && !taken.has(spotB.id));
    if (!edge) continue;
    const [left, right] = edge[0].x <= edge[1].x ? edge : [edge[1], edge[0]];
    place(a, left, SPOT_POSES[left.kind].pair[0], 0, "right", b.owner_id);
    place(b, right, SPOT_POSES[left.kind].pair[0], 1, "left", a.owner_id);
    visiting.add(a.owner_id).add(b.owner_id);
  }
  for (const [a, b] of circleMatching(chosen.filter((entry) => pairable(entry) && !visiting.has(entry.owner_id)), windowIndex)) {
    const key = pairKey(a.owner_id, b.owner_id);
    const seed = lawnHash(`${windowIndex}:${key}`);
    if (recentPairs.has(key) || seed % 10 >= 7) continue;
    const liked = new Set([...preferredKinds(a), ...preferredKinds(b)]);
    const ordered = [...rotate(edges.filter(([spotA]) => liked.has(spotA.kind)), seed), ...rotate(edges.filter(([spotA]) => !liked.has(spotA.kind)), seed >>> 3)];
    const edge = ordered.find(([spotA, spotB]) => !taken.has(spotA.id) && !taken.has(spotB.id));
    if (!edge) continue;
    const [left, right] = edge[0].x <= edge[1].x ? edge : [edge[1], edge[0]];
    const poses = SPOT_POSES[left.kind].pair;
    const pose = poses[(seed >>> 5) % poses.length];
    place(a, left, pose, seed, "right", b.owner_id);
    place(b, right, pose === "kick" ? "chase" : pose, seed + 1, "left", a.owner_id);
  }

  const paired = new Set(placements.map((placement) => placement.entry.owner_id));
  for (const entry of chosen) {
    if (paired.has(entry.owner_id)) continue;
    const seed = lawnHash(`${windowIndex}:${entry.owner_id}`);
    const free = scene.spots.filter((candidate) => !taken.has(candidate.id));
    if (free.length === 0) break;
    const liked = preferredKinds(entry).length ? preferredKinds(entry) : phase === "night" ? nightKinds : [];
    const preferred = free.filter((candidate) => liked.includes(candidate.kind));
    const spotItem = (preferred.length ? rotate(preferred, seed) : rotate(free, seed))[0];
    const posesAtNight = phase === "night" ? SPOT_POSES[spotItem.kind].night : [];
    const solo = SPOT_POSES[spotItem.kind].solo;
    const pose = posesAtNight.length && (seed >>> 4) % 10 < 6 ? posesAtNight[0] : solo[(seed >>> 7) % solo.length];
    place(entry, spotItem, pose, seed, spotItem.facing);
  }

  return { windowIndex, total, phase, placements, cats: planCats(scene, placements, windowIndex, phase, limit < LAWN_SCENE_LIMIT, activeMood) };
}

function planCats(scene: YardScene, placements: YardPlacement[], windowIndex: number, phase: LawnPhase, lite: boolean, activeMood: (entry: ShowcaseEntry) => LawnMood | undefined): CatPlacement[] {
  const used = new Set<string>();
  const cats = lite ? LAWN_CATS.filter((cat) => cat.personality === "sleepy") : LAWN_CATS;
  const spotOf = (kind: CatSpot["kind"], seed: number) => rotate(scene.catSpots.filter((candidate) => candidate.kind === kind && !used.has(candidate.id)), seed)[0];
  const result: CatPlacement[] = [];
  for (const cat of cats) {
    const seed = lawnHash(`${windowIndex}:${cat.id}`);
    if (cat.personality === "sleepy") {
      const laps = placements.filter((placement) => placement.spot.kind === "bench" && lapPoses.includes(placement.pose) && activeMood(placement.entry) !== "quiet");
      const lap = laps.length ? laps[seed % laps.length] : undefined;
      if (lap) {
        result.push({ cat, pose: "lap", x: lap.spot.x, y: lap.spot.y, lapOf: lap.entry.owner_id });
        continue;
      }
    }
    const wants: CatSpot["kind"] =
      cat.personality === "foodie" && placements.some((placement) => placement.spot.kind === "table" && placement.pose === "eat") ? "beg"
        : cat.personality === "playful" && phase !== "night" && placements.some((placement) => placement.spot.kind === "play") ? "chase" : "loaf";
    const catSpot = spotOf(wants, seed) ?? spotOf("loaf", seed);
    if (!catSpot) continue;
    used.add(catSpot.id);
    result.push({ cat, pose: catSpot.kind === "beg" ? "beg" : catSpot.kind === "chase" ? "chase" : "loaf", x: catSpot.x, y: catSpot.y });
  }
  return result;
}
