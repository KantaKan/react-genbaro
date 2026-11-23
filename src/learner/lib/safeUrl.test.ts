import { describe, it, expect } from "vitest";
import { safeUrl } from "./usePeople";

describe("safeUrl", () => {
  it("only lets plain web links through, so a profile link can't run script", () => {
    expect(safeUrl(" https://github.com/ploy ")).toBe("https://github.com/ploy");
    expect(safeUrl("http://linkedin.com/in/x")).toBe("http://linkedin.com/in/x");
    expect(safeUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeUrl(" JavaScript:fetch('//evil')")).toBeUndefined();
    expect(safeUrl("data:text/html,<script>x</script>")).toBeUndefined();
    expect(safeUrl(undefined)).toBeUndefined();
  });
});
