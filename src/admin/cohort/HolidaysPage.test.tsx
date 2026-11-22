import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { HolidaysPage } from "./HolidaysPage";
import { leaveService } from "@/application/services/leaveService";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]) } }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]) } }));
vi.mock("@/application/services/leaveService", () => ({ leaveService: { getHolidays: vi.fn(), createHoliday: vi.fn(), deleteHoliday: vi.fn() } }));

describe("HolidaysPage", () => {
  beforeEach(() => {
    vi.mocked(leaveService.getHolidays).mockResolvedValue([{ _id: "h1", name: "Asarnha Bucha", start_date: "2026-07-29", end_date: "2026-07-29", created_at: "", created_by: "" }]);
    vi.mocked(leaveService.createHoliday).mockReset().mockResolvedValue({} as never);
    vi.mocked(leaveService.deleteHoliday).mockReset().mockResolvedValue(undefined);
  });

  it("adds a holiday once and removes one after confirming", async () => {
    renderAdmin(<HolidaysPage />, "/admin/holidays");
    expect(await screen.findByText("Asarnha Bucha")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Holiday name"), { target: { value: "Father's Day" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-12-07" } });
    const add = screen.getByRole("button", { name: "Add holiday" });
    fireEvent.click(add);
    fireEvent.click(add);
    await waitFor(() => expect(leaveService.createHoliday).toHaveBeenCalledTimes(1));
    expect(leaveService.createHoliday).toHaveBeenCalledWith("Father's Day", "2026-12-07", "2026-12-07");
    fireEvent.click(screen.getByRole("button", { name: "Remove Asarnha Bucha" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(leaveService.deleteHoliday).toHaveBeenCalledWith("h1"));
  });
});
