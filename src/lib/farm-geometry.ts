import type { PlantPalette, PlantSpecies } from "@/lib/plant-variants";
import type { PlantTier, PlantTierConfig } from "@/lib/streak-milestones";

/**
 * The 22 SVG species collapse into 8 archetypes by silhouette family — decided
 * in wayfinder ticket 09 after five spike revisions. pumpkin-vine has no clean
 * home (its real design has no vertical stem, unlike every archetype here) and
 * defaults to Mound as the closest fit; flagged there, not silently assumed.
 */
export type FarmArchetype =
  | "bloom"
  | "column"
  | "mound"
  | "canopy"
  | "frond"
  | "mushroom"
  | "topiary"
  | "flytrap";

const SPECIES_TO_ARCHETYPE: Record<PlantSpecies, FarmArchetype> = {
  flower: "bloom",
  tulip: "bloom",
  sunflower: "bloom",
  orchid: "bloom",
  cactus: "column",
  bamboo: "column",
  pine: "column",
  succulent: "mound",
  clover: "mound",
  grass: "mound",
  strawberry: "mound",
  "pumpkin-vine": "mound", // flagged in ticket 09 — no vertical stem in its real design
  tree: "canopy",
  palm: "canopy",
  bonsai: "canopy",
  fern: "frond",
  vine: "frond",
  coral: "frond",
  lotus: "frond",
  mushroom: "mushroom",
  topiary: "topiary",
  flytrap: "flytrap",
};

export function archetypeForSpecies(species: PlantSpecies): FarmArchetype {
  return SPECIES_TO_ARCHETYPE[species] ?? "bloom";
}

export type FarmPartKind = "cylinder" | "sphere" | "box" | "torus";

export interface FarmPart {
  kind: FarmPartKind;
  /** cylinder: [radiusTop, radiusBottom, height, radialSegments]; sphere: [radius, widthSegments, heightSegments]; box: [width, height, depth] */
  args: readonly number[];
  /** Local position — relative to `pivot` when set, otherwise world space. */
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color: string;
  /**
   * three.js rotates a mesh around its own geometric center, not an arbitrary
   * point — so a part that needs to hinge from its base (a leaf swinging out
   * from the stem, a jaw opening from its hinge edge) can't just carry its own
   * rotation. `pivot` describes a wrapper group at a fixed world point and
   * rotation; `position`/`rotation` above then place the mesh *inside* that
   * group, so the rotation visibly pivots from the group's origin instead of
   * the mesh's own center.
   */
  pivot?: { position: [number, number, number]; rotation: [number, number, number] };
}

function cyl(rTop: number, rBottom: number, height: number, x: number, y: number, z: number, color: string, segments = 8): FarmPart {
  return { kind: "cylinder", args: [rTop, rBottom, height, segments], position: [x, y, z], color };
}
function sph(radius: number, x: number, y: number, z: number, color: string, scale?: [number, number, number], widthSeg = 8, heightSeg = 6): FarmPart {
  return { kind: "sphere", args: [radius, widthSeg, heightSeg], position: [x, y, z], color, scale };
}

const POT_TOP_Y = 2.6;

// Matches the real 2D pot's face exactly (streak-components.tsx: two eyes, a
// smile arc, blush cheeks) — only drawn when active, same gating as the 2D
// version. Placed on the pot's +Z face; the pot is symmetric so any fixed
// viewing angle works as well as the 2D art's single fixed front view did.
function potFaceParts(outlineColor: string): FarmPart[] {
  const z = 2.95;
  return [
    sph(0.28, -0.6, 1.05, z, outlineColor, undefined, 4, 3),
    sph(0.28, 0.6, 1.05, z, outlineColor, undefined, 4, 3),
    {
      kind: "torus",
      args: [0.75, 0.09, 6, 10, (Math.PI * 2) / 3],
      position: [0, 0.7, z],
      rotation: [0, 0, (210 * Math.PI) / 180],
      color: outlineColor,
    },
    sph(0.55, -1.4, 0.85, z - 0.05, "#f4a6c1", [1, 1, 0.4]),
    sph(0.55, 1.4, 0.85, z - 0.05, "#f4a6c1", [1, 1, 0.4]),
  ];
}

