import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventCard } from "./EventCard";
import { WorldEventBadge } from "./WorldEventBadge";
import type { StartupRun } from "@/application/services/startupStoryService";

const run = {
  _id: "run-1", mode: "free", status: "active", stage: "event", act: 1, market: { hot: [] },
  bosses_passed: 0, project_index: 1, money: 1000, fans: 0, staff: [], score: 0, version: 3,
  pending_event: { id: "friday-deploy", options: ["Do it. YOLO 😈", "Wait for Monday"] },
} as StartupRun;

describe("EventCard", () => {
  it("renders the event title and both options", () => {
    render(<EventCard run={run} pending={false} onPick={vi.fn()} />);

    expect(screen.getByText("Push to Prod on Friday?")).toBeInTheDocument();
    expect(screen.getByText("Do it. YOLO 😈")).toBeInTheDocument();
    expect(screen.getByText("Wait for Monday")).toBeInTheDocument();
  });

  it("picks an option with one tap", () => {
    const onPick = vi.fn();
    render(<EventCard run={run} pending={false} onPick={onPick} />);

    fireEvent.click(screen.getByText("Wait for Monday"));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(1);
  });

  it("disables the options while an action is pending", () => {
    render(<EventCard run={run} pending onPick={vi.fn()} />);

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });

  it("renders nothing without a pending event", () => {
    const { container } = render(<EventCard run={{ ...run, pending_event: undefined }} pending={false} onPick={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("WorldEventBadge", () => {
  it("shows the active world event", () => {
    render(<WorldEventBadge run={{ ...run, world_event: "songkran" }} />);

    expect(screen.getByText(/Songkran Holiday/)).toBeInTheDocument();
  });

  it("renders nothing when no world event is active", () => {
    const { container } = render(<WorldEventBadge run={{ ...run, world_event: undefined }} />);

    expect(container).toBeEmptyDOMElement();
  });
});
