import type { PlantTier } from "@/lib/streak-milestones"

/* ─── Seeded PRNG ─── */

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function createPRNG(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) & 0x7fffffff
    return state / 0x7fffffff
  }
}

/* ─── Color Palettes ─── */

export interface PlantPalette {
  name: string
  stem: string
  leaf: string
  flower: string
  fruit: string
  glow: string
  soil: string
  pot: string
}

const PALETTES: PlantPalette[] = [
  {
    name: "Forest",
    stem: "#2e7d32",
    leaf: "#43a047",
    flower: "#f48fb1",
    fruit: "#e9c46a",
    glow: "#66bb6a",
    soil: "#5c4033",
    pot: "#c77d61",
  },
  {
    name: "Sunset",
    stem: "#d84315",
    leaf: "#ff8f00",
    flower: "#ff7043",
    fruit: "#ffcc02",
    glow: "#ffa726",
    soil: "#4e342e",
    pot: "#bf5b2a",
  },
  {
    name: "Ocean",
    stem: "#00695c",
    leaf: "#00897b",
    flower: "#81d4fa",
    fruit: "#ffd54f",
    glow: "#4dd0e1",
    soil: "#37474f",
    pot: "#546e7a",
  },
  {
    name: "Desert",
    stem: "#a1887f",
    leaf: "#8d6e63",
    flower: "#d4a574",
    fruit: "#bf8f4a",
    glow: "#bcaaa4",
    soil: "#5d4037",
    pot: "#d7a86e",
  },
  {
    name: "Rose",
    stem: "#1b5e20",
    leaf: "#388e3c",
    flower: "#e91e63",
    fruit: "#f9a825",
    glow: "#f06292",
    soil: "#4e342e",
    pot: "#8d6e63",
  },
  {
    name: "Lavender",
    stem: "#4a148c",
    leaf: "#6a1b9a",
    flower: "#ce93d8",
    fruit: "#e1bee7",
    glow: "#ab47bc",
    soil: "#3e2723",
    pot: "#7b1fa2",
  },
  {
    name: "Sunshine",
    stem: "#f57f17",
    leaf: "#fbc02d",
    flower: "#fff176",
    fruit: "#ff6f00",
    glow: "#ffee58",
    soil: "#4e342e",
    pot: "#e65100",
  },
  {
    name: "Mint",
    stem: "#004d40",
    leaf: "#14a37f",
    flower: "#f8bbd0",
    fruit: "#4db6ac",
    glow: "#26a69a",
    soil: "#37474f",
    pot: "#78909c",
  },
  {
    name: "Coral",
    stem: "#bf360c",
    leaf: "#e64a19",
    flower: "#ff8a80",
    fruit: "#ffab91",
    glow: "#ff6e40",
    soil: "#3e2723",
    pot: "#a1887f",
  },
  {
    name: "Autumn",
    stem: "#5d4037",
    leaf: "#8d6e63",
    flower: "#bf360c",
    fruit: "#e65100",
    glow: "#a1887f",
    soil: "#3e2723",
    pot: "#6d4c41",
  },
]

/* ─── Pot Shapes ─── */

export interface PotPaths {
  bottom: string
  rim: string
}

type PotStyle = "round" | "square" | "tall" | "bowl"

const POT_PATHS: Record<PotStyle, PotPaths> = {
  round: {
    bottom: "M9 44 C9 50 13 51.5 20 51.5 C27 51.5 31 50 31 44 Z",
    rim: "M7 44 L33 44 L31 41 L9 41 Z",
  },
  square: {
    bottom: "M9 44 L9 50 L31 50 L31 44 Z",
    rim: "M7 44 L33 44 L31 41 L9 41 Z",
  },
  tall: {
    bottom: "M11 42 C11 51 15 52 20 52 C25 52 29 51 29 42 Z",
    rim: "M8 42 L32 42 L30 39 L10 39 Z",
  },
  bowl: {
    bottom: "M7 46 C7 52 13 52 20 52 C27 52 33 52 33 46 Z",
    rim: "M5 46 L35 46 L32 43 L8 43 Z",
  },
}

