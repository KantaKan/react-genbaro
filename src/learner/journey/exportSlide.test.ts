import { describe, it, expect, vi, afterEach } from "vitest";
import { toPng } from "html-to-image";
import { canShareFiles, preparePng, savePng, sharePng } from "./exportSlide";

vi.mock("html-to-image", () => ({ toPng: vi.fn().mockResolvedValue("data:image/png;base64,AAAA") }));

describe("exportSlide", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves a PNG of the slide without inlining web fonts", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const node = document.createElement("div");
    await savePng(node, "journey-1.png");
    expect(toPng).toHaveBeenCalledWith(node, expect.objectContaining({ pixelRatio: 3, skipFonts: true }));
    expect(click).toHaveBeenCalled();
  });

  it("shares the PNG prepared earlier without capturing again", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob(["x"])) }));
    const node = document.createElement("div");
    const ready = preparePng(node);
    await ready;
    vi.mocked(toPng).mockClear();
    await sharePng(node, "j.png", ready);
    expect(toPng).not.toHaveBeenCalled();
    expect(share).toHaveBeenCalled();
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
