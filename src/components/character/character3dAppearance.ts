import type { CharacterDNA } from "@/application/services/baroCharacterService";
import { characterPalette, characterPatternPoints } from "./characterAppearance";

// ponytail: new bodies/patterns/props from the friend expansion are 2D-only; 3D falls back to pebble scale + generic dots. Add cases here and in BaroCharacter3D.tsx when 3D parity matters.
const bodyScale: Record<string, [number, number, number]> = {
  pebble: [0.86, 0.87, 0.66], bean: [0.78, 1.02, 0.66], drop: [0.78, 1.03, 0.66],
  tall: [0.69, 1.1, 0.62], pillow: [1.02, 0.83, 0.61], pear: [0.9, 0.93, 0.68],
  squish: [1.03, 0.78, 0.67], cloud: [1.04, 0.86, 0.65], boxy: [0.85, 0.91, 0.59],
  wobble: [0.91, 0.88, 0.67], mushroom: [0.84, 0.9, 0.67], dumpling: [0.99, 0.78, 0.68],
};

export function resolveCharacter3D(dna: CharacterDNA, prop?: string) {
  return {
    palette: characterPalette(dna),
    body: dna.body,
    bodyScale: bodyScale[dna.body] ?? bodyScale.pebble,
    ears: dna.ears,
    eyes: dna.eyes,
    mark: dna.mark,
    pattern: dna.pattern,
    patternPoints: characterPatternPoints(dna.pattern_seed, 28),
    rarity: dna.rarity,
    prop: prop ?? "",
  };
}
