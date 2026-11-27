import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { PixelOffice } from "./PixelOffice";
import type { StartupDev } from "@/application/services/startupStoryService";

const dev = (id: string): StartupDev => ({ id, name: id, title: "", sprite: "dev", role: "frontend", frontend: 1, backend: 1, design: 1, debug: 1, salary: 0 });

describe("PixelOffice", () => {
  afterEach(() => vi.useRealTimers());

  it("leaves no speech timers running after it unmounts", () => {
    vi.useFakeTimers();
    const { unmount } = render(<PixelOffice staff={[dev("a"), dev("b")]} busy={false} />);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
