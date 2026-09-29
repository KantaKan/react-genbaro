export type PlantCosmeticSlot = "palette" | "pot" | "aura" | "particle" | "accessory" | "mutation";
export type CharacterCosmeticSlot = "card_background" | "character_prop";
export type CosmeticSlot = PlantCosmeticSlot | CharacterCosmeticSlot;
export type CosmeticRarity = "Common" | "Rare" | "Epic" | "Legendary";

export interface CosmeticCatalogItem {
  id: string;
  name: string;
  slot: CosmeticSlot;
  rarity: CosmeticRarity;
  preview_value: string;
  source_hint: string;
  reward_pools: string[];
  starter: boolean;
}

export interface CosmeticCollectionItem extends CosmeticCatalogItem {
  owned: boolean;
  new: boolean;
  equipped: boolean;
  locked: boolean;
}

export interface CosmeticCollection {
  items: CosmeticCollectionItem[];
}
