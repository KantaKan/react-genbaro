import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { ProfilePage } from "./ProfilePage";
import { wellbeingApi, type Overview } from "../wellbeing";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]) } }));
vi.mock("../wellbeing", async (orig) => ({ ...(await orig<object>()), wellbeingApi: { overview: vi.fn(), addNote: vi.fn(), addStep: vi.fn(), setStep: vi.fn(), deleteStep: vi.fn(), ack: vi.fn() } }));

const ov: Overview = {
  learner: { id: "u1", first_name: "Kanokwan", last_name: "S", zoom_name: "04_Kanokwan(Mint/มิ้นท์)", jsd_number: "04", genmate_group: "F", email: "mint@x.com", created_at: "2026-06-29T00:00:00Z", cohort_number: 13 },
  attendance_rate: 0.881, leave_used: 7, streak: 0,
  last20: [{ date: "2026-11-20", morning: "present", afternoon: "late" }],
  nights: [{ day: "2026-11-20", zone: "panic" }],
  latest_quote: { day: "2026-11-20", zone: "panic", text: "I feel lost" },
  patterns: [],
  reasons: [{ key: "leave", text: "Leave 7/8" }, { key: "plan", text: "1 support step open" }],
  notes: [{ id: "n1", user_id: "u1", author_id: "a", author_name: "Nok", text: "Paired with Fah", created_at: "2026-11-19T10:00:00Z" }],
  support: [{ id: "s1", user_id: "u1", text: "1:1 check-in", done: false, author_name: "Kan", created_at: "2026-11-19T10:00:00Z" }],
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.mocked(wellbeingApi.overview).mockResolvedValue(ov);
    vi.mocked(wellbeingApi.addNote).mockReset().mockResolvedValue({ id: "n2" } as never);
    vi.mocked(wellbeingApi.setStep).mockReset().mockResolvedValue(undefined);
    vi.mocked(wellbeingApi.ack).mockReset().mockResolvedValue(undefined);
  });
  const go = () => renderAdmin(<ProfilePage />, "/admin/learners/u1", "/admin/learners/:id");

  it("shows the header, reasons, notes and quote", async () => {
    go();
    expect(await screen.findByRole("heading", { name: /มิ้นท์ · Kanokwan/ })).toBeInTheDocument();
    expect(screen.getByText("Leave 7/8")).toBeInTheDocument();
    expect(screen.getByText("Paired with Fah")).toBeInTheDocument();
    expect(screen.getByText(/I feel lost/)).toBeInTheDocument();
  });

  it("adds a note once", async () => {
    go();
    fireEvent.change(await screen.findByLabelText("New note"), { target: { value: "Called her today" } });
    const b = screen.getByRole("button", { name: "Add note" });
    fireEvent.click(b);
    fireEvent.click(b);
    await waitFor(() => expect(wellbeingApi.addNote).toHaveBeenCalledTimes(1));
    expect(wellbeingApi.addNote).toHaveBeenCalledWith("u1", "Called her today");
  });

  it("ticks a support step and acknowledges a reason", async () => {
    go();
    fireEvent.click(await screen.findByRole("checkbox", { name: "1:1 check-in" }));
    await waitFor(() => expect(wellbeingApi.setStep).toHaveBeenCalledWith("s1", true));
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge Leave 7/8" }));
    await waitFor(() => expect(wellbeingApi.ack).toHaveBeenCalledWith("u1", "leave"));
    expect(screen.queryByRole("button", { name: /Acknowledge 1 support step/ })).toBeNull();
  });
});
