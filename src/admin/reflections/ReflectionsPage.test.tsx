import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { ReflectionsPage } from "./ReflectionsPage";
import { wellbeingApi, type Board } from "../wellbeing";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]), today: vi.fn().mockResolvedValue({ learners: [] }) } }));
vi.mock("../wellbeing", async (orig) => ({ ...(await orig<object>()), wellbeingApi: { board: vi.fn(), reply: vi.fn(), addNote: vi.fn(), addStep: vi.fn(), notes: vi.fn().mockResolvedValue([]) } }));

const mint = { id: "u1", first_name: "Kanokwan", zoom_name: "04_Kanokwan(Mint/มิ้นท์)", jsd_number: "04", genmate_group: "F" };
const fah = { id: "u2", first_name: "Fah", zoom_name: "09_Fah(Fah/ฟ้า)", jsd_number: "09", genmate_group: "C" };
const board: Board = {
  date: "2026-11-22", range: "night", sent: 2, total: 3,
  missing: [{ id: "u3", first_name: "Non", zoom_name: "06_Non(Non/นนท์)", jsd_number: "06", genmate_group: "B" }],
  zones: { comfort: 1, "stretch-enjoying": 0, "stretch-overwhelmed": 0, panic: 1 },
  zones_prev: { comfort: 2, "stretch-enjoying": 0, "stretch-overwhelmed": 0, panic: 0 },
  by_group: [{ group: "B", sent: 0, total: 1 }, { group: "C", sent: 1, total: 1 }, { group: "F", sent: 1, total: 1 }],
  worth: [{ learner: mint, patterns: [{ key: "panic_run", title: "Panic 2 nights in a row", detail: "" }], strip: ["comfort", "panic", "panic"], quote: "I feel lost in React state" }],
  map: [{ learner: mint, nights: ["comfort", "panic", "panic"] }, { learner: fah, nights: ["comfort", "comfort", "comfort"] }],
  dates: ["2026-11-19", "2026-11-20", "2026-11-22"],
  entries: [
    { learner: mint, reflection_id: "r1", day: "2026-11-22", zone: "panic", tech_happy: "I feel lost in React state", tech_improve: "Need help", nontech_happy: "", nontech_improve: "", admin_feedback: "", words: ["lost"] },
    { learner: fah, reflection_id: "r2", day: "2026-11-22", zone: "comfort", tech_happy: "Hooks clicked today", tech_improve: "", nontech_happy: "", nontech_improve: "", admin_feedback: "", words: [] },
  ],
};

describe("ReflectionsPage", () => {
  beforeEach(() => {
    vi.mocked(wellbeingApi.board).mockResolvedValue(board);
    vi.mocked(wellbeingApi.reply).mockReset().mockResolvedValue(undefined);
  });

  it("shows face tiles with the change vs last week", async () => {
    renderAdmin(<ReflectionsPage />, "/admin/reflections");
    const panic = await screen.findByRole("group", { name: /Panic/ });
    expect(panic).toHaveTextContent("1");
    expect(within(panic).getByText("+1 vs last week")).toHaveClass("text-red-600");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("opens a learner's reflection from the mood map and replies once", async () => {
    renderAdmin(<ReflectionsPage />, "/admin/reflections");
    const squares = await screen.findAllByRole("button", { name: /มิ้นท์ · 2026-11-22/ });
    fireEvent.click(squares[0]);
    const panel = screen.getByRole("complementary", { name: "Details" });
    expect(panel).toHaveTextContent("I feel lost in React state");
    fireEvent.change(within(panel).getByLabelText("Reply to learner"), { target: { value: "Let's pair tomorrow" } });
    const send = within(panel).getByRole("button", { name: "Send reply" });
    fireEvent.click(send);
    fireEvent.click(send);
    await waitFor(() => expect(wellbeingApi.reply).toHaveBeenCalledTimes(1));
    expect(wellbeingApi.reply).toHaveBeenCalledWith("u1", "r1", "Let's pair tomorrow");
  });

  it("says who already replied, so two TAs don't both answer", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-11-22T14:00:00Z"));
    const replied = { ...board, entries: [{ ...board.entries[0], admin_feedback: "Let's pair at 9:30", admin_feedback_name: "05_Neeti(Neeti/นีติ)", admin_feedback_at: "2026-11-22T12:00:00Z" }, board.entries[1]] };
    vi.mocked(wellbeingApi.board).mockResolvedValue(replied);
    renderAdmin(<ReflectionsPage />, "/admin/reflections");
    fireEvent.click((await screen.findAllByRole("button", { name: /มิ้นท์ · 2026-11-22/ }))[0]);
    const panel = screen.getByRole("complementary", { name: "Details" });
    expect(within(panel).getByText("Replied by Neeti · 2h ago")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("filters what they wrote by search", async () => {
    renderAdmin(<ReflectionsPage />, "/admin/reflections");
    await screen.findByText("Hooks clicked today");
    fireEvent.change(screen.getByLabelText("Search reflections"), { target: { value: "lost" } });
    expect(screen.queryByText("Hooks clicked today")).toBeNull();
    expect(screen.getAllByText(/lost/).length).toBeGreaterThan(0);
  });

  it("never carries a typed reply over to the next learner", async () => {
    renderAdmin(<ReflectionsPage />, "/admin/reflections");
    fireEvent.click((await screen.findAllByRole("button", { name: /มิ้นท์ · 2026-11-22/ }))[0]);
    fireEvent.change(screen.getByLabelText("Reply to learner"), { target: { value: "Proud of you, Mint" } });
    fireEvent.click(screen.getAllByRole("button", { name: /ฟ้า · 2026-11-22/ })[0]);
    await waitFor(() => expect(screen.getByRole("complementary", { name: "Details" })).toHaveTextContent("Hooks clicked today"));
    expect(screen.getByLabelText("Reply to learner")).toHaveValue("");
  });
});
