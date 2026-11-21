import * as THREE from "three";
import type { FarmPart } from "@/lib/farm-geometry";

const TEXTURE_SIZE = 64;
const SPECKLE_COUNT = 48;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function seededRandom(seed: number): () => number {
  let s = seed % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function shade(hex: string, amount: number): string {
  const parsed = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  const r = clamp(((parsed >> 16) & 0xff) + amount);
  const g = clamp(((parsed >> 8) & 0xff) + amount);
  const b = clamp((parsed & 0xff) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

/** `FarmPart.args` mixes spatial dimensions with mesh-quality integers
 * (radialSegments, widthSegments...) that must never drive tiling density —
 * a thin 8-segment stem and a wide 8-segment pot would otherwise tile
 * identically because the segment count, not the radius, dominates `Math.max`. */
function spatialDims(part: FarmPart): number[] {
  switch (part.kind) {
    case "cylinder":
      return [part.args[0], part.args[1], part.args[2]];
    case "sphere":
      return [part.args[0]];
    case "box":
      return [part.args[0], part.args[1], part.args[2]];
    case "torus":
      return [part.args[0], part.args[1]];
  }
}

/** Derives a repeat count from a part's own size so a thin stem doesn't
 * stretch one grain blob over its whole length while a wide pot doesn't tile
 * too densely — both ends of the archetype size range share one texture. */
export function repeatForPart(part: FarmPart): [number, number] {
  const scale = part.scale ?? [1, 1, 1];
  const maxDim = Math.max(...spatialDims(part)) * Math.max(...scale);
  const n = Math.max(1, Math.round(maxDim * 1.2));
  return [n, n];
}

const textureCache = new Map<string, THREE.CanvasTexture | null>();

/** A small procedural grain texture tinted to `hexColor` — every plant part
 * uses the same generator, keyed only by its own resolved palette color, so
 * bark/leaf/petal/pot all get texture instead of flat color without needing
 * a separate pattern (and a `role` field) per surface type. */
export function getPartTexture(hexColor: string): THREE.CanvasTexture | null {
  const cached = textureCache.get(hexColor);
  if (cached !== undefined) return cached;

  let texture: THREE.CanvasTexture | null = null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = TEXTURE_SIZE;
    canvas.height = TEXTURE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");

    ctx.fillStyle = hexColor;
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    const rand = seededRandom(hashString(hexColor));
    for (let i = 0; i < SPECKLE_COUNT; i++) {
      const lighter = rand() > 0.5;
      ctx.fillStyle = shade(hexColor, lighter ? 28 : -28);
      ctx.globalAlpha = 0.12 + rand() * 0.18;
      const x = rand() * TEXTURE_SIZE;
      const y = rand() * TEXTURE_SIZE;
      const r = 1 + rand() * 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
  } catch {
    texture = null;
  }

  textureCache.set(hexColor, texture);
  return texture;
}

const TOON_STEPS = 4;
let toonGradientMap: THREE.DataTexture | null = null;

/** A hard-stepped gradient for `meshToonMaterial` — flat color bands instead
 * of smooth shading, the "toylike" cel-shaded look. One shared instance for
 * the whole scene since the banding itself isn't a per-color choice. Built
 * from a raw typed array rather than canvas so it also works in the rare
 * case canvas 2D is unavailable (unlike `getPartTexture`, this has no
 * meaningful color-image fallback to drop to). */
export function getToonGradientMap(): THREE.DataTexture {
  if (toonGradientMap) return toonGradientMap;
  const data = new Uint8Array(TOON_STEPS);
  for (let i = 0; i < TOON_STEPS; i++) data[i] = Math.round((i / (TOON_STEPS - 1)) * 255);
  const tex = new THREE.DataTexture(data, TOON_STEPS, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  toonGradientMap = tex;
  return tex;
}
