import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import CohortGenmateGardenPage from "./CohortGenmateGardenPage";
import type { GenmateGardenMember, CohortGardenGroup } from "@/domain/types";

vi.mock("@/lib/api", () => ({
  getCohortGarden: vi.fn(),
}));

vi.mock("@/AuthContext", () => ({
  useAuth: () => ({ userId: "current-user" }),
}));

vi.mock("@/UserDataContext", () => ({
  useUserData: () => ({
    userData: { fertilizer_balance: 3, cohort_number: 12 },
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
    cohort_number: 12,
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
        <CohortGenmateGardenPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("CohortGenmateGardenPage", () => {
  beforeEach(() => {
    mockedGetCohortGarden.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows every member across every group, including Unaffiliated, together on one field", async () => {
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
    expect(screen.getByText("Cohort 12")).toBeInTheDocument();
    expect(screen.getByText("3 members · avg 0.0 days")).toBeInTheDocument();
  });

  it("has no per-group tabs — there's nothing to switch between anymore", async () => {
    const groups: CohortGardenGroup[] = [
      { group_name: "Garden Alpha", members: [member({ _id: "user-1", first_name: "Alice" })] },
      { group_name: "Garden Beta", members: [member({ _id: "user-2", first_name: "Dan", genmate_group: "Garden Beta" })] },
    ];
    mockedGetCohortGarden.mockResolvedValue(groups);

    renderPage();

    await screen.findByText("Alice");
    expect(screen.getByText("Dan")).toBeInTheDocument();
    expect(screen.queryByText("Garden Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Garden Beta")).not.toBeInTheDocument();
  });

  it("renders the empty state when the cohort has no members", async () => {
    mockedGetCohortGarden.mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText("No one's in the cohort garden yet — check back once reflections start rolling in.")
    ).toBeInTheDocument();
  });
});
