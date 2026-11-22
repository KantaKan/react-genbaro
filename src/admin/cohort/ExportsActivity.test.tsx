import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { ExportsPage } from "./ExportsPage";
import { ActivityPage } from "./ActivityPage";
import { cohortApi } from "./api";
import { attendanceService } from "@/application/services/attendanceService";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]) } }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]) } }));
vi.mock("./api", () => ({ cohortApi: { settings: vi.fn(), activity: vi.fn() } }));
vi.mock("@/application/services/attendanceService", () => ({ attendanceService: { exportSalesforceCSV: vi.fn(), exportAttendance: vi.fn() } }));

describe("ExportsPage", () => {
  beforeEach(() => {
    vi.mocked(cohortApi.settings).mockResolvedValue({ cohort_number: 13, start_date: "2026-06-29" } as never);
    vi.mocked(attendanceService.exportSalesforceCSV).mockResolvedValue(new Blob(["x"]));
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
  });
  it("downloads Salesforce for the cohort and range", async () => {
    renderAdmin(<ExportsPage />, "/admin/exports");
    await waitFor(() => expect(screen.getByLabelText("From")).toHaveValue("2026-06-29"));
    fireEvent.click(screen.getByRole("button", { name: /Salesforce CSV/ }));
    await waitFor(() => expect(attendanceService.exportSalesforceCSV).toHaveBeenCalledWith(13, "2026-06-29", expect.any(String)));
  });
});

describe("ActivityPage", () => {
  beforeEach(() => {
    vi.mocked(cohortApi.activity).mockImplementation(async (page: number) => ({
      items: [{ id: `i${page}`, actor_name: "Kan", actor_role: "admin", action: page === 1 ? "Marked attendance" : "Added a holiday", detail: "/admin/x", status: 200, at: "2026-11-22T03:00:00Z" }],
      total: 60,
      page,
    }));
  });
  it("lists actions and loads more", async () => {
    renderAdmin(<ActivityPage />, "/admin/activity");
    expect(await screen.findByText("Marked attendance")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByText("Added a holiday")).toBeInTheDocument();
    expect(cohortApi.activity).toHaveBeenCalledWith(2);
  });
});