function potParts(pal: PlantPalette): FarmPart[] {
  const parts: FarmPart[] = [
    cyl(3.2, 2.6, 2.2, 0, 1.1, 0, pal.pot),
    cyl(2.9, 2.9, 0.4, 0, 2.4, 0, pal.soil),
  ];
  const active = pal.name !== "Inactive";
  if (active) parts.push(...potFaceParts("#3d3d3d"));
  return parts;
}
function seedPart(pal: PlantPalette): FarmPart {
  return sph(0.55, 0, POT_TOP_Y + 0.4, 0, pal.stem, undefined, 6, 4);
}

function ringAccents(count: number, radius: number, y: number, size: number, color: string): FarmPart[] {
  const out: FarmPart[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    out.push(sph(size, radius * Math.cos(a), y, radius * Math.sin(a), color, undefined, 4, 3));
  }
  return out;
}

/**
 * A single straight cylinder topped with one sphere read as exactly what you'd
 * expect once it was tall enough — a real proportions bug, not a taste call.
 * Splitting the stem into offset segments kills that reading. Verified in the
 * spike (https://claude.ai/code/artifact/c78b6a76-bbc7-445a-8efd-f327213f1a6b)
 * across every archetype/tier/palette combination before this port.
 */
function bentStem(rTop: number, rBottom: number, height: number, color: string, bend: number): { parts: FarmPart[]; topX: number } {
  const segCount = 3;
  const segH = height / segCount;
  const xs = [0];
  for (let i = 1; i <= segCount; i++) xs.push(Math.sin((i / segCount) * Math.PI * 0.65) * bend * height);
  const parts: FarmPart[] = [];
  let y = 0;
  for (let s = 0; s < segCount; s++) {
    const rT = rBottom + (rTop - rBottom) * ((s + 1) / segCount);
    const rB = rBottom + (rTop - rBottom) * (s / segCount);
    parts.push(cyl(rT, rB, segH, (xs[s] + xs[s + 1]) / 2, y + segH / 2, 0, color));
    y += segH;
  }
  return { parts, topX: xs[segCount] };
}

function clusterBlob(count: number, spreadR: number, blobR: number, y: number, color: string, seed: number): FarmPart[] {
  const out: FarmPart[] = [];
  for (let i = 0; i < count; i++) {
    const yFrac = count > 1 ? 1 - (i / (count - 1)) * 2 : 0;
    const ringR = Math.sqrt(Math.max(0, 1 - yFrac * yFrac));
    const theta = i * 2.399963 + seed;
    const cx = Math.cos(theta) * ringR * spreadR;
    const cz = Math.sin(theta) * ringR * spreadR;
    const cy = yFrac * spreadR * 0.7;
    const r = blobR * (0.75 + hash(i * 3.3 + seed) * 0.35);
    out.push(sph(r, cx, y + cy, cz, color, [1, 0.82, 1]));
  }
  return out;
}