/* ─── Leaf Shapes (relative, pointing up-left) ─── */

type LeafStyle = "rounded" | "pointed" | "wide"

const LEAF_PATHS: Record<LeafStyle, string> = {
  rounded: "M0 0 Q-5 -3 -4.5 -6 Q-2.5 -4 0 0",
  pointed: "M0 0 Q-3 -1 -2 -8 Q-1 -3 0 0",
  wide: "M0 0 Q-7 -2 -6.5 -5 Q-4 -4 0 0",
}

/* ─── Flower Types ─── */

type FlowerType = "daisy" | "tulip" | "star"

/* ─── Stem Styles ─── */

type StemStyle = "straight" | "curved" | "leaning"

const STEM_TILTS: Record<StemStyle, number> = {
  straight: 0,
  curved: -3,
  leaning: 5,
}

/* ─── Variant Config ─── */

export interface PlantVariantConfig {
  palette: PlantPalette
  pot: PotStyle
  leaf: LeafStyle
  flower: FlowerType
  stem: StemStyle
}

export function getPlantVariant(userId: string): PlantVariantConfig {
  const seed = hashString(userId)
  const rand = createPRNG(seed)
  return {
    palette: PALETTES[Math.floor(rand() * PALETTES.length)],
    pot: (["round", "square", "tall", "bowl"] as PotStyle[])[Math.floor(rand() * 4)],
    leaf: (["rounded", "pointed", "wide"] as LeafStyle[])[Math.floor(rand() * 3)],
    flower: (["daisy", "tulip", "star"] as FlowerType[])[Math.floor(rand() * 3)],
    stem: (["straight", "curved", "leaning"] as StemStyle[])[Math.floor(rand() * 3)],
  }
}

/* ─── Tier-specific leaf positions ─── */

interface LeafPos {
  x: number
  y: number
}

const LEAF_POSITIONS: Record<PlantTier, LeafPos[]> = {
  0: [],
  1: [{ x: 20, y: 36 }],
  2: [
    { x: 20, y: 36 },
    { x: 20, y: 31 },
  ],
  3: [
    { x: 20.5, y: 38 },
    { x: 19.5, y: 30 },
  ],
  4: [
    { x: 20.5, y: 38 },
    { x: 20, y: 30 },
    { x: 20, y: 24 },
  ],
  5: [
    { x: 21, y: 38 },
    { x: 20, y: 28 },
    { x: 20, y: 22 },
  ],
}

/* ─── Exported utilities ─── */

export function getPotPath(style: PotStyle): PotPaths {
  return POT_PATHS[style]
}

export function getLeafPath(style: LeafStyle): string {
  return LEAF_PATHS[style]
}

export function getStemTilt(style: StemStyle): number {
  return STEM_TILTS[style]
}

export function getLeafPositions(tier: PlantTier): LeafPos[] {
  return LEAF_POSITIONS[tier] ?? []
}

export function getFlowerPosition(tier: PlantTier): { x: number; y: number } | null {
  if (tier >= 5) return { x: 20, y: 15 }
  if (tier >= 4) return { x: 20, y: 17 }
  if (tier >= 3) return { x: 20, y: 21 }
  return null
}

export function getStemPath(tier: PlantTier): string {
  switch (tier) {
    case 1:
      return "M20 42 Q19 40 20.5 37 Q21 35 20 33"
    case 2:
      return "M20 42 L20 30"
    case 3:
      return "M20 42 Q21 36 19.5 30 Q19 26 20 22"
    case 4:
      return "M20 42 Q21.5 36 20 30 Q19 26 20 20"
    case 5:
      return "M20 42 Q22 35 20 28 Q19 24 20 18"
    default:
      return ""
  }
}
