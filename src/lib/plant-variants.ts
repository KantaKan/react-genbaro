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

// ponytail: names here mirror validPlantPalettes in baro-gofiber/internal/handler/user_handler.go — keep in sync
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
  {
    name: "Jade",
    stem: "#1e5631",
    leaf: "#3f8a5c",
    flower: "#a8e6a3",
    fruit: "#d9f2b4",
    glow: "#52c77e",
    soil: "#3e2723",
    pot: "#6d8a6d",
  },
  {
    name: "Berry",
    stem: "#6a1b4d",
    leaf: "#8e3b6a",
    flower: "#c2185b",
    fruit: "#ad1457",
    glow: "#ec407a",
    soil: "#3e2723",
    pot: "#7b4b5a",
  },
  {
    name: "Citrus",
    stem: "#558b2f",
    leaf: "#9ccc65",
    flower: "#fff59d",
    fruit: "#ffb300",
    glow: "#cddc39",
    soil: "#4e342e",
    pot: "#ef6c00",
  },
  {
    name: "Slate",
    stem: "#37474f",
    leaf: "#607d8b",
    flower: "#b0bec5",
    fruit: "#cfd8dc",
    glow: "#90a4ae",
    soil: "#263238",
    pot: "#455a64",
  },
  {
    name: "Blush",
    stem: "#ad7a99",
    leaf: "#d8a7c4",
    flower: "#ffc1e3",
    fruit: "#ffd6ec",
    glow: "#f48fb1",
    soil: "#4e342e",
    pot: "#c48b9f",
  },
  {
    name: "Midnight",
    stem: "#1a237e",
    leaf: "#3949ab",
    flower: "#7986cb",
    fruit: "#9fa8da",
    glow: "#5c6bc0",
    soil: "#263238",
    pot: "#303f9f",
  },
]

/* ─── Pot Shapes ─── */

export interface PotPaths {
  bottom: string
  rim: string
}

export type PotStyle = "round" | "square" | "tall" | "bowl"
export const POT_STYLES: PotStyle[] = ["round", "square", "tall", "bowl"]

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

export type LeafStyle = "rounded" | "pointed" | "wide"
export const LEAF_STYLES: LeafStyle[] = ["rounded", "pointed", "wide"]

const LEAF_PATHS: Record<LeafStyle, string> = {
  rounded: "M0 0 Q-5 -3 -4.5 -6 Q-2.5 -4 0 0",
  pointed: "M0 0 Q-3 -1 -2 -8 Q-1 -3 0 0",
  wide: "M0 0 Q-7 -2 -6.5 -5 Q-4 -4 0 0",
}

/* ─── Flower Types ─── */

export type FlowerType = "daisy" | "tulip" | "star"
export const FLOWER_TYPES: FlowerType[] = ["daisy", "tulip", "star"]

/* ─── Stem Styles ─── */

export type StemStyle = "straight" | "curved" | "leaning"
export const STEM_STYLES: StemStyle[] = ["straight", "curved", "leaning"]

const STEM_TILTS: Record<StemStyle, number> = {
  straight: 0,
  curved: -3,
  leaning: 5,
}

/* ─── Species ─── */

// Different growth topologies, not just recolors: flower/tree grow a canopy of
// leaf pairs up a stem, cactus stacks round paddle segments, succulent radiates
// a rosette from the pot rim, fern fans curved fronds from the base, vine drapes
// leaflets down over the pot rim, bamboo stacks thin jointed stalks, palm tops a
// bare trunk with a radiating frond crown, mushroom clusters cap-on-stalk fungi,
// pine stacks triangular tiers, clover mounds low trefoil clusters, orchid arches
// a sparse stem of butterfly blossoms, coral waves thick bulb-tipped tentacles,
// grass fans thin blades from the base, lotus floats flat pads with a rising bloom,
// bonsai layers flat pads along a zigzag trunk, flytrap radiates paired trap jaws,
// sunflower tops a bare stem with one big flower head, topiary balls a single
// round crown on a stick, strawberry mounds heart leaves with hanging berries,
// tulip clusters cup-shaped blooms on straight stems, pumpkin-vine creeps low
// and horizontal with gourds resting on the soil. See SpeciesCanopy in streak-components.tsx.
export type PlantSpecies =
  | "flower"
  | "cactus"
  | "succulent"
  | "tree"
  | "fern"
  | "vine"
  | "bamboo"
  | "palm"
  | "mushroom"
  | "pine"
  | "clover"
  | "orchid"
  | "coral"
  | "grass"
  | "lotus"
  | "bonsai"
  | "flytrap"
  | "sunflower"
  | "topiary"
  | "strawberry"
  | "tulip"
  | "pumpkin-vine"

export const SPECIES: PlantSpecies[] = [
  "flower",
  "cactus",
  "succulent",
  "tree",
  "fern",
  "vine",
  "bamboo",
  "palm",
  "mushroom",
  "pine",
  "clover",
  "orchid",
  "coral",
  "grass",
  "lotus",
  "bonsai",
  "flytrap",
  "sunflower",
  "topiary",
  "strawberry",
  "tulip",
  "pumpkin-vine",
]

/* ─── Variant Config ─── */

export interface PlantVariantConfig {
  palette: PlantPalette
  pot: PotStyle
  leaf: LeafStyle
  flower: FlowerType
  stem: StemStyle
  species: PlantSpecies
}

// Every field is a plain string because callers thread these straight through from
// API responses (e.g. member.selected_pot); invalid/unknown values fall back to the
// hash-derived default rather than erroring, same as the original palette override.
export interface PlantVariantOverrides {
  palette?: string
  species?: string
  pot?: string
  leaf?: string
  flower?: string
  stem?: string
}

export function getPlantVariant(userId: string, overrides?: PlantVariantOverrides): PlantVariantConfig {
  const seed = hashString(userId)
  const rand = createPRNG(seed)
  // Draw order must stay palette, pot, leaf, flower, stem, species — reordering would
  // reshuffle every unoverridden user's existing plant look.
  const hashedPalette = PALETTES[Math.floor(rand() * PALETTES.length)]
  const hashedPot = POT_STYLES[Math.floor(rand() * POT_STYLES.length)]
  const hashedLeaf = LEAF_STYLES[Math.floor(rand() * LEAF_STYLES.length)]
  const hashedFlower = FLOWER_TYPES[Math.floor(rand() * FLOWER_TYPES.length)]
  const hashedStem = STEM_STYLES[Math.floor(rand() * STEM_STYLES.length)]
  const hashedSpecies = SPECIES[Math.floor(rand() * SPECIES.length)]

  const overridePalette = overrides?.palette
    ? PALETTES.find((p) => p.name === overrides.palette)
    : undefined

  return {
    palette: overridePalette ?? hashedPalette,
    pot: overrides?.pot && (POT_STYLES as string[]).includes(overrides.pot) ? (overrides.pot as PotStyle) : hashedPot,
    leaf: overrides?.leaf && (LEAF_STYLES as string[]).includes(overrides.leaf) ? (overrides.leaf as LeafStyle) : hashedLeaf,
    flower:
      overrides?.flower && (FLOWER_TYPES as string[]).includes(overrides.flower)
        ? (overrides.flower as FlowerType)
        : hashedFlower,
    stem: overrides?.stem && (STEM_STYLES as string[]).includes(overrides.stem) ? (overrides.stem as StemStyle) : hashedStem,
    species:
      overrides?.species && (SPECIES as string[]).includes(overrides.species)
        ? (overrides.species as PlantSpecies)
        : hashedSpecies,
  }
}

export function getAllPalettes(): PlantPalette[] {
  return PALETTES
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
