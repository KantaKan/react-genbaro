/** How far the ground mesh extends past the tile footprint — large enough to
 * comfortably cover `buildBackgroundTrees`' max placement distance (fence
 * margin + tree margin, up to ~2.6 units beyond the fence) plus the blend
 * band itself. */
export const TERRAIN_MARGIN = 5;

const BLEND_WIDTH = 2;
const MAX_AMPLITUDE = 0.6;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function hash(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

/** Cheap layered-sine "hills" — same deterministic-noise style already used
 * throughout `farm-geometry.ts`/`farm-decorations.ts`, no external noise lib. */
function hillNoise(x: number, z: number): number {
  const a = Math.sin(x * 0.35 + z * 0.2) * 0.5 + 0.5;
  const b = Math.sin(x * 0.13 - z * 0.31 + 4.7) * 0.5 + 0.5;
  const c = hash(Math.round(x * 3) * 12.9898 + Math.round(z * 3) * 78.233) - 0.5;
  return a * 0.6 + b * 0.4 + c * 0.15;
}

/**
 * `0` anywhere inside the tile footprint (the play surface tile-center math,
 * occlusion ordering, `ContactShadows`, and the grass patch all assume flat
 * ground there) — smoothstep-blended up to real rolling hills only in the
 * decorative apron beyond it, where the fence and background trees already
 * stand. Deterministic: same (x, z) always returns the same height.
 */
export function terrainHeightAt(x: number, z: number, flatHalfW: number, flatHalfD: number): number {
  const distX = Math.max(0, Math.abs(x) - flatHalfW);
  const distZ = Math.max(0, Math.abs(z) - flatHalfD);
  const dist = Math.hypot(distX, distZ);
  if (dist <= 0) return 0;
  const blend = smoothstep(0, BLEND_WIDTH, dist);
  const noise = Math.max(0, Math.min(1, (hillNoise(x, z) + 1) / 2));
  return blend * noise * MAX_AMPLITUDE;
}
