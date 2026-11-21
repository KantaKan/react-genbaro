import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LearnerGenmateGardenWidget from "./learner-genmate-garden-widget";
import type { GenmateGardenMember } from "@/domain/types";

vi.mock("@/lib/api", () => ({
  getMyGenmateGarden: vi.fn(),
}));

import { getMyGenmateGarden } from "@/lib/api";
const mockedGetGarden = vi.mocked(getMyGenmateGarden);

function localDayString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function makeMembers(): GenmateGardenMember[] {
  const now = new Date();
  const alice: GenmateGardenMember = {
    _id: "user-1",
    first_name: "Alice",
    last_name: "Smith",
    cohort_number: 12,
    genmate_group: "Garden Alpha",
    reflection_dates: [localDayString(new Date(now))],
  };
  const bob: GenmateGardenMember = {
    _id: "user-2",
    first_name: "Bob",
    last_name: "Johnson",
    cohort_number: 12,
    genmate_group: "Garden Alpha",
    reflection_dates: [],
  };
  return [alice, bob];
}

function renderWidget() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LearnerGenmateGardenWidget />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("LearnerGenmateGardenWidget", () => {
  beforeEach(() => {
    mockedGetGarden.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the group name, member count, and mini plants", async () => {
    mockedGetGarden.mockResolvedValue(makeMembers() as never);

    renderWidget();

    expect(await screen.findByText("Genmate Garden")).toBeInTheDocument();
    expect(screen.getByText(/Garden Alpha · 2 members/)).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders a link to the full garden page", async () => {
    mockedGetGarden.mockResolvedValue(makeMembers() as never);

    renderWidget();

    const link = await screen.findByRole("link", { name: /View all/ });
    expect(link).toHaveAttribute("href", "/learner/garden");
  });

  it("renders nothing when the garden is empty", async () => {
    mockedGetGarden.mockResolvedValue([] as never);

    const { container } = renderWidget();

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing on error", async () => {
    mockedGetGarden.mockRejectedValue(new Error("boom"));

    const { container } = renderWidget();

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
