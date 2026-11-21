import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import BubbleWrapControl from "./BubbleWrapControl";
import ScratchCardControl from "./ScratchCardControl";
import AlarmClockControl from "./AlarmClockControl";
import LuckySlotControl from "./LuckySlotControl";
import GachaControl from "./GachaControl";

const base = { tone: "on_time" as const, disabled: false, busy: false, minutesLeft: 7, deadline: "9:15" };

describe("fun styles B", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("bubble wrap: popping all 12 checks in, 11 does not", () => {
    const done = vi.fn();
    render(<BubbleWrapControl {...base} onComplete={done} />);
    const bubbles = screen.getAllByRole("button", { name: /Pop bubble/ });
    expect(bubbles).toHaveLength(12);
    bubbles.slice(0, 11).forEach((b) => fireEvent.pointerDown(b));
    act(() => void vi.advanceTimersByTime(500));
    expect(done).not.toHaveBeenCalled();
    expect(screen.getByText("1 left")).toBeInTheDocument();
    fireEvent.pointerDown(bubbles[11]);
    act(() => void vi.advanceTimersByTime(500));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("scratch card falls back to a Reveal button without canvas", () => {
    const done = vi.fn();
    render(<ScratchCardControl {...base} onComplete={done} />);
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    act(() => void vi.advanceTimersByTime(700));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("alarm: three hits check in, two do not", () => {
    const done = vi.fn();
    render(<AlarmClockControl {...base} onComplete={done} />);
    const clock = screen.getByRole("button", { name: /Hit the alarm/ });
    fireEvent.click(clock);
    fireEvent.click(clock);
    act(() => void vi.advanceTimersByTime(1000));
    expect(done).not.toHaveBeenCalled();
    fireEvent.click(clock);
    act(() => void vi.advanceTimersByTime(1000));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("slot: pulling the lever checks in after the reels stop", () => {
    const done = vi.fn();
    render(<LuckySlotControl {...base} onComplete={done} />);
    fireEvent.click(screen.getByRole("button", { name: "Pull the lever" }));
    act(() => void vi.advanceTimersByTime(1000));
    expect(done).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(3000));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("gacha: knob, capsule, then the card checks in", () => {
    const done = vi.fn();
    render(<GachaControl {...base} onComplete={done} />);
    fireEvent.click(screen.getByRole("button", { name: "Turn the knob" }));
    act(() => void vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole("button", { name: "Open the capsule" }));
    expect(screen.getByTestId("gacha-card")).toHaveTextContent(/^(N|R|SR|SSR)/);
    act(() => void vi.advanceTimersByTime(1500));
    expect(done).toHaveBeenCalledTimes(1);
  });
});
