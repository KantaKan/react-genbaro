import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GenmateGardenPage } from "@/pages/admin/GenmateGardenPage";

vi.mock("@/admin/shell/useCohort", () => ({ useCohort: () => [12, () => {}] }));
vi.mock("@/admin/shell/AdminShell", () => ({ useAdminHeader: () => {} }));
vi.mock("@/lib/api", () => ({
  api: { get: vi.fn() },
}));

import { api } from "@/lib/api";
const mockedGet = vi.mocked(api.get);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <GenmateGardenPage />
    </QueryClientProvider>
  );
}

describe("GenmateGardenPage", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the garden for every cohort when All cohorts was picked", async () => {
    localStorage.setItem("baro-admin-garden-scope", "all");
    mockedGet.mockResolvedValue({
      data: { data: { users: [] } },
    } as never);

    renderPage();

    expect(
      await screen.findByText("No learners found for this cohort yet.")
    ).toBeInTheDocument();
  });

  it("follows the cohort picked in the sidebar", async () => {
    mockedGet.mockResolvedValue({
      data: { data: { users: [] } },
    } as never);

    renderPage();

    expect(
      await screen.findByText("No learners found for this cohort yet.")
    ).toBeInTheDocument();
    expect(mockedGet).toHaveBeenCalledWith(
      "/admin/users?cohort=12&role=learner&limit=1000"
    );
  });
});
