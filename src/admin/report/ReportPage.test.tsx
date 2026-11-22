import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { ReportPage } from "./ReportPage";
import { reportApi, type Report } from "./api";
import { adminApi } from "../api";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]) } }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]), me: vi.fn() } }));
vi.mock("./api", () => ({ reportApi: { get: vi.fn(), saveNotes: vi.fn(), send: vi.fn() } }));

const kpi = (value: number, prev: number) => ({ value, prev, trend: [0.9, 0.92, 0.95, 0.93, 0.96, 0.94, prev, value] });
const ref = (id: string, first: string) => ({ id, first_name: first, zoom_name: `01_${first}(${first}/${first})`, jsd_number: "01", genmate_group: "B" });
const report = (o: Partial<Report> = {}): Report => ({
  week: "2026-11-16",
  week_end: "2026-11-20",
  summary: "Attendance 83% (down 17 points from last week). 1 late check-in. 2 learners need support (1 new). 50% of reflections were overwhelmed or panic.",
  kpis: { attendance: kpi(0.83, 1), lates: kpi(1, 0), reflections: kpi(0.4, 0.5), rough: kpi(0.5, 0.2) },
  reflections_written: 2,
  mood: ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"].map((day, i) => ({ day, holiday: i === 1, comfort: i === 0 ? 1 : 0, enjoying: 0, overwhelmed: 0, panic: i === 0 ? 1 : 0, none: 1 })),
  by_day: ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"].map((day, i) => ({ day, holiday: i === 1, am: { on_time: 1, late: 1, leave: 0, absent: 1, not_yet: 0 }, pm: { on_time: 3, late: 0, leave: 0, absent: 0, not_yet: 0 } })),
  support: [
    { learner: ref("a", "Mint"), status: "new", reasons: ["Leave 6/8"] },
    { learner: ref("c", "Chanon"), status: "still", reasons: ["Late 3 days"] },
    { learner: ref("b", "Fah"), status: "better", reasons: [] },
  ],
  groups: [{ group: "B", attendance: 1, rough: 0.5, cup: 12 }, { group: "C", attendance: 0.5, rough: 0, cup: 3 }],
  notes: "",
  status: "draft",
  ...o,
});
const me = (role: string) => vi.mocked(adminApi.me).mockResolvedValue({ id: "me", first_name: "Kan", staff_role: role, cohorts: [13], groups: [] } as never);

describe("ReportPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-20T09:00:00Z")); // Friday 16:00 Bangkok
    me("owner");
    vi.mocked(reportApi.get).mockReset().mockResolvedValue(report());
    vi.mocked(reportApi.saveNotes).mockReset().mockResolvedValue(undefined);
    vi.mocked(reportApi.send).mockReset().mockResolvedValue({ status: "sent", sent_to_slack: true });
  });
  afterEach(() => vi.useRealTimers());

  it("shows the summary, the four KPIs with change, support groups and the groups table", async () => {
    renderAdmin(<ReportPage />, "/admin/report");
    expect(await screen.findByText(/Attendance 83% \(down 17 points/)).toBeInTheDocument();
    expect(reportApi.get).toHaveBeenCalledWith(13, "2026-11-16");
    expect(screen.getByLabelText("Attendance: 83%")).toBeInTheDocument();
    expect(screen.getByText("−17 pts vs last week")).toBeInTheDocument();
    expect(screen.getByLabelText("Late check-ins: 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Reflections sent: 40%")).toBeInTheDocument();
    expect(screen.getByLabelText("Overwhelmed or panic: 50%")).toBeInTheDocument();
    const sup = screen.getByRole("region", { name: "Needs support" });
    expect(within(sup).getByText("New")).toBeInTheDocument();
    expect(within(sup).getByText("Still")).toBeInTheDocument();
    expect(within(sup).getByText("Better")).toBeInTheDocument();
    expect(within(sup).getByText(/Leave 6\/8/)).toBeInTheDocument();
    const groups = screen.getByRole("region", { name: "Groups" });
    expect(within(groups).getByText("12")).toBeInTheDocument();
  });

  it("saves the team's notes once", async () => {
    renderAdmin(<ReportPage />, "/admin/report");
    fireEvent.change(await screen.findByLabelText("Notes from the team"), { target: { value: "Retro on Monday" } });
    const save = screen.getByRole("button", { name: "Save notes" });
    fireEvent.click(save);
    fireEvent.click(save);
    await waitFor(() => expect(reportApi.saveNotes).toHaveBeenCalledTimes(1));
    expect(reportApi.saveNotes).toHaveBeenCalledWith(13, "2026-11-16", "Retro on Monday");
  });

  it("sends after confirming, once", async () => {
    renderAdmin(<ReportPage />, "/admin/report");
    fireEvent.click(await screen.findByRole("button", { name: "Send now" }));
    const ok = await screen.findByRole("button", { name: "Confirm" });
    fireEvent.click(ok);
    fireEvent.click(ok);
    await waitFor(() => expect(reportApi.send).toHaveBeenCalledTimes(1));
    expect(reportApi.send).toHaveBeenCalledWith(13, "2026-11-16");
  });

  it("a sent week is read-only and says so", async () => {
    vi.mocked(reportApi.get).mockResolvedValue(report({ status: "sent", sent_at: "2026-11-20T10:00:00Z", notes: "Locked note" }));
    renderAdmin(<ReportPage />, "/admin/report");
    expect(await screen.findByText(/^Sent/)).toBeInTheDocument();
    expect(screen.getByText("Locked note")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save notes" })).toBeNull();
    expect(screen.getByRole("button", { name: "Send again" })).toBeInTheDocument();
  });

  it("a viewer can read but not edit or send", async () => {
    me("viewer");
    renderAdmin(<ReportPage />, "/admin/report");
    await screen.findByText(/Attendance 83%/);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Send now" })).toBeNull());
    expect(screen.queryByLabelText("Notes from the team")).toBeNull();
  });

  it("a TA can edit notes but not send", async () => {
    me("ta");
    renderAdmin(<ReportPage />, "/admin/report");
    expect(await screen.findByLabelText("Notes from the team")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Send now" })).toBeNull());
  });

  it("moves between weeks and can't go past this week", async () => {
    renderAdmin(<ReportPage />, "/admin/report");
    await screen.findByText(/Attendance 83%/);
    expect(screen.getByRole("button", { name: "Next week" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    await waitFor(() => expect(reportApi.get).toHaveBeenCalledWith(13, "2026-11-09"));
    expect(screen.getByRole("button", { name: "Next week" })).toBeEnabled();
  });

  it("copes with an empty week", async () => {
    vi.mocked(reportApi.get).mockResolvedValue(report({ summary: "Attendance 0%. 0 late check-ins. No learners need support. No reflections yet this week.", kpis: { attendance: { value: 0, prev: 0, trend: Array(8).fill(0) }, lates: { value: 0, prev: 0, trend: Array(8).fill(0) }, reflections: { value: 0, prev: 0, trend: Array(8).fill(0) }, rough: { value: 0, prev: 0, trend: Array(8).fill(0) } }, support: [], groups: [], reflections_written: 0 }));
    renderAdmin(<ReportPage />, "/admin/report");
    expect(await screen.findByLabelText("Attendance: 0%")).toBeInTheDocument();
    expect(screen.getByText("Nobody needs support this week.")).toBeInTheDocument();
  });
});
