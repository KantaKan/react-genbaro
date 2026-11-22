import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { RulesPage } from "./RulesPage";
import { cohortApi } from "./api";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]) } }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]) } }));
vi.mock("./api", () => ({ cohortApi: { settings: vi.fn(), saveSettings: vi.fn() } }));

const rules = { morning: { open_at: { h: 8, m: 30 }, late_after: { h: 9, m: 15 }, absent_after: { h: 10, m: 30 } }, afternoon: { open_at: { h: 12, m: 30 }, late_after: { h: 13, m: 15 }, absent_after: { h: 14, m: 30 } } };

describe("RulesPage", () => {
  beforeEach(() => {
    vi.mocked(cohortApi.settings).mockResolvedValue({ cohort_number: 13, rules, allowed_networks: [], start_date: "2026-06-29", course_days: 75 });
    vi.mocked(cohortApi.saveSettings).mockReset().mockResolvedValue({} as never);
  });

  it("shows the current times and saves changes once", async () => {
    renderAdmin(<RulesPage />, "/admin/rules");
    const late = await screen.findByLabelText("Morning late after");
    expect(late).toHaveValue("09:15");
    fireEvent.change(late, { target: { value: "09:20" } });
    fireEvent.click(screen.getByRole("radio", { name: /Only from Thailand/ }));
    const save = screen.getByRole("button", { name: "Save rules" });
    fireEvent.click(save);
    fireEvent.click(save);
    await waitFor(() => expect(cohortApi.saveSettings).toHaveBeenCalledTimes(1));
    const [, s] = vi.mocked(cohortApi.saveSettings).mock.calls[0];
    expect(s.rules.morning.late_after).toEqual({ h: 9, m: 20 });
    expect(s.checkin_region).toBe("thailand");
    expect(s.course_days).toBe(75);
  });
});
