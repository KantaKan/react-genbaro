import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { AnnouncePage } from "./AnnouncePage";
import { notificationService } from "@/application/services/notificationService";
import { wellbeingApi } from "../wellbeing";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]) } }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]), learners: vi.fn() } }));
vi.mock("@/application/services/notificationService", () => ({ notificationService: { getAllNotifications: vi.fn(), createNotification: vi.fn(), toggleNotificationActive: vi.fn() } }));

const L = (id: string, g: string) => ({ id, first_name: id, zoom_name: id, jsd_number: "01", genmate_group: g, email: "", attendance_rate: 1, leave_used: 0, mood: [], last_seen: null, support: false });

describe("AnnouncePage", () => {
  beforeEach(() => {
    vi.mocked(wellbeingApi.learners).mockResolvedValue([L("a", "B"), L("b", "C"), L("c", "D"), L("d", "B")]);
    vi.mocked(notificationService.getAllNotifications).mockResolvedValue([
      { id: "n1", title: "Holiday Wednesday", message: "m", is_active: true, priority: "important", start_date: "2026-11-20T00:00:00Z", end_date: "2026-11-27T00:00:00Z", created_at: "2026-11-20T00:00:00Z", read_by_users: ["x", "y"] } as never,
    ]);
    vi.mocked(notificationService.createNotification).mockReset().mockResolvedValue({} as never);
    vi.mocked(notificationService.toggleNotificationActive).mockReset().mockResolvedValue(undefined);
  });

  it("sends to the chosen groups only", async () => {
    renderAdmin(<AnnouncePage />, "/admin/announce");
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Retro at 15:00" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "See you there" } });
    fireEvent.click(screen.getByRole("button", { name: "Groups" }));
    fireEvent.click(await screen.findByRole("checkbox", { name: "Group B" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Group C" }));
    fireEvent.click(screen.getByRole("button", { name: /Send to 3 learners/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(notificationService.createNotification).toHaveBeenCalledTimes(1));
    const body = vi.mocked(notificationService.createNotification).mock.calls[0][0] as unknown as { recipient_ids: string[]; title: string };
    expect(body.title).toBe("Retro at 15:00");
    expect([...body.recipient_ids].sort()).toEqual(["a", "b", "d"]);
  });

  it("lists sent announcements with seen counts and can stop one", async () => {
    renderAdmin(<AnnouncePage />, "/admin/announce");
    expect(await screen.findByText("Holiday Wednesday")).toBeInTheDocument();
    expect(screen.getByText("2 seen")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop Holiday Wednesday" }));
    await waitFor(() => expect(notificationService.toggleNotificationActive).toHaveBeenCalledWith("n1", false));
  });
});
