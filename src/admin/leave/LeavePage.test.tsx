import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { AdminShell } from "../shell/AdminShell";
import { LeavePage } from "./LeavePage";
import { adminApi } from "../api";
import { mkLearner } from "../learner/fixtures";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("@/components/create-leave-request-dialog", () => ({ CreateLeaveRequestDialog: () => null }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn(), today: vi.fn(), reviewLeave: vi.fn() } }));
vi.mock("../wellbeing", async (o) => {
  const real = await o<typeof import("../wellbeing")>();
  return { ...real, wellbeingApi: { ...real.wellbeingApi, support: vi.fn().mockResolvedValue([]) } };
});

const req = { _id: "L1", user_id: "u1", jsd_number: "07", first_name: "Kanokwan", last_name: "S", cohort_number: 13, type: "full_day", date: "2026-11-27", reason: "Sick, fever since last night. Will rest and watch the recording.", status: "pending", created_at: "2026-11-23T01:12:00Z" };

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={["/admin/leave"]}>
        <AdminShell>
          <LeavePage />
        </AdminShell>
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("LeavePage", () => {
  beforeEach(() => {
    vi.mocked(adminApi.leaves).mockResolvedValue([req] as never);
    vi.mocked(adminApi.today).mockResolvedValue({ learners: [mkLearner({ id: "u1", first_name: "Kanokwan", zoom_name: "07_Kanokwan(Mint/มิ้นท์)", leave_used: 7 })] } as never);
    vi.mocked(adminApi.reviewLeave).mockReset().mockResolvedValue(undefined);
  });

  it("shows the reason and what approving does to leave", async () => {
    renderPage();
    expect(await screen.findByText(/Sick, fever since last night/)).toBeInTheDocument();
    expect(await screen.findByText("7 → 8")).toBeInTheDocument();
    expect(screen.getByText("Reaches the limit")).toBeInTheDocument();
  });

  it("approves after confirming, once even on a double click", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Approve" }));
    const ok = await screen.findByRole("button", { name: "Confirm" });
    fireEvent.click(ok);
    fireEvent.click(ok);
    await waitFor(() => expect(adminApi.reviewLeave).toHaveBeenCalledTimes(1));
    expect(adminApi.reviewLeave).toHaveBeenCalledWith("L1", "approved", undefined);
  });

  it("sends the decline note", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Decline" }));
    fireEvent.change(await screen.findByLabelText("Note to the learner (optional)"), { target: { value: "Please bring the clinic slip" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(adminApi.reviewLeave).toHaveBeenCalledWith("L1", "rejected", "Please bring the clinic slip"));
  });
});
