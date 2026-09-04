import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getPartTexture, repeatForPart } from "@/lib/farm-textures";
import type { FarmPart } from "@/lib/farm-geometry";

// jsdom doesn't implement real canvas 2D (no `canvas` npm package installed,
// same limitation the whole farm scene works around elsewhere) — stub just
// the handful of CanvasRenderingContext2D members getPartTexture calls.
function stub2dContext() {
  return {
    fillStyle: "",
    globalAlpha: 1,
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("getPartTexture", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(stub2dContext());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the same cached texture instance for the same color", () => {
    const a = getPartTexture("#5f8a3f");
    const b = getPartTexture("#5f8a3f");
    expect(a).not.toBeNull();
    expect(a).toBe(b);
  });

  it("returns different instances for different colors", () => {
    const a = getPartTexture("#5f8a3f");
    const b = getPartTexture("#6b4a34");
    expect(a).not.toBe(b);
  });

  it("falls back to null instead of throwing when canvas 2d is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(() => getPartTexture("#123456")).not.toThrow();
    expect(getPartTexture("#123456")).toBeNull();
  });
});

describe("repeatForPart", () => {
  it("gives a wide part a larger repeat than a thin one", () => {
    const thinStem: FarmPart = { kind: "cylinder", args: [0.1, 0.1, 0.5, 8], position: [0, 0, 0], color: "#000" };
    const widePot: FarmPart = { kind: "cylinder", args: [3.2, 2.6, 2.2, 8], position: [0, 0, 0], color: "#000" };
    const [thinRepeat] = repeatForPart(thinStem);
    const [wideRepeat] = repeatForPart(widePot);
    expect(wideRepeat).toBeGreaterThan(thinRepeat);
  });

  it("always returns at least a 1x1 repeat", () => {
    const tiny: FarmPart = { kind: "sphere", args: [0.05, 4, 3], position: [0, 0, 0], color: "#000" };
    const [x, y] = repeatForPart(tiny);
    expect(x).toBeGreaterThanOrEqual(1);
    expect(y).toBeGreaterThanOrEqual(1);
  });
});
