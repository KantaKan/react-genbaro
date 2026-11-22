import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewCohortWizard } from "./NewCohortWizard";
import { cohortApi } from "./api";

vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));
vi.mock("./api", () => ({ cohortApi: { create: vi.fn() } }));
vi.mock("@/components/bulk-register-dialog", () => ({
  BulkRegisterDialog: ({ isOpen, defaultCohort, onClose }: { isOpen: boolean; defaultCohort?: number; onClose: () => void }) =>
    isOpen ? (
      <div>
        <p>import for {defaultCohort}</p>
        <button onClick={onClose}>Close import</button>
      </div>
    ) : null,
}));

describe("NewCohortWizard", () => {
  beforeEach(() => vi.mocked(cohortApi.create).mockReset().mockResolvedValue(undefined));

  it("creates the cohort, offers the import, then switches to it", async () => {
    const onDone = vi.fn();
    render(<NewCohortWizard open onOpenChange={vi.fn()} onDone={onDone} />);
    fireEvent.change(screen.getByLabelText("Cohort number"), { target: { value: "14" } });
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2027-01-04" } });
    const create = screen.getByRole("button", { name: "Create JSD14" });
    fireEvent.click(create);
    fireEvent.click(create);
    await waitFor(() => expect(cohortApi.create).toHaveBeenCalledTimes(1));
    expect(cohortApi.create).toHaveBeenCalledWith({ cohort_number: 14, start_date: "2027-01-04", course_days: 75 });
    fireEvent.click(await screen.findByRole("button", { name: "Import learners from CSV" }));
    expect(screen.getByText("import for 14")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close import" }));
    fireEvent.click(await screen.findByRole("button", { name: "Go to JSD14" }));
    expect(onDone).toHaveBeenCalledWith(14);
  });
});
