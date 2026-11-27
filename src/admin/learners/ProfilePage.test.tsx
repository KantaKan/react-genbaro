import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { ProfilePage, TableRedirect } from "./ProfilePage";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { wellbeingApi, type Overview } from "../wellbeing";
import { adminApi } from "../api";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]), mark: vi.fn().mockResolvedValue({ record: { _id: "x" }, previous: null }) } }));
vi.mock("../wellbeing", async (orig) => ({ ...(await orig<object>()), wellbeingApi: { overview: vi.fn(), reply: vi.fn(), addNote: vi.fn(), addStep: vi.fn(), setStep: vi.fn(), deleteStep: vi.fn(), ack: vi.fn() } }));

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
  days: [
    { date: "2026-11-22", extra: true, morning: null, afternoon: null, reflection: { id: "r22", zone: "comfort", sent_at: "", tech_happy: "Sunday practice", tech_improve: "", nontech_happy: "", nontech_improve: "", reply: "ok", reply_name: "Nan", reply_at: null } },
    { date: "2026-11-25", morning: { status: "present", at: "2026-11-25T13:00:00Z", marked_by: "admin" }, afternoon: null, reflection: null },
    {
      date: "2026-11-26",
      morning: { status: "present", at: "2026-11-26T01:52:00Z" },
      afternoon: { status: "late", at: "2026-11-26T06:24:00Z", marked_by: "self" },
      reflection: { id: "r26", zone: "panic", sent_at: "2026-11-26T09:58:00Z", tech_happy: "useEffect cleanup", tech_improve: "React Query is confusing", nontech_happy: "", nontech_improve: "", reply: "", reply_name: "", reply_at: null },
    },
  ],
  course: { week_number: 13, total_weeks: 16, day_number: 62, course_days: 80 },
  best_streak: 14,
  cohort_attendance: 0.912,
  badges: [{ name: "Seedling", emoji: "🌱", awarded_at: "2026-11-07T00:00:00Z" }],
  neighbors: { prev: "u0", next: "u2", index: 1, total: 28 },
  plant: { palette: "", species: "", pot: "", leaf: "", flower: "", stem: "" },
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.mocked(wellbeingApi.overview).mockResolvedValue(ov);
    vi.mocked(wellbeingApi.addNote).mockReset().mockResolvedValue({ id: "n2" } as never);
    vi.mocked(wellbeingApi.setStep).mockReset().mockResolvedValue(undefined);
    vi.mocked(wellbeingApi.ack).mockReset().mockResolvedValue(undefined);
  });
  const go = () => renderAdmin(<ProfilePage />, "/admin/learners/u1", "/admin/learners/:id");

  it("shows the header, reasons, notes and the latest class day", async () => {
    go();
    expect(await screen.findByRole("heading", { name: /มิ้นท์ · Kanokwan/ })).toBeInTheDocument();
    expect(screen.getByText("Leave 7/8")).toBeInTheDocument();
    expect(screen.getByText("Paired with Fah")).toBeInTheDocument();
    expect(screen.getByText("React Query is confusing")).toBeInTheDocument();
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
    await waitFor(() => expect(wellbeingApi.ack).toHaveBeenCalledWith("u1", "leave", "Leave 7/8"));
    expect(screen.queryByRole("button", { name: /Acknowledge 1 support step/ })).toBeNull();
  });

  it("shows KPIs with context and the badges", async () => {
    go();
    expect(await screen.findByText("Cohort avg 91.2%")).toBeInTheDocument();
    expect(screen.getByText("Best 14")).toBeInTheDocument();
    expect(screen.getByTitle(/Seedling/)).toBeInTheDocument();
    expect(screen.getByText("2 of 28")).toBeInTheDocument();
  });

  it("has no J/K shortcuts", async () => {
    go();
    await screen.findByLabelText("New note");
    fireEvent.keyDown(window, { key: "j" });
    await new Promise((res) => setTimeout(res, 20));
    expect(wellbeingApi.overview).not.toHaveBeenCalledWith("u2");
  });

  it("starts the next learner with an empty reply box", async () => {
    vi.mocked(wellbeingApi.overview).mockImplementation(async (id: string) => ({ ...ov, learner: { ...ov.learner, id } }));
    go();
    fireEvent.change(await screen.findByLabelText(/Reply to/), { target: { value: "for Kanokwan only" } });
    fireEvent.click(screen.getByRole("link", { name: "Next learner" }));
    await waitFor(() => expect(wellbeingApi.overview).toHaveBeenCalledWith("u2"));
    expect(await screen.findByLabelText(/Reply to/)).toHaveValue("");
  });

  it("keeps the admin reward and repair tools", async () => {
    go();
    for (const name of [/Award Badge/i, /Grant Care Energy/, /Garden Gift/, /Send Gift Box/, /Baro Character/, /Edit Plant/]) {
      expect(await screen.findByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("shows check-in times only for self check-ins, and weekend reflections apart from class days", async () => {
    go();
    expect(await screen.findByRole("button", { name: /Thu 26 afternoon/ })).toHaveTextContent("13:24");
    expect(screen.getByRole("button", { name: /Wed 25 morning/ })).not.toHaveTextContent("20:00");
    expect(screen.getByText((_, el) => el?.tagName === "B" && el.textContent === "1/ 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show ›" }));
    expect(screen.getByText("Sunday practice")).toBeInTheDocument();
    expect(screen.getByText("No class")).toBeInTheDocument();
  });

  it("keeps the course strip out of the tab order", async () => {
    const { container } = go();
    await screen.findByText("React Query is confusing");
    const cells = container.querySelectorAll("[data-strip] button");
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach((c) => expect(c).toHaveAttribute("tabindex", "-1"));
  });

  it("shows a class day with times, the struggle first, and replies with cmd+enter", async () => {
    vi.mocked(wellbeingApi.reply).mockReset().mockResolvedValue(undefined);
    go();
    expect(await screen.findByText("React Query is confusing")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Thu 26 afternoon/ })).toHaveTextContent("13:24");
    expect(screen.getByText("useEffect cleanup")).not.toBeVisible();
    const box = screen.getByLabelText(/Reply to/);
    fireEvent.change(box, { target: { value: "Let's pair tomorrow" } });
    fireEvent.keyDown(box, { key: "Enter", metaKey: true });
    await waitFor(() => expect(wellbeingApi.reply).toHaveBeenCalledWith("u1", "r26", "Let's pair tomorrow"));
  });

  it("saves a reply draft as a note and filters to missing days", async () => {
    go();
    const box = await screen.findByLabelText(/Reply to/);
    fireEvent.change(box, { target: { value: "Check sleep" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Save as TA note" }));
    await waitFor(() => expect(wellbeingApi.addNote).toHaveBeenCalledWith("u1", "Check sleep"));
    fireEvent.click(screen.getByRole("button", { name: /^Missing/ }));
    expect(screen.queryByText("React Query is confusing")).not.toBeInTheDocument();
    expect(screen.getByText("No reflection")).toBeInTheDocument();
  });

  it("marks attendance from a day chip", async () => {
    go();
    fireEvent.click(await screen.findByRole("button", { name: /Wed 25 afternoon/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Late" }));
    await waitFor(() => expect(adminApi.mark).toHaveBeenCalledWith(expect.objectContaining({ user_id: "u1", date: "2026-11-25", session: "afternoon", status: "late" })));
  });

  it("sends the old reflections table link to the learner page", () => {
    render(
      <MemoryRouter initialEntries={["/admin/table/u1"]}>
        <Routes>
          <Route path="/admin/table/:id" element={<TableRedirect />} />
          <Route path="/admin/learners/:id" element={<p>learner page</p>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("learner page")).toBeInTheDocument();
  });
});
