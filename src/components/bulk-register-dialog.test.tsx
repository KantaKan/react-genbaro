import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BulkRegisterDialog } from "./bulk-register-dialog";

vi.mock("@/infrastructure/api", () => ({ api: { post: vi.fn() } }));

describe("BulkRegisterDialog", () => {
  it("keeps the wizard's cohort after closing and reopening", () => {
    const { rerender } = render(<BulkRegisterDialog isOpen defaultCohort={14} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/Cohort Number/i)).toHaveValue(14);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    rerender(<BulkRegisterDialog isOpen={false} defaultCohort={14} onClose={vi.fn()} />);
    rerender(<BulkRegisterDialog isOpen defaultCohort={14} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/Cohort Number/i)).toHaveValue(14);
  });
});
