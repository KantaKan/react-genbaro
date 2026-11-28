import { describe, it, expect, vi, afterEach } from "vitest";
import { toPng } from "html-to-image";
import { canShareFiles, savePng } from "./exportSlide";

vi.mock("html-to-image", () => ({ toPng: vi.fn().mockResolvedValue("data:image/png;base64,AAAA") }));

describe("exportSlide", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("waits for fonts, then saves a PNG of the slide", async () => {
    let fontsReady = false;
    Object.defineProperty(document, "fonts", { configurable: true, value: { ready: Promise.resolve().then(() => (fontsReady = true)) } });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const node = document.createElement("div");
    await savePng(node, "journey-1.png");
    expect(fontsReady).toBe(true);
    expect(toPng).toHaveBeenCalledWith(node, expect.objectContaining({ pixelRatio: 3 }));
    expect(click).toHaveBeenCalled();
  });

  it("only offers sharing when the browser can share files", () => {
    vi.stubGlobal("navigator", { ...navigator, canShare: undefined });
    expect(canShareFiles()).toBe(false);
    vi.stubGlobal("navigator", { ...navigator, canShare: () => false });
    expect(canShareFiles()).toBe(false);
    vi.stubGlobal("navigator", { ...navigator, canShare: () => true, share: vi.fn() });
    expect(canShareFiles()).toBe(true);
  });
});
