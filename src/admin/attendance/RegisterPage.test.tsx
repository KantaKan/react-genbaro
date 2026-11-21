import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { AdminShell } from "../shell/AdminShell";
import { RegisterPage } from "./RegisterPage";
import { adminApi } from "../api";
import type { RegisterView } from "../types";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { register: vi.fn(), leaves: vi.fn().mockResolvedValue([]), mark: vi.fn() } }));
vi.mock("@/application/services/attendanceService", () => ({ attendanceService: { exportSalesforceCSV: vi.fn() } }));

const cell = (status = "", rid?: string) => ({ status, checked_in_at: null, record_id: rid }) as never;
const view: RegisterView = {
  week: "2026-08-17",
  dates: ["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21"],
  holidays: ["2026-08-19"],
  kpis: { attendance_rate: 0.942, lates: 23, absences: 7, excused: 4, at_six_plus: 3, at_seven: 1 },
  previous: { attendance_rate: 0.931, lates: 17, absences: 6, excused: 2, at_six_plus: 2, at_seven: 1 },
  learners: [
    {
      id: "u1", first_name: "Ajjima", last_name: "S", zoom_name: "01_Ajjima(Theim/เถียม)", jsd_number: "01", genmate_group: "I", avatar: null,
      days: [[cell("present", "r1"), cell("present", "r2")], [cell(), cell()], [cell(), cell()], [cell(), cell()], [cell(), cell()]],
      week_rate: 1, leave_used: 2,
    },
  ],
};

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={["/admin/attendance"]}>
        <AdminShell>
          <RegisterPage />
        </AdminShell>
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.mocked(adminApi.register).mockResolvedValue(view);
    vi.mocked(adminApi.mark).mockReset().mockResolvedValue({ _id: "n" });
  });

  it("shows statuses, holidays and week-over-week change", async () => {
    renderPage();
    const row = (await screen.findByText(/เถียม · Theim/)).closest("tr")!;
    expect(within(row).getAllByLabelText(/Mon 17 morning: On time/)).toHaveLength(1);
    expect(within(row).getByText("Holiday")).toBeInTheDocument();
    expect(screen.getByText("+1.1 vs last week")).toBeInTheDocument();
  });

  it("changes a cell from its menu", async () => {
    renderPage();
    const row = (await screen.findByText(/เถียม · Theim/)).closest("tr")!;
    fireEvent.click(within(row).getByLabelText(/Tue 18 morning: Not yet/));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Late" }));
    await waitFor(() => expect(adminApi.mark).toHaveBeenCalledWith({ user_id: "u1", date: "2026-08-18", session: "morning", status: "late" }));
  });
});
