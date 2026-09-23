import { describe, expect, it } from "vitest";

import { getUserAvatarSeed } from "./avatar";

describe("avatar helpers", () => {
  it("uses the first available user identifier", () => {
    expect(getUserAvatarSeed(undefined, "user@example.com", "Jane")).toBe("user@example.com");
  });

  it("uses a stable seed when no identifier is available", () => {
    expect(getUserAvatarSeed()).toBe("unknown-user");
  });
});