function hash(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

function sideLeaf(y: number, angle: number, tilt: number, len: number, color: string): FarmPart {
  return {
    kind: "box",
    args: [0.2, len, 0.5],
    position: [0, len / 2, 0], // base at the pivot, extending outward
    color,
    pivot: { position: [0, y, 0], rotation: [0, angle, tilt] },
  };
}

interface ArchetypeMeta {
  hasFlower: boolean;
  hasFruit: boolean;
}

type ArchetypeBuilder = (tier: PlantTier, pal: PlantPalette, meta: ArchetypeMeta) => FarmPart[];

const bloom: ArchetypeBuilder = (tier, pal, meta) => {
  const parts = potParts(pal);
  if (tier === 0) return [...parts, seedPart(pal)];
  const stemH = 1 + tier * 0.8;
  const stem = bentStem(0.42, 0.32, stemH, pal.stem, 0.16);
  parts.push(...stem.parts.map((p) => offsetY(p, POT_TOP_Y)));
  if (tier >= 2) {
    parts.push(sideLeaf(POT_TOP_Y + stemH * 0.4, 0.6, 1.0, 0.9 + tier * 0.08, pal.leaf));
    parts.push(sideLeaf(POT_TOP_Y + stemH * 0.4, 0.6 + Math.PI, -1.0, 0.9 + tier * 0.08, pal.leaf));
  }
  if (tier >= 4) {
    parts.push(sideLeaf(POT_TOP_Y + stemH * 0.7, 2.3, 1.05, 0.7 + tier * 0.06, pal.leaf));
    parts.push(sideLeaf(POT_TOP_Y + stemH * 0.7, 2.3 + Math.PI, -1.05, 0.7 + tier * 0.06, pal.leaf));
  }
  const canR = 0.85 + tier * 0.22;
  const canY = POT_TOP_Y + stemH + canR * 0.5;
  const topX = stem.topX;
  parts.push(...clusterBlob(4, canR * 0.65, canR * 0.6, canY, pal.leaf, tier).map((p) => offsetX(p, topX)));
  if (meta.hasFlower) parts.push(...ringAccents(5, canR * 0.85, canY + canR * 0.35, 0.4, pal.flower).map((p) => offsetX(p, topX)));
  if (meta.hasFruit) parts.push(...ringAccents(3, canR * 0.75, canY - canR * 0.35, 0.36, pal.fruit).map((p) => offsetX(p, topX)));
  return parts;
};

const column: ArchetypeBuilder = (tier, pal, meta) => {
  const parts = potParts(pal);
  if (tier === 0) return [...parts, seedPart(pal)];
  const segments = Math.min(1 + Math.floor(tier / 1.4), 6);
  const segH = 1.3;
  let y = POT_TOP_Y;
  for (let i = 0; i < segments; i++) {
    const rTop = 0.75 - i * 0.05;
    const rBot = 0.85 - i * 0.05;
    parts.push(cyl(rTop, rBot, segH, 0, y + segH / 2, 0, pal.stem));
    y += segH * 0.92;
  }
  if (meta.hasFlower) parts.push(sph(0.55, 0, y + 0.2, 0, pal.flower, undefined, 6, 4));
  if (meta.hasFruit) parts.push(...ringAccents(2, 0.85, y - segH * 0.6, 0.4, pal.fruit));
  return parts;
};

const mound: ArchetypeBuilder = (tier, pal, meta) => {
  const parts = potParts(pal);
  if (tier === 0) return [...parts, seedPart(pal)];
  const count = Math.min(3 + tier, 11);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + i * 0.7;
    // Blob radius cycled on i%3 alone (no tier term) meant Mound's silhouette
    // spread outward with tier but never grew taller — every other archetype
    // visibly gains height, so a flat one broke the farm's growth language.
    // The +tier*0.03 keeps Mound "low and wide" (much less height gain than
    // Bloom/Canopy) while still growing, verified in farm-geometry.test.ts.
    const rr = 0.55 + (i % 3) * 0.15 + tier * 0.03;
    const dist = 0.6 + tier * 0.09;
    parts.push(sph(rr, dist * Math.cos(a), POT_TOP_Y + 0.5 + rr * 0.4, dist * Math.sin(a), pal.leaf, undefined, 6, 4));
  }
  if (meta.hasFlower) parts.push(...ringAccents(4, 0.9, POT_TOP_Y + 1.3, 0.35, pal.flower));
  if (meta.hasFruit) parts.push(...ringAccents(3, 1.1, POT_TOP_Y + 0.3, 0.32, pal.fruit));
  return parts;
};

