import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AwardCareEnergyButton } from "./award-care-energy-button";
import { AwardCareEnergyBulkDialog } from "./award-care-energy-bulk-dialog";
import { BulkActionsBar } from "./bulk-actions-bar";

vi.mock("@/lib/api", () => ({
  careEnergyService: {
    grant: vi.fn().mockResolvedValue(undefined),
    bulkGrant: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Care Energy admin controls", () => {
  it("uses the new name on individual and bulk grant surfaces", () => {
    const { rerender } = render(<AwardCareEnergyButton userId="learner-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Grant Care Energy" }));
    expect(screen.getByRole("heading", { name: "Grant Care Energy" })).toBeInTheDocument();
    expect(screen.queryByText(/old resource name/i)).not.toBeInTheDocument();

    rerender(<AwardCareEnergyBulkDialog isOpen onClose={vi.fn()} userIds={["learner-1"]} />);
    expect(screen.getByRole("heading", { name: "Bulk Grant Care Energy" })).toBeInTheDocument();
    expect(screen.queryByText(/old resource name/i)).not.toBeInTheDocument();
  });

  it("labels the selected-user action as Care Energy", () => {
    render(<BulkActionsBar selectedCount={2} totalCount={3} onSelectAll={vi.fn()} onClearSelection={vi.fn()} onBulkBadge={vi.fn()} onBulkCareEnergy={vi.fn()} onBulkAttendance={vi.fn()} onBulkExport={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Grant Care Energy" })).toBeInTheDocument();
    expect(screen.queryByText(/old resource name/i)).not.toBeInTheDocument();
  });
});
