import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import HoldControl from "./HoldControl";
import RingControl from "./RingControl";
import GoldSlideControl from "./GoldSlideControl";

const base = { tone: "on_time" as const, disabled: false, busy: false, minutesLeft: 7, deadline: "9:15" };

describe("clean styles", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("hold completes after 900ms", () => {
    const done = vi.fn();
    render(<HoldControl {...base} onComplete={done} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: /Hold to check in/ }));
    act(() => void vi.advanceTimersByTime(950));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("releasing a hold early does nothing", () => {
    const done = vi.fn();
    render(<HoldControl {...base} onComplete={done} />);
    const b = screen.getByRole("button", { name: /Hold to check in/ });
    fireEvent.pointerDown(b);
    act(() => void vi.advanceTimersByTime(500));
    fireEvent.pointerUp(b);
    act(() => void vi.advanceTimersByTime(1000));
    expect(done).not.toHaveBeenCalled();
  });

  it("ring shows minutes left and completes on tap", () => {
    const done = vi.fn();
    render(<RingControl {...base} onComplete={done} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("until 9:15")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Tap to check in/ }));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("gold slide is a slider", () => {
    render(<GoldSlideControl {...base} onComplete={vi.fn()} />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });
});
