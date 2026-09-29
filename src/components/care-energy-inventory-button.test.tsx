import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CareEnergyInventoryButton } from "./care-energy-inventory-button";

vi.mock("@/lib/api", () => ({
  careEnergyService: {
    protect: vi.fn().mockResolvedValue(undefined),
    feed: vi.fn().mockResolvedValue(undefined),
  },
}));

import { careEnergyService } from "@/lib/api";

describe("CareEnergyInventoryButton", () => {
  beforeEach(() => {
    vi.mocked(careEnergyService.protect).mockClear();
    vi.mocked(careEnergyService.feed).mockClear();
  });

  it("confirms a single feed before spending", async () => {
    render(<CareEnergyInventoryButton userId="learner-1" balance={3} eligibleProtectDate={null} />);
    fireEvent.click(screen.getByRole("button", { name: /💛 3/ }));
    fireEvent.click(screen.getByRole("button", { name: /Feed \(\+10 growth\)/ }));
    expect(careEnergyService.feed).not.toHaveBeenCalled();
    expect(screen.getByText(/Spend 1 Care Energy for \+10 growth/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm use" }));
    await waitFor(() => expect(careEnergyService.feed).toHaveBeenCalledWith("learner-1", 1));
  });

  it("confirms protection before spending", async () => {
    render(<CareEnergyInventoryButton userId="learner-1" balance={3} eligibleProtectDate="2026-09-25" />);
    fireEvent.click(screen.getByRole("button", { name: /💛 3/ }));
    fireEvent.click(screen.getByRole("button", { name: /Protect 2026-09-25/ }));
    expect(careEnergyService.protect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm use" }));
    await waitFor(() => expect(careEnergyService.protect).toHaveBeenCalledWith("learner-1", "2026-09-25"));
  });
});
