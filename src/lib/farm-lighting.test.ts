import { describe, expect, it } from "vitest";
import { farmLightingForDate } from "./farm-lighting";

describe("Thailand-time farm lighting", () => {
  it("uses Bangkok's local hour rather than the device's hour", () => {
    expect(farmLightingForDate(new Date("2026-09-28T00:00:00Z"))).toBe("morning");
    expect(farmLightingForDate(new Date("2026-09-28T06:00:00Z"))).toBe("day");
    expect(farmLightingForDate(new Date("2026-09-28T11:00:00Z"))).toBe("evening");
    expect(farmLightingForDate(new Date("2026-09-28T15:00:00Z"))).toBe("night");
  });
});
