import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CharacterDNA } from "@/application/services/baroCharacterService";
import { BaroCharacterArt } from "./BaroCharacterArt";
import { characterPalette, characterPatternPoints } from "./characterAppearance";
import { resolveCharacter3D } from "./character3dAppearance";

const common: CharacterDNA = { version: 1, body: "pebble", ears: "round", eyes: "dots", mark: "heart", palette: "Mint", pattern: "freckles", pattern_seed: 17431, rarity: "normal" };
const rare: CharacterDNA = { version: 1, body: "mushroom", ears: "cat", eyes: "spark", mark: "star", palette: "Berry", pattern: "egg", pattern_seed: 88891, rarity: "meme_rare" };
const legendary: CharacterDNA = { version: 1, body: "cloud", ears: "horn", eyes: "wide", mark: "moon", palette: "Lilac", pattern: "constellation", pattern_seed: 77290, rarity: "legendary" };

describe("2D and 3D character appearance", () => {
  it.each([["common", common, "flower"], ["meme rare", rare, "egg"], ["legendary", legendary, "halo"]])("resolves the same server DNA and equipped prop for %s", (_, dna, prop) => {
    const art = renderToStaticMarkup(<BaroCharacterArt dna={dna} id="preview" prop={prop} />);
    const figure = resolveCharacter3D(dna, prop);
    expect(figure.palette).toEqual(characterPalette(dna));
    expect(figure.patternPoints).toEqual(characterPatternPoints(dna.pattern_seed, 28));
    expect(figure).toMatchObject({ body: dna.body, ears: dna.ears, eyes: dna.eyes, mark: dna.mark, pattern: dna.pattern, rarity: dna.rarity, prop });
    expect(art).toContain(`data-character-prop="${prop}"`);
    expect(art).toContain(figure.palette.body);
    expect(art).toContain(dna.pattern);
  });

  it("keeps seed-specific common and rare patterns distinct in both renderers", () => {
    for (const dna of [common, rare, legendary]) {
      const changed = { ...dna, pattern_seed: dna.pattern_seed + 1 };
      expect(resolveCharacter3D(dna).patternPoints).not.toEqual(resolveCharacter3D(changed).patternPoints);
      expect(renderToStaticMarkup(<BaroCharacterArt dna={dna} id="first" />)).not.toEqual(renderToStaticMarkup(<BaroCharacterArt dna={changed} id="first" />));
    }
  });
});
