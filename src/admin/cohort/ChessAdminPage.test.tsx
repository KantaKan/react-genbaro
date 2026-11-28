import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { ChessAdminPage } from "./ChessAdminPage";
import { cohortApi } from "./api";
import { chessApi } from "@/learner/chess/api";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]) } }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]) } }));
vi.mock("./api", () => ({ cohortApi: { settings: vi.fn(), saveSettings: vi.fn() } }));

const rules = { morning: { open_at: { h: 8, m: 0 }, late_after: { h: 9, m: 15 }, absent_after: { h: 10, m: 0 } }, afternoon: { open_at: { h: 13, m: 0 }, late_after: { h: 13, m: 15 }, absent_after: { h: 14, m: 0 } } };

describe("ChessAdminPage", () => {
  beforeEach(() => {
    vi.mocked(cohortApi.saveSettings).mockReset().mockResolvedValue({} as never);
  });

  it("turns team chess on for the cohort, keeping the other settings", async () => {
    vi.mocked(cohortApi.settings).mockResolvedValue({ cohort_number: 13, rules, allowed_networks: ["1.2.3.4"] });
    renderAdmin(<ChessAdminPage />, "/admin/chess");
    fireEvent.click(await screen.findByRole("switch", { name: "Team chess" }));
    await waitFor(() => expect(cohortApi.saveSettings).toHaveBeenCalledTimes(1));
    const [n, s] = vi.mocked(cohortApi.saveSettings).mock.calls[0];
    expect(n).toBe(13);
    expect(s.chess_enabled).toBe(true);
    expect(s.allowed_networks).toEqual(["1.2.3.4"]);
  });

  it("shows the board and ends the game after a second click", async () => {
    vi.mocked(cohortApi.settings).mockResolvedValue({ cohort_number: 13, rules, allowed_networks: [], chess_enabled: true });
    renderAdmin(<ChessAdminPage />, "/admin/chess");
    expect(await screen.findByText("ยังไม่มีเกมหมากรุก")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "End this game" }));
    expect(chessApi.end).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "End as a draw" }));
    await waitFor(() => expect(chessApi.end).toHaveBeenCalledWith(13));
  });
});
