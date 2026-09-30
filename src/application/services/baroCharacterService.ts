import { api } from "@/infrastructure/api";
import type { ApiResponse } from "@/domain/types";
import type { BaroCharacter, CharacterGrowthSnapshot, CharacterSelection } from "@/domain/types/baro-character";

export type { BaroCharacter, CharacterDNA, CharacterGrowthSnapshot, CharacterRarity, CharacterSelection } from "@/domain/types/baro-character";

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
