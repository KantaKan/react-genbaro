import { api } from "@/infrastructure/api";
import type { ApiResponse } from "@/domain/types";

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

export const baroCharacterService = {
  async collection(): Promise<BaroCharacter[]> {
    const response = await api.get<ApiResponse<BaroCharacter[]>>("/baro-characters");
    return response.data.data;
  },
  async revealStarter(): Promise<BaroCharacter> {
    const response = await api.post<ApiResponse<BaroCharacter>>("/baro-characters/reveal");
    return response.data.data;
  },
  async growth(): Promise<CharacterGrowthSnapshot> {
    const response = await api.get<ApiResponse<CharacterGrowthSnapshot>>("/baro-characters/growth");
    return response.data.data;
  },
  async selection(): Promise<CharacterSelection> {
    const response = await api.get<ApiResponse<CharacterSelection>>("/baro-characters/selection");
    return response.data.data;
  },
  async equip(characterId: string): Promise<CharacterSelection> {
    const response = await api.put<ApiResponse<CharacterSelection>>("/baro-characters/equipped", { character_id: characterId });
    return response.data.data;
  },
  async pin(characterId: string): Promise<CharacterSelection> {
    const response = await api.put<ApiResponse<CharacterSelection>>("/baro-characters/pinned", { character_id: characterId });
    return response.data.data;
  },
  async adminCollection(userId: string): Promise<BaroCharacter[]> {
    const response = await api.get<ApiResponse<BaroCharacter[]>>(`/admin/users/${userId}/baro-characters`);
    return response.data.data;
  },
  async adminSelection(userId: string): Promise<CharacterSelection> {
    const response = await api.get<ApiResponse<CharacterSelection>>(`/admin/users/${userId}/baro-characters/selection`);
    return response.data.data;
  },
  async adminGrant(userId: string): Promise<BaroCharacter> {
    const response = await api.post<ApiResponse<BaroCharacter>>(`/admin/users/${userId}/baro-characters`);
    return response.data.data;
  },
  async adminEquip(userId: string, characterId: string): Promise<CharacterSelection> {
    const response = await api.put<ApiResponse<CharacterSelection>>(`/admin/users/${userId}/baro-characters/equipped`, { character_id: characterId });
    return response.data.data;
  },
  async adminPin(userId: string, characterId: string): Promise<CharacterSelection> {
    const response = await api.put<ApiResponse<CharacterSelection>>(`/admin/users/${userId}/baro-characters/pinned`, { character_id: characterId });
    return response.data.data;
  },
};
