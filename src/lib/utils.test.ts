import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps a type-ramp size next to a text colour", () => {
    expect(cn("text-micro", "text-l-ink3")).toBe("text-micro text-l-ink3");
  });

  it("a later size still replaces an earlier one", () => {
    expect(cn("text-micro", "text-body")).toBe("text-body");
  });
});
