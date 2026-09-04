import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AdminCohortFarmPage } from "./AdminCohortFarmPage";
import type { GenmateGardenMember, CohortGardenGroup } from "@/domain/types";

vi.mock("@/lib/api", () => ({
  getCohortGarden: vi.fn(),
}));

vi.mock("@/AuthContext", () => ({
  useAuth: () => ({ userId: "current-user" }),
}));

vi.mock("@/UserDataContext", () => ({
  useUserData: () => ({
    userData: { fertilizer_balance: 3 },
    refetchUserData: vi.fn(),
  }),
}));

vi.mock("@/application/services/fertilizerService", () => ({
  fertilizerService: { gift: vi.fn().mockResolvedValue(undefined) },
}));

import { getCohortGarden } from "@/lib/api";
const mockedGetCohortGarden = vi.mocked(getCohortGarden);

function member(overrides: Partial<GenmateGardenMember>): GenmateGardenMember {
  return {
    _id: "user-1",
    first_name: "Alice",
    last_name: "Smith",
    cohort_number: 14,
    genmate_group: "Garden Alpha",
    reflection_dates: [],
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AdminCohortFarmPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("AdminCohortFarmPage", () => {
  beforeEach(() => {
    mockedGetCohortGarden.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to the last cohort option and shows every member across groups together", async () => {
    const groups: CohortGardenGroup[] = [
      {
        group_name: "Garden Alpha",
        members: [
          member({ _id: "user-1", first_name: "Alice" }),
          member({ _id: "user-2", first_name: "Bob" }),
        ],
      },
      {
        group_name: "Unaffiliated",
        members: [member({ _id: "user-3", first_name: "Carol", genmate_group: "" })],
      },
    ];
    mockedGetCohortGarden.mockResolvedValue(groups);

    renderPage();

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
    expect(mockedGetCohortGarden).toHaveBeenCalledWith(14);
  });

  it("renders the empty state when the selected cohort has no members", async () => {
    mockedGetCohortGarden.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("No learners found for this cohort yet.")).toBeInTheDocument();
  });
});
