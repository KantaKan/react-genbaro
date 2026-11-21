import {
  getAllPalettes,
  getPlantVariant,
  isSpecialPotStyle,
  POT_STYLES,
  type PlantVariantConfig,
  type PlantVariantOverrides,
} from "./plant-variants";
import {
  flourishAccentColors,
  getFlourishTier,
  getPlantTierConfig,
  type FlourishTier,
  type PlantTier,
  type PlantTierConfig,
} from "./streak-milestones";

export type PlantActivityState = "active" | "resting";
export type PlantCosmeticSlot = "palette" | "pot" | "aura" | "particle" | "accessory" | "mutation";
export type PlantCosmeticLoadout = Record<PlantCosmeticSlot, string | null>;
export type PlantCosmeticSelection = Partial<Record<PlantCosmeticSlot, string | null | undefined>>;

const COSMETIC_SLOTS: PlantCosmeticSlot[] = ["palette", "pot", "aura", "particle", "accessory", "mutation"];

function isPaletteCosmetic(value: string): boolean {
  return getAllPalettes().some((palette) => palette.name === value);
}

function isPotCosmetic(value: string): boolean {
  return (POT_STYLES as string[]).includes(value) || isSpecialPotStyle(value);
}

export interface ResolvePlantAppearanceInput {
  userId: string;
  tier: PlantTier;
  active: boolean;
  growthPoints?: number;
  overrides?: PlantVariantOverrides;
  cosmetics?: PlantCosmeticSelection;
}

export interface PlantGrowthAppearance {
  points: number;
  flourishTier: FlourishTier;
  flourishColor: string;
}

export interface PlantAppearance extends PlantVariantConfig {
  tier: PlantTier;
  state: PlantActivityState;
  growth: PlantGrowthAppearance;
  tierCapabilities: PlantTierConfig;
  cosmetics: PlantCosmeticLoadout;
}

function normalizeCosmetics(selection?: PlantCosmeticSelection): PlantCosmeticLoadout {
  const cosmetics = Object.fromEntries(
    COSMETIC_SLOTS.map((slot) => {
      const value = selection?.[slot]?.trim();
      return [slot, value || null];
    }),
  ) as PlantCosmeticLoadout;

  if (cosmetics.palette && !isPaletteCosmetic(cosmetics.palette)) cosmetics.palette = null;
  if (cosmetics.pot && !isPotCosmetic(cosmetics.pot)) cosmetics.pot = null;

  return cosmetics;
}

function applyCosmeticsToOverrides(
  overrides: PlantVariantOverrides | undefined,
  cosmetics: PlantCosmeticLoadout,
): PlantVariantOverrides {
  const resolved = { ...overrides };

  if (cosmetics.palette) {
    resolved.palette = cosmetics.palette;
  }

  if (cosmetics.pot) {
    resolved.pot = cosmetics.pot;
  }

  return resolved;
}

export function resolvePlantAppearance(input: ResolvePlantAppearanceInput): PlantAppearance {
  const cosmetics = normalizeCosmetics(input.cosmetics);
  const variant = getPlantVariant(input.userId, applyCosmeticsToOverrides(input.overrides, cosmetics));
  const points = input.growthPoints ?? 0;
  const flourishTier = getFlourishTier(points);

  return {
    ...variant,
    tier: input.tier,
    state: input.active ? "active" : "resting",
    growth: {
      points,
      flourishTier,
      flourishColor: flourishAccentColors[flourishTier],
    },
    tierCapabilities: getPlantTierConfig(input.tier),
    cosmetics,
  };
}
