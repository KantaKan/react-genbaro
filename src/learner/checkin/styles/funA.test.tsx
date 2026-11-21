import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import RunawayControl from "./RunawayControl";
import CoffeeControl from "./CoffeeControl";
import RedButtonControl from "./RedButtonControl";
import SleepyCatControl from "./SleepyCatControl";

const base = { disabled: false, busy: false, minutesLeft: 7, deadline: "9:15" };

describe("fun styles A", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("runaway: on time, one click checks in", () => {
    const done = vi.fn();
    render(<RunawayControl {...base} tone="on_time" onComplete={done} />);
    fireEvent.click(screen.getByRole("button", { name: /Check in/ }));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("runaway: late, it dodges three times before it can be clicked", () => {
    const done = vi.fn();
    render(<RunawayControl {...base} tone="late" onComplete={done} />);
    const b = screen.getByRole("button", { name: /Check in/ });
    fireEvent.click(b);
    expect(done).not.toHaveBeenCalled();
    fireEvent.pointerEnter(b);
    fireEvent.pointerEnter(b);
    fireEvent.pointerEnter(b);
    expect(screen.getByText("Fine. You win.")).toBeInTheDocument();
    fireEvent.click(b);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("coffee: holding until full checks in; letting go early does not", () => {
    const done = vi.fn();
    render(<CoffeeControl {...base} tone="on_time" onComplete={done} />);
    const mug = screen.getByRole("button", { name: /Hold the mug/ });
    fireEvent.pointerDown(mug);
    act(() => void vi.advanceTimersByTime(800));
    fireEvent.pointerUp(mug);
    act(() => void vi.advanceTimersByTime(3000));
    expect(done).not.toHaveBeenCalled();
    fireEvent.pointerDown(mug);
    act(() => void vi.advanceTimersByTime(2600));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("big red button needs the cover open first", () => {
    const done = vi.fn();
    render(<RedButtonControl {...base} tone="on_time" onComplete={done} />);
    fireEvent.click(screen.getByRole("button", { name: "Press the button" }));
    expect(done).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Lift the safety cover" }));
    fireEvent.click(screen.getByRole("button", { name: "Press the button" }));
    act(() => void vi.advanceTimersByTime(600));
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("sleepy cat: wake it, then high-five the paw", () => {
    const done = vi.fn();
    render(<SleepyCatControl {...base} tone="on_time" onComplete={done} />);
    fireEvent.click(screen.getByRole("button", { name: "Poke the cat" }));
    expect(screen.getByText(/Tap the paw/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Poke the cat" }));
    expect(screen.getByText("Not me. The paw!")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "High five" }));
    act(() => void vi.advanceTimersByTime(800));
    expect(done).toHaveBeenCalledTimes(1);
  });
});
