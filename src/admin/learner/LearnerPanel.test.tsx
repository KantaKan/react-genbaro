import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { toast } from "sonner";
import { LearnerPanel } from "./LearnerPanel";
import { adminApi } from "../api";
import { mkLearner } from "./fixtures";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
vi.mock("../api", () => ({ adminApi: { mark: vi.fn(), removeRecord: vi.fn().mockResolvedValue(undefined) } }));

const renderPanel = (l = mkLearner()) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LearnerPanel learner={l} session="morning" date="2026-11-23" onChanged={vi.fn()} onPrev={vi.fn()} onNext={vi.fn()} onClose={vi.fn()} />
    </QueryClientProvider>
  );
const undo = () => (vi.mocked(toast).mock.calls[vi.mocked(toast).mock.calls.length - 1][1] as { action: { onClick: () => void } }).action.onClick();

describe("LearnerPanel", () => {
  beforeEach(() => {
    vi.mocked(adminApi.mark).mockReset().mockResolvedValue({ _id: "new1" });
    vi.mocked(adminApi.removeRecord).mockClear();
    vi.mocked(toast).mockClear();
  });

  it("marks once even on a double click", async () => {
    renderPanel();
    const late = screen.getByRole("button", { name: "Late" });
    fireEvent.click(late);
    fireEvent.click(late);
    await waitFor(() => expect(adminApi.mark).toHaveBeenCalledTimes(1));
    expect(adminApi.mark).toHaveBeenCalledWith({ user_id: "u1", date: "2026-11-23", session: "morning", status: "late" });
  });

  it("undo deletes the new record when there was none before", async () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Present" }));
    await waitFor(() => expect(toast).toHaveBeenCalled());
    undo();
    await waitFor(() => expect(adminApi.removeRecord).toHaveBeenCalledWith("new1"));
  });

  it("undo restores the previous status when there was a record", async () => {
    renderPanel(mkLearner({ morning: { status: "absent", checked_in_at: null, record_id: "r1", marked_by: "system" } }));
    fireEvent.click(screen.getByRole("button", { name: "Excused" }));
    await waitFor(() => expect(toast).toHaveBeenCalled());
    undo();
    await waitFor(() => expect(adminApi.mark).toHaveBeenLastCalledWith({ user_id: "u1", date: "2026-11-23", session: "morning", status: "absent" }));
    expect(adminApi.removeRecord).not.toHaveBeenCalled();
  });

  it("shows the leave warning", () => {
    renderPanel();
    expect(screen.getByText("6 of 8 · 2nd warning")).toBeInTheDocument();
  });
});
