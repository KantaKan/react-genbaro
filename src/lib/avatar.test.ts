import { describe, expect, it } from "vitest";

import { getAvatarFallback, getUserAvatarUrl } from "./avatar";

describe("avatar helpers", () => {
  it("builds stable DiceBear URLs from the first available seed", () => {
    expect(getUserAvatarUrl(undefined, "user@example.com", "Jane")).toBe(
      "https://api.dicebear.com/9.x/thumbs/svg?seed=user%40example.com",
    );
  });

  it("creates two-letter fallbacks from name parts", () => {
    expect(getAvatarFallback("Jane", "Doe")).toBe("JD");
  });

  it("falls back when no name parts are available", () => {
    expect(getAvatarFallback()).toBe("?");
  });
});
