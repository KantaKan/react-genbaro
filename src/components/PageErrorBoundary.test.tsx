import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PageErrorBoundary } from "./PageErrorBoundary";

function Broken(): JSX.Element {
  throw new Error("boom");
}

describe("PageErrorBoundary", () => {
  it("shows a calm message instead of blanking the app", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <MemoryRouter>
        <nav>sidebar</nav>
        <PageErrorBoundary>
          <Broken />
        </PageErrorBoundary>
      </MemoryRouter>
    );
    expect(screen.getByRole("alert")).toHaveTextContent("This page hit a snag");
    expect(screen.getByText("sidebar")).toBeInTheDocument();
  });
});
