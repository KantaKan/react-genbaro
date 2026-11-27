import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Tour } from "./Tour";
import { tourSteps, type TourStep } from "./steps";

const rules = {
  morning: { open_at: { h: 8, m: 30 }, late_after: { h: 9, m: 15 }, absent_after: { h: 10, m: 30 } },
  afternoon: { open_at: { h: 12, m: 30 }, late_after: { h: 13, m: 15 }, absent_after: { h: 14, m: 30 } },
};

const steps: TourStep[] = [
  { target: "a", title: "Step A", body: "a" },
  { target: "b", title: "Step B", body: "b" },
  { target: "c", title: "Step C", body: "c" },
];

function target(name: string, visible = true) {
  const el = document.createElement("div");
  el.dataset.tour = name;
  el.scrollIntoView = vi.fn();
  el.getClientRects = () => (visible ? ([{}] as unknown as DOMRectList) : ([] as unknown as DOMRectList));
  el.getBoundingClientRect = () => ({ top: 100, left: 20, width: 200, height: 80, bottom: 180, right: 220, x: 20, y: 100, toJSON: () => ({}) });
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.querySelectorAll("body > [data-tour]").forEach((el) => el.remove());
});

describe("tourSteps", () => {
  it("takes the on-time cutoff from the rules", () => {
    expect(tourSteps(rules)[0].body).toContain("ก่อน 9:15");
    expect(tourSteps({ ...rules, morning: { ...rules.morning, late_after: { h: 9, m: 5 } } })[0].body).toContain("ก่อน 9:05");
  });
});

describe("Tour", () => {
  it("walks the steps and finishes with onClose", () => {
    target("a"); target("b"); target("c");
    const onClose = vi.fn();
    render(<Tour steps={steps} onClose={onClose} />);
    expect(screen.getByRole("dialog", { name: "Step A" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
    expect(screen.getByRole("dialog", { name: "Step B" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
    fireEvent.click(screen.getByRole("button", { name: "เริ่มใช้งาน" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("skips a step whose target is missing", () => {
    target("a"); target("c");
    render(<Tour steps={steps} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
    expect(screen.getByRole("dialog", { name: "Step C" })).toBeInTheDocument();
  });

  it("uses the visible match when the same target exists twice", () => {
    const hidden = target("a", false);
    const shown = target("a");
    render(<Tour steps={steps.slice(0, 1)} onClose={vi.fn()} />);
    expect(shown.scrollIntoView).toHaveBeenCalled();
    expect(hidden.scrollIntoView).not.toHaveBeenCalled();
  });

  it("closes when every target is missing", () => {
    const onClose = vi.fn();
    render(<Tour steps={steps} onClose={onClose} />);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on skip and on Escape", () => {
    target("a");
    const onSkip = vi.fn();
    const { unmount } = render(<Tour steps={steps} onClose={onSkip} />);
    fireEvent.click(screen.getByRole("button", { name: "ข้าม" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
    unmount();

    const onEsc = vi.fn();
    render(<Tour steps={steps} onClose={onEsc} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onEsc).toHaveBeenCalledTimes(1);
  });

  it("re-measures the target on scroll", () => {
    const el = target("a");
    render(<Tour steps={steps} onClose={vi.fn()} />);
    const spot = document.querySelector("[data-tour-spotlight]") as HTMLElement;
    expect(spot.style.top).toBe("92px");
    el.getBoundingClientRect = () => ({ top: 300, left: 20, width: 200, height: 80, bottom: 380, right: 220, x: 20, y: 300, toJSON: () => ({}) });
    act(() => { window.dispatchEvent(new Event("scroll")); });
    expect(spot.style.top).toBe("292px");
  });

  it("keeps the learner theme on the panel, not on the full-screen overlay", () => {
    target("a");
    render(<Tour steps={steps} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("learner");
    expect(dialog.parentElement!.className).not.toContain("learner");
  });

  it("moves focus into the dialog", () => {
    target("a");
    render(<Tour steps={steps} onClose={vi.fn()} />);
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });

  it("scrolls only when the step changes, not on re-render", () => {
    const el = target("a");
    const onClose = vi.fn();
    const { rerender } = render(<Tour steps={steps} onClose={onClose} />);
    rerender(<Tour steps={[...steps]} onClose={onClose} />);
    expect(el.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("moves on when the current target disappears on resize", () => {
    const a = target("a");
    target("b");
    render(<Tour steps={steps} onClose={vi.fn()} />);
    a.getClientRects = () => [] as unknown as DOMRectList;
    act(() => { window.dispatchEvent(new Event("resize")); });
    expect(screen.getByRole("dialog", { name: "Step B" })).toBeInTheDocument();
  });

  it("anchors the panel above a target near the bottom by its bottom edge", () => {
    const el = target("a");
    el.getBoundingClientRect = () => ({ top: 700, left: 20, width: 200, height: 60, bottom: 760, right: 220, x: 20, y: 700, toJSON: () => ({}) });
    render(<Tour steps={steps} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.style.bottom).toBe(`${window.innerHeight - 700 + 20}px`);
    expect(dialog.style.top).toBe("");
  });

  it("finds targets that mount in the same render as the tour", () => {
    const onClose = vi.fn();
    function Page() {
      return (
        <>
          <div data-tour="a" ref={(el) => { if (el) { el.getClientRects = () => [{}] as unknown as DOMRectList; el.scrollIntoView = vi.fn(); } }} />
          <Tour steps={steps} onClose={onClose} />
        </>
      );
    }
    render(<Page />);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Step A" })).toBeInTheDocument();
  });

  it("counts only the steps that are on the page", () => {
    target("a"); target("c");
    render(<Tour steps={steps} onClose={vi.fn()} />);
    expect(screen.getByText("1 จาก 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
    expect(screen.getByText("2 จาก 2")).toBeInTheDocument();
    expect(screen.getAllByTestId("tour-dot")).toHaveLength(2);
  });

  it("keeps Tab inside the panel", () => {
    target("a");
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    render(<Tour steps={steps} onClose={vi.fn()} />);
    outside.focus();
    fireEvent.keyDown(outside, { key: "Tab" });
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
    const next = screen.getByRole("button", { name: "เริ่มใช้งาน" });
    next.focus();
    fireEvent.keyDown(next, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "ข้าม" }));
    outside.remove();
  });

  it("scrolls a tall card to its top", () => {
    const el = target("a");
    el.getBoundingClientRect = () => ({ top: 100, left: 20, width: 200, height: 900, bottom: 1000, right: 220, x: 20, y: 100, toJSON: () => ({}) });
    render(<Tour steps={steps} onClose={vi.fn()} />);
    expect(el.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: "start" }));
  });
});
