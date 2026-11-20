import { describe, it, expect } from "vitest";
import { nicknames } from "./name";

describe("nicknames", () => {
  it.each([
    ["03_Aphiradee(Black/แบล็ค)", "Aphiradee", { en: "Black", th: "แบล็ค" }],
    ["02_Albert (Kaptan/กัปตัน)", "Albert", { en: "Kaptan", th: "กัปตัน" }],
    ["14_Jakkapon Wapakpet(ShaRK,ฉลาม)", "Jakkapon", { en: "ShaRK", th: "ฉลาม" }],
    ["Kritsanai(Peteพีท)", "Kritsanai", { en: "Pete", th: "พีท" }],
    ["", "Ploy", { en: "Ploy", th: "" }],
    [undefined, "Ploy", { en: "Ploy", th: "" }],
  ])("%s", (zoom, first, want) => {
    expect(nicknames(zoom as string | undefined, first)).toEqual(want);
  });
});
