import type { CharacterDNA } from "@/application/services/baroCharacterService";

export const characterInk = "#292542";

export const characterPalettes: Record<string, { body: string; shade: string; accent: string }> = {
  Mint: { body: "#8cdab7", shade: "#56ac94", accent: "#f49b7c" },
  Peach: { body: "#f6ac8c", shade: "#df7e78", accent: "#ffdc76" },
  Lilac: { body: "#c7a5e9", shade: "#9d7bc9", accent: "#f6c4a1" },
  Honey: { body: "#f1c966", shade: "#d6a15d", accent: "#82c6b9" },
  Lagoon: { body: "#86cade", shade: "#5fa2c2", accent: "#f4a0ad" },
  Berry: { body: "#d99dbc", shade: "#b76e9b", accent: "#f2d16f" },
  Moss: { body: "#a6c887", shade: "#779e76", accent: "#f5ae80" },
  Cloud: { body: "#e5d7c8", shade: "#b9aab5", accent: "#96c8b5" },
};

export function characterPalette(dna: CharacterDNA) {
  return characterPalettes[dna.palette] ?? characterPalettes.Mint;
}

export function characterPatternPoints(seed: number, count: number) {
  let state = seed || 1;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return Array.from({ length: count }, () => ({ x: 55 + next() * 110, y: 105 + next() * 105, size: 3 + next() * 7, turn: next() * 60 - 30 }));
}
