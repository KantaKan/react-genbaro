import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StyleFrame } from "./StyleFrame";

describe("StyleFrame", () => {
  it("offers a screen-reader button that completes once per click", () => {
    const done = vi.fn();
    render(<StyleFrame disabled={false} busy={false} onComplete={done}><div>art</div></StyleFrame>);
    fireEvent.click(screen.getByRole("button", { name: "Check in now" }));
    expect(done).toHaveBeenCalledTimes(1);
  });
  it("never completes while busy", () => {
    const done = vi.fn();
    render(<StyleFrame disabled={false} busy onComplete={done}><div>art</div></StyleFrame>);
    fireEvent.click(screen.getByRole("button", { name: "Check in now" }));
    expect(done).not.toHaveBeenCalled();
  });
});
