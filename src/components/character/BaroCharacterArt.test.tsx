import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CharacterDNA } from "@/application/services/baroCharacterService";
import { BaroCharacterArt } from "./BaroCharacterArt";

const base: CharacterDNA = {
  version: 1, body: "pebble", ears: "cat", eyes: "dots", mark: "heart",
  palette: "Mint", pattern: "freckles", pattern_seed: 1, rarity: "normal",
};

describe("BaroCharacterArt", () => {
  it.each(["freckles", "polka", "stripes", "waves", "marble", "checker", "sprouts", "hearts", "bubbles", "zigzag", "mosaic", "constellation", "paint", "petals", "egg", "potato", "ramen", "error404", "coffee-beans", "clover", "raindrops", "leopard", "plaid", "confetti", "leaves", "cookie", "coffee-stain", "this-is-fine", "merge-conflict", "semicolon", "mango-sticky-rice", "loading-spinner", "galaxy", "aurora", "golden-code", "rainbow-shimmer"])("makes %s visually depend on its permanent pattern seed", (pattern) => {
    const first = renderToStaticMarkup(<BaroCharacterArt dna={{ ...base, pattern, pattern_seed: 1 }} id="sample" />);
    const second = renderToStaticMarkup(<BaroCharacterArt dna={{ ...base, pattern, pattern_seed: 2 }} id="sample" />);
    expect(first).not.toBe(second);
  });

  it.each([
    ["headphones", "#5fa9c9"],
    ["pixel-glasses", "#9cd7e8"],
    ["tiny-crown", "#f5c451"],
  ])("renders the %s collectible prop", (prop, color) => {
    const art = renderToStaticMarkup(<BaroCharacterArt dna={base} id={prop} prop={prop} />);
    expect(art).toContain(`data-character-prop="${prop}"`);
    expect(art).toContain(color);
  });

  it.each([
    ["body", ["bun", "blob-cat", "teardrop", "onigiri", "bell", "star-cookie"]],
    ["ears", ["bunny", "bear", "sprout", "fox", "droopy", "feather"]],
    ["eyes", ["happy-arc", "glasses-dots", "star", "heart", "wink", "sparkle-big"]],
    ["mark", ["bolt", "flower", "coffee-bean", "blush", "bandaid", "tear"]],
    ["palette", ["Coffee", "Matcha", "Sakura", "Midnight", "Mango", "Taro", "ThaiTea", "Sky"]],
  ] as const)("draws every new %s instead of the fallback", (trait, values) => {
    const fallback = renderToStaticMarkup(<BaroCharacterArt dna={{ ...base, [trait]: "unknown" }} id="sample" />);
    for (const value of values) expect(renderToStaticMarkup(<BaroCharacterArt dna={{ ...base, [trait]: value }} id="sample" />), value).not.toBe(fallback);
  });

  it.each(["coffee-cup", "sticky-note", "bow", "beanie", "leaf-sprout", "scarf", "iced-thai-tea", "boba", "rubber-duck", "party-hat", "leaf-umbrella", "pencil-ear", "laptop", "tiny-cat", "wizard-hat", "bubble-tea-hat", "coffee-drip-hat", "star-wand", "angel-wings", "golden-keyboard"])("draws the %s prop", (prop) => {
    expect(renderToStaticMarkup(<BaroCharacterArt dna={base} id="sample" prop={prop} />)).not.toBe(renderToStaticMarkup(<BaroCharacterArt dna={base} id="sample" prop={prop + "-unknown"} />).replace(`${prop}-unknown`, prop));
  });
});
