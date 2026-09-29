import type { CosmeticCatalogItem, CosmeticRarity } from "./cosmetic";

export interface TeacherGiftBox {
  id: string;
  user_id: string;
  minimum_rarity: CosmeticRarity;
  message: string;
  granted_by: string;
  status: "unopened" | "opened";
  reward?: CosmeticCatalogItem;
  created_at: string;
  opened_at?: string;
  source?: "reflection-milestone" | string;
  reward_pool?: "character-box" | string;
  transfer_history?: GiftBoxTransfer[];
}

export interface GiftBoxTransfer {
  from_id: string;
  from_name: string;
  to_id: string;
  to_name: string;
  transferred_at: string;
}

export interface GiftBoxRecipient {
  id: string;
  display_name: string;
  cohort_number: number;
  group: string;
  role: string;
}

export interface GiftBoxOdds {
  eligible_count: number;
  odds: Partial<Record<CosmeticRarity, number>>;
  complete: boolean;
}

export interface RewardDrawResult {
  idempotency_key: string;
  user_id: string;
  pool: string;
  minimum_rarity: CosmeticRarity;
  item: CosmeticCatalogItem;
  created_at: string;
}
