import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { AuthedPageLayout } from "./AuthedPageLayout";

const { auth } = vi.hoisted(() => ({ auth: { role: "learner" } }));
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("@/learner/shell/StreakPill", () => ({ StreakPill: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ isAuthenticated: true, userRole: auth.role, logout: vi.fn() }) }));
vi.mock("../../AuthContext", () => ({ useAuth: () => ({ isAuthenticated: true, userRole: auth.role, logout: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("../../admin/api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]), me: vi.fn().mockRejectedValue(new Error("x")), cohorts: vi.fn().mockRejectedValue(new Error("x")) } }));
vi.mock("../../admin/wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]) } }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "u1", first_name: "A", zoom_name: "01_A(Black/แบล็ค)", genmate_group: "F", cohort_number: 13 }, loading: false }) }));

const renderAt = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AuthedPageLayout allowedRoles={["admin", "learner"]} />}>
          <Route path="/stamp-board" element={<p>stamps</p>} />
          <Route path="/profile/:id" element={<p>profile</p>} />
          <Route path="/tools" element={<p>tools</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
    </QueryClientProvider>
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

  it("admins stay in the admin shell on shared pages, never the old sidebar", () => {
    auth.role = "admin";
    renderAt("/tools");
    expect(screen.queryByTestId("old-shell")).toBeNull();
    expect(screen.getByText("tools")).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Admin" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("banner")).toHaveTextContent("Tools");
  });
});
