import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { AdminShell, useAdminHeader, useSidePanel } from "./AdminShell";

vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { today: vi.fn().mockResolvedValue({ learners: [] }), leaves: vi.fn().mockResolvedValue([]) } }));

let panel: ReturnType<typeof useSidePanel>;
function Page() {
  useAdminHeader({ title: "Today", context: "Mon 23 Nov" });
  panel = useSidePanel();
  return <p>page body</p>;
}

const renderShell = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminShell>
          <Page />
        </AdminShell>
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("AdminShell", () => {
  it("shows the sections, the active page and the page header", () => {
    renderShell();
    for (const s of ["Daily", "Learners", "Engage", "Play", "Cohort"]) expect(screen.getByText(s)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Today/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("banner")).toHaveTextContent("Today");
    expect(screen.getByRole("banner")).toHaveTextContent("Mon 23 Nov");
  });

  it("opens the command palette with Ctrl+K and finds pages", () => {
    renderShell();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = screen.getByLabelText("Search");
    fireEvent.change(input, { target: { value: "Leave" } });
    expect(screen.getByRole("option", { name: /Leave requests/ })).toBeInTheDocument();
  });

  it("opens and closes the side panel", () => {
    renderShell();
    act(() => panel.open(<p>hi there</p>, "x"));
    expect(screen.getByRole("complementary", { name: "Details" })).toHaveTextContent("hi there");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByText("hi there")).toBeNull();
    act(() => panel.open(<p>again</p>, "y"));
    act(() => panel.open(<p>again</p>, "y"));
    expect(screen.queryByText("again")).toBeNull();
  });
});