const canopy: ArchetypeBuilder = (tier, pal, meta) => {
  const parts = potParts(pal);
  if (tier === 0) return [...parts, seedPart(pal)];
  const trunkH = 1.5 + tier * 0.7;
  const trunk = bentStem(0.65, 0.5, trunkH, pal.stem, 0.1);
  parts.push(...trunk.parts.map((p) => offsetY(p, POT_TOP_Y)));
  const crownR = 1.2 + tier * 0.3;
  const topY = POT_TOP_Y + trunkH + crownR * 0.4;
  const topX = trunk.topX;
  // Three short angled limbs bridge the bare trunk into the crown, so the
  // foliage reads as growing off branches rather than stuck on a stick.
  const branchY = topY - crownR * 0.35;
  const branchLen = crownR * 0.5;
  for (let i = 0; i < 3; i++) {
    const angle = 0.9 + i * ((Math.PI * 2) / 3);
    parts.push({
      kind: "cylinder",
      args: [0.08, 0.16, branchLen, 6],
      position: [0, branchLen / 2, 0],
      color: pal.stem,
      pivot: { position: [topX, branchY, 0], rotation: [0, angle, 1.1] },
    });
  }
  // Two size scales of foliage clumps read as real clustered leaves instead
  // of one big blob — a large outer layer plus a denser inner layer.
  parts.push(...clusterBlob(8, crownR * 0.7, crownR * 0.5, topY, pal.leaf, tier + 5).map((p) => offsetX(p, topX)));
  parts.push(...clusterBlob(5, crownR * 0.4, crownR * 0.42, topY - crownR * 0.1, pal.leaf, tier + 17).map((p) => offsetX(p, topX)));
  if (meta.hasFlower) parts.push(...ringAccents(4, crownR * 0.85, topY + crownR * 0.4, 0.35, pal.flower).map((p) => offsetX(p, topX)));
  if (meta.hasFruit) parts.push(...ringAccents(4, crownR * 0.9, topY - crownR * 0.5, 0.32, pal.fruit).map((p) => offsetX(p, topX)));
  return parts;
};

const frond: ArchetypeBuilder = (tier, pal, meta) => {
  const parts = potParts(pal);
  if (tier === 0) return [...parts, seedPart(pal)];
  const count = Math.min(3 + tier, 10);
  const bladeLen = 1.5 + tier * 0.6;
  for (let i = 0; i < count; i++) {
    const tilt = -0.55 + (i % 2) * 0.1;
    const angle = (i / count) * Math.PI * 2;
    parts.push({
      kind: "box",
      args: [0.3, bladeLen, 0.1],
      position: [0, bladeLen / 2, 0],
      color: pal.leaf,
      pivot: { position: [0, POT_TOP_Y, 0], rotation: [0, angle, tilt] },
    });
  }
  if (meta.hasFlower) parts.push(sph(0.4, 0, POT_TOP_Y + bladeLen * 0.7, 0, pal.flower, undefined, 6, 4));
  return parts;
};

const mushroom: ArchetypeBuilder = (tier, pal, meta) => {
  const parts = potParts(pal);
  if (tier === 0) return [...parts, seedPart(pal)];
  const stalkH = 1 + tier * 0.65;
  const stalk = bentStem(0.42, 0.55, stalkH, "#f3e9d8", 0.06);
  parts.push(...stalk.parts.map((p) => offsetY(p, POT_TOP_Y)));
  const capR = 1.1 + tier * 0.4;
  const topX = stalk.topX;
  parts.push(sph(capR, topX, POT_TOP_Y + stalkH + capR * 0.1, 0, pal.leaf, [1, 0.42, 1], 8, 5));
  if (meta.hasFlower) parts.push(...ringAccents(5, capR * 0.65, POT_TOP_Y + stalkH + capR * 0.25, 0.22, pal.flower).map((p) => offsetX(p, topX)));
  if (meta.hasFruit) parts.push(...ringAccents(3, 0.7, POT_TOP_Y + 0.3, 0.3, pal.fruit));
  return parts;
};

const topiary: ArchetypeBuilder = (tier, pal, meta) => {
  const parts = potParts(pal);
  if (tier === 0) return [...parts, seedPart(pal)];
  const stickH = 1.2 + tier * 0.65;
  const stick = bentStem(0.32, 0.4, stickH, pal.stem, 0.14);
  parts.push(...stick.parts.map((p) => offsetY(p, POT_TOP_Y)));
  const ballR = 0.95 + tier * 0.26;
  const ballY = POT_TOP_Y + stickH + ballR * 0.55;
  const topX = stick.topX;
  parts.push(...clusterBlob(6, ballR * 0.55, ballR * 0.62, ballY, pal.leaf, tier + 11).map((p) => offsetX(p, topX)));
  if (meta.hasFlower) parts.push(...ringAccents(6, ballR * 0.9, ballY, 0.28, pal.flower).map((p) => offsetX(p, topX)));
  if (meta.hasFruit) parts.push(...ringAccents(4, ballR * 0.7, ballY - ballR * 0.5, 0.26, pal.fruit).map((p) => offsetX(p, topX)));
  return parts;
};

