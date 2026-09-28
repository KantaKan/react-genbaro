import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FertilizerInventoryButton } from "./fertilizer-inventory-button";

vi.mock("@/lib/api", () => ({
  fertilizerService: {
    protect: vi.fn().mockResolvedValue(undefined),
    feed: vi.fn().mockResolvedValue(undefined),
  },
}));

import { fertilizerService } from "@/lib/api";

describe("FertilizerInventoryButton", () => {
  beforeEach(() => {
    vi.mocked(fertilizerService.protect).mockClear();
    vi.mocked(fertilizerService.feed).mockClear();
  });

  it("confirms a single feed before spending", async () => {
    render(<FertilizerInventoryButton userId="learner-1" balance={3} eligibleProtectDate={null} />);
    fireEvent.click(screen.getByRole("button", { name: /🧪 3/ }));
    fireEvent.click(screen.getByRole("button", { name: /Feed \(\+10 growth\)/ }));
    expect(fertilizerService.feed).not.toHaveBeenCalled();
    expect(screen.getByText(/Spend 1 fertilizer for \+10 growth/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm use" }));
    await waitFor(() => expect(fertilizerService.feed).toHaveBeenCalledWith("learner-1", 1));
  });

  it("confirms protection before spending", async () => {
    render(<FertilizerInventoryButton userId="learner-1" balance={3} eligibleProtectDate="2026-09-25" />);
    fireEvent.click(screen.getByRole("button", { name: /🧪 3/ }));
    fireEvent.click(screen.getByRole("button", { name: /Protect 2026-09-25/ }));
    expect(fertilizerService.protect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm use" }));
    await waitFor(() => expect(fertilizerService.protect).toHaveBeenCalledWith("learner-1", "2026-09-25"));
  });
});
