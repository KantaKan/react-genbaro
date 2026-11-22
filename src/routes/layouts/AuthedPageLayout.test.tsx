import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthedPageLayout } from "./AuthedPageLayout";

const { auth } = vi.hoisted(() => ({ auth: { role: "learner" } }));
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("@/learner/shell/StreakPill", () => ({ StreakPill: () => null }));
vi.mock("../../app/dashboard/page", () => ({ default: ({ children }: { children: React.ReactNode }) => <div data-testid="old-shell">{children}</div> }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: true, userRole: auth.role, logout: vi.fn() }) }));
vi.mock("../../AuthContext", () => ({ useAuth: () => ({ isAuthenticated: true, userRole: auth.role, logout: vi.fn() }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "u1", first_name: "A", zoom_name: "01_A(Black/แบล็ค)", genmate_group: "F", cohort_number: 13 }, loading: false }) }));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AuthedPageLayout allowedRoles={["admin", "learner"]} />}>
          <Route path="/stamp-board" element={<p>stamps</p>} />
          <Route path="/profile/:id" element={<p>profile</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe("AuthedPageLayout", () => {
  it("keeps learners in the new learner shell with the page title", () => {
    auth.role = "learner";
    renderAt("/stamp-board");
    expect(screen.queryByTestId("old-shell")).toBeNull();
    expect(screen.getByText("stamps")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveTextContent("Stamp Board");
    expect(screen.getByRole("link", { name: /Stamp Board/ })).toHaveAttribute("aria-current", "page");
  });

  it("titles profile pages", () => {
    auth.role = "learner";
    renderAt("/profile/u9");
    expect(screen.getByRole("banner")).toHaveTextContent("Profile");
  });

  it("admins keep the old layout", () => {
    auth.role = "admin";
    renderAt("/stamp-board");
    expect(screen.getByTestId("old-shell")).toHaveTextContent("stamps");
  });
});
