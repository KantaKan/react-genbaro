import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LAWN_WINDOW_MS } from "@/lib/lawn-planner";
import { useLawnSceneTime } from "./use-lawn-scene-time";

const start = Date.UTC(2026, 8, 30, 3, 20);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(start);
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("useLawnSceneTime", () => {
  it("rotates the scene at each 30-minute window boundary", () => {
    const { result } = renderHook(() => useLawnSceneTime(false));
    expect(result.current).toBe(start);
    act(() => { vi.advanceTimersByTime(10 * 60 * 1000 - 1); });
    expect(result.current).toBe(start);
    act(() => { vi.advanceTimersByTime(1); });
    expect(Math.floor(result.current / LAWN_WINDOW_MS)).toBe(Math.floor(start / LAWN_WINDOW_MS) + 1);
    act(() => { vi.advanceTimersByTime(LAWN_WINDOW_MS); });
    expect(Math.floor(result.current / LAWN_WINDOW_MS)).toBe(Math.floor(start / LAWN_WINDOW_MS) + 2);
  });

  it("never rotates automatically under reduced motion", () => {
    const { result } = renderHook(() => useLawnSceneTime(true));
    act(() => { vi.advanceTimersByTime(3 * LAWN_WINDOW_MS); });
    expect(result.current).toBe(start);
  });

  it("waits while a character card is open, then rotates once it closes", () => {
    const card = document.createElement("div");
    card.setAttribute("data-lawn-card", "");
    document.body.append(card);
    const { result } = renderHook(() => useLawnSceneTime(false));
    act(() => { vi.advanceTimersByTime(10 * 60 * 1000 + 5 * 60 * 1000); });
    expect(result.current).toBe(start);
    card.remove();
    act(() => { vi.advanceTimersByTime(60 * 1000); });
    expect(result.current).toBeGreaterThan(start);
  });
});
