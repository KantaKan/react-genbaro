import type { FarmPart } from "@/lib/farm-geometry";
import { terrainHeightAt } from "@/lib/farm-terrain";

function offsetPartsY(parts: FarmPart[], dy: number): FarmPart[] {
  if (dy === 0) return parts;
  return parts.map((p) => ({ ...p, position: [p.position[0], p.position[1] + dy, p.position[2]] }));
}

function hash(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * A light picket fence around the field perimeter — reinforces "farm" and
 * gives the land a finished edge. Purely decorative, no interaction.
 */
export function buildFenceParts(landW: number, landD: number): FarmPart[] {
  const parts: FarmPart[] = [];
  const postH = 0.9, postSpacing = 1.6, railY = 0.45;
  const postColor = "#f3ead9", railColor = "#e8dcc4";

  function edge(length: number, along: "x" | "z", fixedOther: number) {
    const count = Math.max(2, Math.round(length / postSpacing));
    for (let i = 0; i <= count; i++) {
      const t = (i / count - 0.5) * length;
      const x = along === "x" ? t : fixedOther;
      const z = along === "x" ? fixedOther : t;
      parts.push({ kind: "cylinder", args: [0.06, 0.06, postH, 5], position: [x, postH / 2, z], color: postColor });
    }
    const railArgs: [number, number, number] = along === "x" ? [length, 0.08, 0.05] : [0.05, 0.08, length];
    parts.push({
      kind: "box",
      args: railArgs,
      position: along === "x" ? [0, railY, fixedOther] : [fixedOther, railY, 0],
      color: railColor,
    });
  }

  const half = 0.02; // sit just outside the grass edge, avoiding z-fighting
  edge(landW, "x", -landD / 2 - half);
  edge(landW, "x", landD / 2 + half);
  edge(landD, "z", -landW / 2 - half);
  edge(landD, "z", landW / 2 + half);
  return parts;
}

/** A tiny toadstool prop — decorative only, unrelated to the Mushroom archetype. */
function toadstoolProp(x: number, z: number, seed: number): FarmPart[] {
  const scale = 0.55 + hash(seed) * 0.2;
  const stalkH = 0.5 * scale;
  return [
    { kind: "cylinder", args: [0.09 * scale, 0.12 * scale, stalkH, 6], position: [x, stalkH / 2, z], color: "#f3ead9" },
    { kind: "sphere", args: [0.32 * scale, 8, 5], position: [x, stalkH, z], color: "#d6432f", scale: [1, 0.6, 1] },
    { kind: "sphere", args: [0.05 * scale, 4, 3], position: [x - 0.14 * scale, stalkH + 0.06 * scale, z], color: "#fff6e8" },
    { kind: "sphere", args: [0.05 * scale, 4, 3], position: [x + 0.15 * scale, stalkH + 0.03 * scale, z + 0.05 * scale], color: "#fff6e8" },
  ];
}

/** A little cluster of round pebbles. */
function pebbleProp(x: number, z: number, seed: number): FarmPart[] {
  const parts: FarmPart[] = [];
  const count = 3 + Math.floor(hash(seed) * 2);
  for (let i = 0; i < count; i++) {
    const a = hash(seed + i * 3.1) * Math.PI * 2;
    const d = hash(seed + i * 5.7) * 0.25;
    const r = 0.08 + hash(seed + i * 2.3) * 0.07;
    parts.push({
      kind: "sphere",
      args: [r, 5, 4],
      position: [x + d * Math.cos(a), r * 0.7, z + d * Math.sin(a)],
      color: i % 2 === 0 ? "#9a998f" : "#b6b4a6",
      scale: [1, 0.7, 1],
    });
  }
  return parts;
}

/** A small tuft of flowers, cheaper and simpler than a full archetype. */
function flowerTuftProp(x: number, z: number, seed: number): FarmPart[] {
  const colors = ["#ff8fa3", "#ffd166", "#c8a2ff"];
  const parts: FarmPart[] = [];
  const count = 3;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + hash(seed + i) * 1.5;
    const d = 0.1 + hash(seed + i * 4.2) * 0.12;
    parts.push({ kind: "cylinder", args: [0.02, 0.03, 0.25, 4], position: [x + d * Math.cos(a), 0.125, z + d * Math.sin(a)], color: "#5f8a3f" });
    parts.push({ kind: "sphere", args: [0.08, 5, 4], position: [x + d * Math.cos(a), 0.28, z + d * Math.sin(a)], color: colors[i % colors.length] });
  }
  return parts;
}

/**
 * Scatters a small decorative prop on each unoccupied tile so empty grass
 * doesn't just look bare — cycles through three prop types for variety,
 * chosen deterministically by tile index so it doesn't reshuffle on redraw.
 */
export function buildGroundProps(emptyTiles: Array<{ x: number; z: number }>): FarmPart[] {
  const builders = [toadstoolProp, pebbleProp, flowerTuftProp];
  return emptyTiles.flatMap((tile, i) => builders[i % builders.length](tile.x, tile.z, i * 13.7 + 4.1));
}

/** A simple stylized tree — pure atmosphere, not tied to any learner's
 * plant, distinct from the Canopy archetype's genmate trees. */
function backgroundTreeProp(x: number, z: number, seed: number): FarmPart[] {
  const scale = 0.8 + hash(seed) * 0.6;
  const trunkH = 1.1 * scale;
  const leafColors = ["#4d7c3f", "#5f8a3f", "#3f6b32"];
  const parts: FarmPart[] = [
    { kind: "cylinder", args: [0.12 * scale, 0.18 * scale, trunkH, 6], position: [x, trunkH / 2, z], color: "#7a5a3a" },
  ];
  const canopyY = trunkH + 0.35 * scale;
  const blobs = 4;
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + hash(seed + i * 2.2) * 1.2;
    const d = (0.12 + hash(seed + i * 4.4) * 0.1) * scale;
    const r = (0.35 + hash(seed + i * 6.6) * 0.15) * scale;
    parts.push({
      kind: "sphere",
      args: [r, 7, 5],
      position: [x + d * Math.cos(a), canopyY + hash(seed + i * 8.8) * 0.3 * scale, z + d * Math.sin(a)],
      color: leafColors[i % leafColors.length],
      scale: [1, 0.85, 1],
    });
  }
  return parts;
}

/**
 * A handful of decorative trees scattered just outside the fence line —
 * fills out the "empty field" feeling without touching tile layout or being
 * tied to any genmate's own plant. Sits on the terrain's rolling apron
 * (`terrainHeightAt`) rather than a fixed Y=0, since this zone is exactly
 * where the ground now has real height variation.
 */
export function buildBackgroundTrees(landW: number, landD: number): FarmPart[] {
  const count = 6;
  const parts: FarmPart[] = [];
  for (let i = 0; i < count; i++) {
    const side = i % 4;
    const along = hash(i * 17.3 + 2) - 0.5;
    const margin = 1.4 + hash(i * 9.1) * 1.2;
    let x = 0;
    let z = 0;
    if (side === 0) {
      x = along * landW;
      z = -landD / 2 - margin;
    } else if (side === 1) {
      x = along * landW;
      z = landD / 2 + margin;
    } else if (side === 2) {
      x = -landW / 2 - margin;
      z = along * landD;
    } else {
      x = landW / 2 + margin;
      z = along * landD;
    }
    const groundY = terrainHeightAt(x, z, landW / 2, landD / 2);
    parts.push(...offsetPartsY(backgroundTreeProp(x, z, i * 23.7 + 6.1), groundY));
  }
  return parts;
}
