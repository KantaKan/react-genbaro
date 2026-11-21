import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import RocketControl from "./RocketControl";
import ArcadeControl from "./ArcadeControl";
import DjDeckControl from "./DjDeckControl";
import VictoryLapControl from "./VictoryLapControl";

const base = { tone: "on_time" as const, disabled: false, busy: false, minutesLeft: 7, deadline: "9:15" };

describe("unlockable styles", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("rocket: holding through the countdown launches and checks in", () => {
    const done = vi.fn();
    render(<RocketControl {...base} onComplete={done} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: /Hold to launch/ }));
    act(() => void vi.advanceTimersByTime(2150));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("rocket: letting go early aborts", () => {
    const done = vi.fn();
    render(<RocketControl {...base} onComplete={done} />);
    const b = screen.getByRole("button", { name: /Hold to launch/ });
    fireEvent.pointerDown(b);
    act(() => void vi.advanceTimersByTime(1000));
    fireEvent.pointerUp(b);
    act(() => void vi.advanceTimersByTime(4000));
    expect(done).not.toHaveBeenCalled();
    expect(screen.getByText(/Launch aborted/)).toBeInTheDocument();
  });

  it("arcade: START plays through to stage clear; A alone does nothing", () => {
    const done = vi.fn();
    render(<ArcadeControl {...base} onComplete={done} />);
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    act(() => void vi.advanceTimersByTime(3000));
    expect(done).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "START" }));
    act(() => void vi.advanceTimersByTime(3000));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("dj deck: two full turns drop the beat", () => {
    const done = vi.fn();
    render(<DjDeckControl {...base} onComplete={done} />);
    const rec = screen.getByRole("button", { name: /Scratch the record/ });
    rec.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200, x: 0, y: 0, toJSON() {} });
    const pt = (deg: number) => ({ clientX: 100 + 80 * Math.cos((deg * Math.PI) / 180), clientY: 100 + 80 * Math.sin((deg * Math.PI) / 180), pointerId: 1 });
    fireEvent.pointerDown(rec, pt(0));
    for (let d = 20; d <= 760; d += 20) fireEvent.pointerMove(rec, pt(d));
    act(() => void vi.advanceTimersByTime(1500));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("victory lap: holding completes the lap once", () => {
    const done = vi.fn();
    render(<VictoryLapControl {...base} onComplete={done} />);
    const b = screen.getByRole("button", { name: /Hold for your victory lap/ });
    fireEvent.pointerDown(b);
    fireEvent.pointerDown(b); // second finger
    act(() => void vi.advanceTimersByTime(1600));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("victory lap: letting go early does nothing", () => {
    const done = vi.fn();
    render(<VictoryLapControl {...base} onComplete={done} />);
    const b = screen.getByRole("button", { name: /Hold for your victory lap/ });
    fireEvent.pointerDown(b);
    act(() => void vi.advanceTimersByTime(500));
    fireEvent.pointerUp(b);
    act(() => void vi.advanceTimersByTime(3000));
    expect(done).not.toHaveBeenCalled();
  });
});
