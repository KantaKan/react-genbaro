import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
