import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CharacterDNA } from "@/application/services/baroCharacterService";
import { BaroCharacterArt } from "./BaroCharacterArt";

const base: CharacterDNA = {
  version: 1, body: "pebble", ears: "cat", eyes: "dots", mark: "heart",
  palette: "Mint", pattern: "freckles", pattern_seed: 1, rarity: "normal",
};

describe("BaroCharacterArt", () => {
  it.each(["freckles", "polka", "stripes", "waves", "marble", "checker", "sprouts", "hearts", "bubbles", "zigzag", "mosaic", "constellation", "paint", "petals", "egg", "potato", "ramen", "error404"])("makes %s visually depend on its permanent pattern seed", (pattern) => {
    const first = renderToStaticMarkup(<BaroCharacterArt dna={{ ...base, pattern, pattern_seed: 1 }} id="sample" />);
    const second = renderToStaticMarkup(<BaroCharacterArt dna={{ ...base, pattern, pattern_seed: 2 }} id="sample" />);
    expect(first).not.toBe(second);
  });
});
