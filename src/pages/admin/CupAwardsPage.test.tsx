import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import CupAwardsPage from "./CupAwardsPage";
import { adminCupApi } from "@/learner/cup/api";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/learner/cup/api", () => ({
  adminCupApi: {
    standings: vi.fn().mockResolvedValue({
      week: "2026-09-07",
      standings: [{ group: "A", total: 20, by_category: { coding: 20, soft: 0, showing_up: 0, helping: 0 }, by_day: [0, 20, 0, 0, 0] }, { group: "B", total: 0, by_category: { coding: 0, soft: 0, showing_up: 0, helping: 0 }, by_day: [0, 0, 0, 0, 0] }],
      awards: [{ id: "x1", group: "A", category: "coding", points: 20, reason: "Demo", day: "2026-09-08", created_at: "" }],
    }),
    award: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}));

const renderPage = () => render(<QueryClientProvider client={new QueryClient()}><CupAwardsPage /></QueryClientProvider>);

describe("CupAwardsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("awards points once with the form values", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Cohort"), { target: { value: "13" } });
    fireEvent.click(await screen.findByRole("button", { name: "Group B" }));
    fireEvent.click(screen.getByRole("button", { name: "Soft skills" }));
    fireEvent.change(screen.getByLabelText("Points"), { target: { value: "15" } });
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Great pitch practice" } });
    const btn = screen.getByRole("button", { name: "Award points" });
    fireEvent.click(btn);
    fireEvent.click(btn);
    await waitFor(() => expect(adminCupApi.award).toHaveBeenCalledTimes(1));
    expect(adminCupApi.award).toHaveBeenCalledWith({ cohort: 13, group: "B", category: "soft", points: 15, reason: "Great pitch practice" });
  });

  it("undoes an award", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Cohort"), { target: { value: "13" } });
    fireEvent.click(await screen.findByRole("button", { name: "Undo Demo" }));
    await waitFor(() => expect(adminCupApi.remove).toHaveBeenCalledWith("x1"));
  });
});
