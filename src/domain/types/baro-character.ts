export type CharacterRarity = "normal" | "meme_rare" | "legendary";

export interface CharacterDNA {
  version: number;
  body: string;
  ears: string;
  eyes: string;
  mark: string;
  palette: string;
  pattern: string;
  pattern_seed: number;
  rarity: CharacterRarity;
}

export interface BaroCharacter {
  id: string;
  owner_id: string;
  serial: string;
  dna: CharacterDNA;
  fingerprint: string;
  source: string;
  origin_key?: string;
  is_starter: boolean;
  created_at: string;
}

export interface CharacterGrowthSnapshot {
  best_streak: number;
  current_streak: number;
  mood: "active" | "resting";
  form_index: number;
  form_name: "tiny" | "playful" | "confident" | "legendary";
  detail_index: number;
  next_detail_at: number | null;
}

export interface CharacterSelection {
  equipped_id: string;
  pinned_id: string;
}
