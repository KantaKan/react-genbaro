import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LearnerShell, usePageHeader } from "./LearnerShell";

vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("@/UserDataContext", () => ({
  useUserData: () => ({
    userData: { _id: "u1", first_name: "Aphiradee", zoom_name: "03_Aphiradee(Black/แบล็ค)", jsd_number: "03", genmate_group: "F", cohort_number: 13 },
    loading: false,
  }),
}));

function Child() {
  usePageHeader({ title: "My attendance", context: "Week 11 of 15" });
  return <div>content</div>;
}

describe("LearnerShell", () => {
  it("shows the page title in the top bar and marks the active nav item", () => {
    render(
      <MemoryRouter initialEntries={["/learner/attendance"]}>
        <LearnerShell>
          <Child />
        </LearnerShell>
      </MemoryRouter>
    );
    const banner = screen.getByRole("banner");
    expect(banner).toHaveTextContent("My attendance");
    expect(banner).toHaveTextContent("Week 11 of 15");
    const nav = screen.getByRole("navigation", { name: "Learner" });
    for (const label of ["Today", "Attendance", "My profile", "Classmates", "Talk Board"]) {
      expect(nav).toHaveTextContent(label);
    }
    const active = screen.getAllByRole("link", { name: /Attendance/ }).find((a) => a.getAttribute("aria-current") === "page");
    expect(active).toBeTruthy();
    expect(screen.getByText("Black · แบล็ค")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });
});