const flytrap: ArchetypeBuilder = (tier, pal, meta) => {
  const parts = potParts(pal);
  if (tier === 0) return [...parts, seedPart(pal)];
  const stalkH = 0.8 + tier * 0.5;
  parts.push(cyl(0.35, 0.4, stalkH, 0, POT_TOP_Y + stalkH / 2, 0, pal.stem));
  const trapCount = Math.min(1 + Math.floor(tier / 2), 4);
  const topY = POT_TOP_Y + stalkH;
  for (let i = 0; i < trapCount; i++) {
    const angle = trapCount > 1 ? (i / trapCount) * Math.PI * 2 : 0;
    // Each jaw half hinges from x=0 (the pivot) and opens outward to x=±1 —
    // the pivot's own Y-rotation sweeps the whole hinged pair to face `angle`,
    // so the local offset here must stay un-rotated, not pre-multiplied by
    // cos/sin (that would double-apply the sweep).
    parts.push({
      kind: "box",
      args: [1.0, 0.14, 0.6],
      position: [0.5, 0, 0],
      color: pal.leaf,
      pivot: { position: [0, topY, 0], rotation: [0, angle, 0.5] },
    });
    parts.push({
      kind: "box",
      args: [1.0, 0.14, 0.6],
      position: [-0.5, 0, 0],
      color: pal.leaf,
      pivot: { position: [0, topY, 0], rotation: [0, angle, -0.5] },
    });
    if (meta.hasFlower) parts.push(sph(0.18, 0.4 * Math.cos(angle), topY, 0.4 * Math.sin(angle), pal.flower, undefined, 4, 3));
  }
  return parts;
};

const ARCHETYPE_BUILDERS: Record<FarmArchetype, ArchetypeBuilder> = {
  bloom,
  column,
  mound,
  canopy,
  frond,
  mushroom,
  topiary,
  flytrap,
};

export const FARM_ARCHETYPE_ORDER: FarmArchetype[] = [
  "bloom",
  "column",
  "mound",
  "canopy",
  "frond",
  "mushroom",
  "topiary",
  "flytrap",
];

function offsetY(part: FarmPart, dy: number): FarmPart {
  return { ...part, position: [part.position[0], part.position[1] + dy, part.position[2]] };
}
function offsetX(part: FarmPart, dx: number): FarmPart {
  return { ...part, position: [part.position[0] + dx, part.position[1], part.position[2]] };
}

/**
 * Matches `SeedlingPlant`'s exact grey fallback when a learner's streak has
 * lapsed (`active={false}`) — shape and tier stay the same, only color drops
 * to grey. Same values as streak-components.tsx's inline fallbacks.
 */
const INACTIVE_PALETTE: PlantPalette = {
  name: "Inactive",
  stem: "#a1a1aa",
  leaf: "#d4d4d8",
  flower: "#71717a",
  fruit: "#71717a",
  pot: "#9c8b7e",
  soil: "#6b5b4e",
  glow: "#a1a1aa",
};

export function buildArchetypeParts(archetype: FarmArchetype, tier: PlantTier, palette: PlantPalette, tierConfig: PlantTierConfig, active = true): FarmPart[] {
  const builder = ARCHETYPE_BUILDERS[archetype];
  return builder(tier, active ? palette : INACTIVE_PALETTE, { hasFlower: tierConfig.hasFlower, hasFruit: tierConfig.hasFruit });
}

export function buildPlantParts(species: PlantSpecies, tier: PlantTier, palette: PlantPalette, tierConfig: PlantTierConfig, active = true): FarmPart[] {
  return buildArchetypeParts(archetypeForSpecies(species), tier, palette, tierConfig, active);
}

/**
 * Ticket 04's cache: keyed on `(archetype, tier, paletteName)`, not species or
 * userId — geometry is a pure function of those three things, so two learners
 * with the same archetype/tier/palette combo share one cached entry. Species
 * is deliberately excluded from the key too: two species mapping to the same
 * archetype (e.g. "flower" and "tulip", both Bloom) produce identical parts,
 * so keying on species would cache the same geometry twice for no reason.
 * There is no staleness to invalidate — a tier or palette change just looks up
 * a different key, and the combination space is small enough (8 archetypes ×
 * 10 tiers × ~16 palettes ≈ 1,280 entries, each a few hundred triangles) to
 * keep every entry forever with no eviction policy.
 */
