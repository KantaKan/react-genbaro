import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { SupportPage } from "./SupportPage";
import { wellbeingApi } from "../wellbeing";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]) } }));
vi.mock("../wellbeing", async (orig) => ({ ...(await orig<object>()), wellbeingApi: { support: vi.fn(), ack: vi.fn() } }));

describe("SupportPage", () => {
  beforeEach(() => {
    vi.mocked(wellbeingApi.support).mockResolvedValue([
      { learner: { id: "u1", first_name: "Kanokwan", zoom_name: "04_Kanokwan(Mint/มิ้นท์)", jsd_number: "04", genmate_group: "F" }, reasons: [{ key: "leave", text: "Leave 7/8" }, { key: "pattern:panic_run", text: "Panic 3 nights in a row" }], open_items: 2, done_items: 1, owner: "" },
    ]);
    vi.mocked(wellbeingApi.ack).mockReset().mockResolvedValue(undefined);
  });

  it("lists learners with reasons and plan progress, and acknowledges", async () => {
    renderAdmin(<SupportPage />, "/admin/support");
    expect(await screen.findByText("Panic 3 nights in a row")).toBeInTheDocument();
    expect(screen.getByText("1/3 steps done")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge Leave 7/8" }));
    await waitFor(() => expect(wellbeingApi.ack).toHaveBeenCalledWith("u1", "leave", "Leave 7/8"));
  });
});
