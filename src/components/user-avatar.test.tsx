import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Blobatar } from "@blobatar/react";
import { UserAvatar } from "./user-avatar";

const gazeRef = vi.hoisted(() => vi.fn());

vi.mock("@blobatar/react/gaze", () => ({
  useGaze: () => ({ ref: gazeRef }),
}));

describe("UserAvatar", () => {
  it("attaches pointer gaze to the rendered SVG", () => {
    render(<UserAvatar userId="user-1" name="Jane" followPointer />);

    expect(gazeRef).toHaveBeenCalledWith(expect.any(SVGSVGElement));
  });
});

describe("UserAvatar with a saved avatar", () => {
  it("keeps Blobatar when there is no saved avatar", () => {
    const { container } = render(<UserAvatar userId="u1" name="Jane" />);
    expect(container.querySelector("img[data-avatar='dicebear']")).toBeNull();
  });
  it("renders a saved DiceBear avatar with its background", () => {
    const { container } = render(<UserAvatar userId="u1" name="Jane" avatar={{ style: "lorelei", seed: "a", bg: "e0e7ff" }} />);
    const img = container.querySelector("img[data-avatar='dicebear']");
    expect(img).not.toBeNull();
    expect((img!.parentElement as HTMLElement).style.background).toMatch(/224, 231, 255|e0e7ff/i);
  });
  it("treats a saved blobatar choice like the default", () => {
    const { container } = render(<UserAvatar userId="u1" name="Jane" avatar={{ style: "blobatar", seed: "a", bg: "" }} />);
    expect(container.querySelector("img[data-avatar='dicebear']")).toBeNull();
  });
  it("uses the saved blobatar seed and background", () => {
    const ref = render(<Blobatar name="zz9" />).container.querySelector("img")!.getAttribute("src");
    const { container } = render(<UserAvatar userId="u1" name="Jane" avatar={{ style: "blobatar", seed: "zz9", bg: "fce7f3" }} />);
    const img = container.querySelectorAll("img")[0];
    expect(img.getAttribute("src")).toBe(ref);
    expect((img.parentElement as HTMLElement).style.background).toMatch(/252, 231, 243|fce7f3/i);
  });
  it("draws the champion frame only for champions", () => {
    const { container, rerender } = render(<UserAvatar userId="u1" name="Jane" champion />);
    expect(container.querySelector("[data-champion]")).not.toBeNull();
    rerender(<UserAvatar userId="u1" name="Jane" />);
    expect(container.querySelector("[data-champion]")).toBeNull();
  });
});