const partsCache = new Map<string, FarmPart[]>();
export function getCachedPlantParts(species: PlantSpecies, tier: PlantTier, palette: PlantPalette, tierConfig: PlantTierConfig, active = true): FarmPart[] {
  const archetype = archetypeForSpecies(species);
  const key = `${archetype}:${tier}:${active ? palette.name : "inactive"}`;
  const cached = partsCache.get(key);
  if (cached) return cached;
  const parts = buildArchetypeParts(archetype, tier, palette, tierConfig, active);
  partsCache.set(key, parts);
  return parts;
}

/** Applies a three.js-style Euler rotation (default 'XYZ' order, i.e. the
 * point is rotated Z first, then Y, then X) to a local point. Only used for
 * pivoted parts, whose rotation is never around their own center. */
function applyEulerXYZ(p: [number, number, number], rotation: [number, number, number]): [number, number, number] {
  const [rx, ry, rz] = rotation;
  let [x, y, z] = p;
  if (rz) {
    const c = Math.cos(rz), s = Math.sin(rz);
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  if (ry) {
    const c = Math.cos(ry), s = Math.sin(ry);
    [x, z] = [x * c + z * s, -x * s + z * c];
  }
  if (rx) {
    const c = Math.cos(rx), s = Math.sin(rx);
    [y, z] = [y * c - z * s, y * s + z * c];
  }
  return [x, y, z];
}

/** The world-space points worth checking for height/extent purposes: a plain
 * part's own position, or — for a pivoted part like a hinged leaf — both ends
 * of its long axis rotated through the pivot, since the rotation can swing
 * either end higher or wider than the part's local center alone would suggest. */
function worldSamplePoints(part: FarmPart): Array<[number, number, number]> {
  if (!part.pivot) return [[part.position[0], part.position[1], part.position[2]]];
  const halfExtent = part.kind === "cylinder" ? part.args[2] / 2 : part.kind === "box" ? part.args[1] / 2 : part.args[0];
  const scaleY = part.scale?.[1] ?? 1;
  const ends: Array<[number, number, number]> = [
    [part.position[0], part.position[1] - halfExtent * scaleY, part.position[2]],
    [part.position[0], part.position[1] + halfExtent * scaleY, part.position[2]],
  ];
  return ends.map((p) => {
    const [rx, ry, rz] = applyEulerXYZ(p, part.pivot!.rotation);
    return [rx + part.pivot!.position[0], ry + part.pivot!.position[1], rz + part.pivot!.position[2]];
  });
}

/** Real max height of a generated part set — used for the aura anchor and the
 * tile hit-box in the field. Ticket 09 found a shared per-tier height formula
 * floated the aura above short/wide archetypes like Mound; this measures the
 * actual mesh instead of guessing. */
export function maxPartHeight(parts: FarmPart[]): number {
  let maxY = 0;
  for (const part of parts) {
    const scaleY = part.scale?.[1] ?? 1;
    const halfExtent = part.pivot ? 0 : part.kind === "cylinder" ? part.args[2] / 2 : part.kind === "box" ? part.args[1] / 2 : part.args[0];
    for (const [, y] of worldSamplePoints(part)) {
      const top = y + halfExtent * scaleY;
      if (top > maxY) maxY = top;
    }
  }
  return maxY;
}

/** The widest horizontal extent across every archetype at tier 9 (the tallest,
 * widest growth state) — used to size farm tiles so neighboring canopies can't
 * interpenetrate. Ticket 02's answer: measure the real mesh, don't guess a
 * constant. */
export function maxHorizontalExtent(parts: FarmPart[]): number {
  let maxR = 0;
  for (const part of parts) {
    const scaleXZ = Math.max(part.scale?.[0] ?? 1, part.scale?.[2] ?? 1);
    const radius = part.kind === "cylinder" ? Math.max(part.args[0], part.args[1]) : part.kind === "box" ? Math.max(part.args[0], part.args[2]) / 2 : part.args[0];
    for (const [x, , z] of worldSamplePoints(part)) {
      const r = Math.hypot(x, z) + radius * scaleXZ;
      if (r > maxR) maxR = r;
    }
  }
  return maxR;
}
