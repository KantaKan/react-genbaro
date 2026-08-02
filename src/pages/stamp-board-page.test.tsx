import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import StampBoardPage from "./stamp-board-page";
import type { Cohort, Stamp } from "@/lib/stamp";

vi.mock("@/lib/api", () => ({
  listCohorts: vi.fn(),
  getCohortInfo: vi.fn(),
  getCohortStamps: vi.fn(),
}));

vi.mock("@/AuthContext", () => ({
  useAuth: () => ({ userRole: "learner", userId: "user-1" }),
}));

vi.mock("@/application/contexts/UserDataContext", () => ({
  useUserData: () => ({
    userData: { cohort_number: 12 },
    loading: false,
  }),
}));

import { getCohortInfo, getCohortStamps } from "@/lib/api";
const mockedGetCohortInfo = vi.mocked(getCohortInfo);
const mockedGetCohortStamps = vi.mocked(getCohortStamps);

function makeCohort(): Cohort {
  return {
    cohortNumber: 12,
    name: "Cohort 12",
    lockAt: "2026-06-01T00:00:00.000Z",
    isLocked: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function makeStamps(count: number): Stamp[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `stamp-${index}`,
    ownerId: "user-1",
    cohortNumber: 12,
    imageUrl: `/stamps/${index}.webp`,
    createdAt: "2026-01-01T00:00:00.000Z",
  }));
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <StampBoardPage />
    </QueryClientProvider>
  );
}

describe("StampBoardPage", () => {
  beforeEach(() => {
    mockedGetCohortInfo.mockReset();
    mockedGetCohortStamps.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title and the stamp board", async () => {
    mockedGetCohortInfo.mockResolvedValue(makeCohort() as never);
    mockedGetCohortStamps.mockResolvedValue(makeStamps(2) as never);

    renderPage();

    expect(await screen.findByText("Stamp Board")).toBeInTheDocument();
    expect(await screen.findByText("Paste a stamp onto your cohort's shared canvas.")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Add a Stamp/ })).toBeInTheDocument();
  });

  it("shows the empty state when no stamps exist", async () => {
    mockedGetCohortInfo.mockResolvedValue(makeCohort() as never);
    mockedGetCohortStamps.mockResolvedValue([] as never);

    renderPage();

    expect(await screen.findByText("No stamps yet")).toBeInTheDocument();
    expect(screen.getByText("Be the first to stamp your progress!")).toBeInTheDocument();
  });

  it("shows a locked banner when the cohort board is closed", async () => {
    mockedGetCohortInfo.mockResolvedValue({ ...makeCohort(), isLocked: true } as never);
    mockedGetCohortStamps.mockResolvedValue(makeStamps(1) as never);

    renderPage();

    expect(await screen.findByText("This board is closed. Stamps can no longer be added.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add a Stamp/ })).not.toBeInTheDocument();
  });
});
