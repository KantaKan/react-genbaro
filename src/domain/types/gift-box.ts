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
}

export interface RewardDrawResult {
  idempotency_key: string;
  user_id: string;
  pool: string;
  minimum_rarity: CosmeticRarity;
  item: CosmeticCatalogItem;
  created_at: string;
}
