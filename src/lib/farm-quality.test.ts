import { describe, expect, it } from "vitest";
import { farmQualityForDevice } from "./farm-quality";

describe("farm quality", () => {
  it("reduces GPU work on narrow or weak devices", () => {
    expect(farmQualityForDevice({ width: 390, cores: 8, reducedMotion: false })).toMatchObject({ lowPower: true, pixelRatio: [1, 1], grassBlades: 280, butterflies: 2 });
    expect(farmQualityForDevice({ width: 1200, cores: 2, reducedMotion: false }).lowPower).toBe(true);
  });

  it("preserves detail on stronger devices but removes ambient motion when requested", () => {
    expect(farmQualityForDevice({ width: 1200, cores: 8, memoryGb: 8, reducedMotion: false })).toMatchObject({ lowPower: false, grassBlades: 700, butterflies: 5 });
    expect(farmQualityForDevice({ width: 1200, cores: 8, reducedMotion: true }).butterflies).toBe(0);
  });
});
