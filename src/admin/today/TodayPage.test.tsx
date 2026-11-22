import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { AdminShell } from "../shell/AdminShell";
import { TodayPage } from "./TodayPage";
import { adminApi } from "../api";
import { wellbeingApi } from "../wellbeing";
import { slackApi } from "../slack/api";
import { mkLearner } from "../learner/fixtures";
import type { TodayView } from "../types";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../wellbeing", async (orig) => ({ ...(await orig<object>()), wellbeingApi: { support: vi.fn(), notes: vi.fn(), addNote: vi.fn() } }));
vi.mock("../slack/api", () => ({ slackApi: { available: vi.fn(), ping: vi.fn() } }));
vi.mock("../api", () => ({ adminApi: { today: vi.fn(), leaves: vi.fn(), mark: vi.fn(), bulk: vi.fn(), reviewLeave: vi.fn(), removeRecord: vi.fn(), restore: vi.fn() } }));

const rules = { morning: { open_at: { h: 8, m: 30 }, late_after: { h: 9, m: 15 }, absent_after: { h: 10, m: 30 } }, afternoon: { open_at: { h: 12, m: 30 }, late_after: { h: 13, m: 15 }, absent_after: { h: 14, m: 30 } } };
const view = (o: Partial<TodayView> = {}): TodayView => ({
  date: "2026-11-23",
  class_today: true,
  session: "morning",
  rules,
  counts: { morning: { on_time: 1, late: 1, leave: 0, absent: 0, not_yet: 2, total: 4 }, afternoon: { on_time: 0, late: 0, leave: 0, absent: 0, not_yet: 4, total: 4 } },
  learners: [
    mkLearner({ id: "a", first_name: "Ajjima", zoom_name: "01_Ajjima(Theim/เถียม)", genmate_group: "I", morning: { status: "present", checked_in_at: "2026-11-23T02:02:00Z", record_id: "r1", marked_by: "self" } }),
    mkLearner({ id: "b", first_name: "Ploy", zoom_name: "09_Ploy(Ploy/พลอย)", genmate_group: "I", morning: { status: "late", checked_in_at: "2026-11-23T02:31:00Z", record_id: "r2", marked_by: "self" } }),
    mkLearner({ id: "c", first_name: "Chanon", zoom_name: "04_Chanon(Non/นนท์)", genmate_group: "B" }),
    mkLearner({ id: "d", first_name: "Dear", zoom_name: "05_Dear(Dear/เดียร์)", genmate_group: "B" }),
  ],
  ...o,
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminShell>
          <TodayPage />
        </AdminShell>
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("TodayPage", () => {
  afterEach(() => vi.useRealTimers());
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-23T02:00:00Z")); // Mon 9:00 Bangkok
    vi.mocked(adminApi.today).mockResolvedValue(view());
    vi.mocked(slackApi.available).mockResolvedValue({ connected: false });
    vi.mocked(slackApi.ping).mockReset().mockResolvedValue({ sent: 2, no_slack: [], failed: 0, recent: 0, quiet: false });
    vi.mocked(adminApi.leaves).mockResolvedValue([]);
    vi.mocked(wellbeingApi.support).mockResolvedValue([{ learner: { id: "c", first_name: "Chanon", zoom_name: "04_Chanon(Non/นนท์)", jsd_number: "04", genmate_group: "B" }, reasons: [{ key: "leave", text: "Leave 6/8" }], open_items: 0, done_items: 0, owner: "" }]);
    vi.mocked(wellbeingApi.notes).mockResolvedValue([]);
    vi.mocked(wellbeingApi.addNote).mockReset().mockResolvedValue({ id: "n9", text: "x" } as never);
    vi.mocked(adminApi.mark).mockReset().mockResolvedValue({ record: { _id: "n1" }, previous: null } as never);
    vi.mocked(adminApi.bulk).mockReset().mockResolvedValue(undefined);
  });

  it("shows how many checked in", async () => {
    renderPage();
    expect(await screen.findByLabelText("2 of 4 checked in")).toBeInTheDocument();
  });

  it("filters to who's not in yet", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /^Not yet/ }));
    const roster = screen.getByRole("table");
    expect(within(roster).queryByText(/เถียม/)).toBeNull();
    expect(within(roster).getByText(/นนท์/)).toBeInTheDocument();
  });

  it("opens and closes the side panel from a row", async () => {
    renderPage();
    const row = (await screen.findByText(/พลอย · Ploy/)).closest("tr")!;
    fireEvent.click(row);
    expect(screen.getByRole("complementary", { name: "Details" })).toHaveTextContent("Ploy");
    fireEvent.click(row);
    await waitFor(() => expect(document.querySelector('aside[aria-label="Details"]')).not.toHaveTextContent("Ploy"));
  });

  it("shows no class and nothing live on a day off", async () => {
    vi.mocked(adminApi.today).mockResolvedValue(view({ class_today: false }));
    renderPage();
    expect(await screen.findByText("No class today")).toBeInTheDocument();
    expect(screen.queryByText(/min until/)).toBeNull();
  });

  it("quick Present marks once on a double click", async () => {
    renderPage();
    const row = (await screen.findByText(/นนท์ · Non/)).closest("tr")!;
    const b = within(row).getByRole("button", { name: "Present" });
    fireEvent.click(b);
    fireEvent.click(b);
    await waitFor(() => expect(adminApi.mark).toHaveBeenCalledTimes(1));
    expect(adminApi.mark).toHaveBeenCalledWith({ user_id: "c", date: "2026-11-23", session: "morning", status: "present" });
  });

  it("bulk marks the selected learners after confirming", async () => {
    renderPage();
    await screen.findByText(/นนท์ · Non/);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select นนท์" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select เดียร์" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark present" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(adminApi.bulk).toHaveBeenCalledTimes(1));
    expect(adminApi.bulk).toHaveBeenCalledWith({ user_ids: ["c", "d"], date: "2026-11-23", session: "morning", status: "present" });
  });

  it("marks two learners in a row (one busy flag per learner)", async () => {
    renderPage();
    const c = (await screen.findByText(/นนท์ · Non/)).closest("tr")!;
    const d = screen.getByText(/เดียร์ · Dear/).closest("tr")!;
    fireEvent.click(within(c).getByRole("button", { name: "Present" }));
    fireEvent.click(within(d).getByRole("button", { name: "Present" }));
    await waitFor(() => expect(adminApi.mark).toHaveBeenCalledTimes(2));
  });

  it("won't mark from a board left open since another day", async () => {
    vi.mocked(adminApi.today).mockResolvedValue(view({ date: "2026-11-20" }));
    renderPage();
    const row = (await screen.findByText(/นนท์ · Non/)).closest("tr")!;
    fireEvent.click(within(row).getByRole("button", { name: "Present" }));
    await new Promise((r) => setTimeout(r, 20));
    expect(adminApi.mark).not.toHaveBeenCalled();
  });

  it("offers no marking on a day off", async () => {
    vi.mocked(adminApi.today).mockResolvedValue(view({ class_today: false }));
    renderPage();
    const row = (await screen.findByText(/นนท์ · Non/)).closest("tr")!;
    expect(within(row).queryByRole("button", { name: "Present" })).toBeNull();
    fireEvent.keyDown(window, { key: "p" });
    await new Promise((r) => setTimeout(r, 20));
    expect(adminApi.mark).not.toHaveBeenCalled();
  });

  it("ignores shortcut keys while a dialog is open", async () => {
    renderPage();
    await screen.findByText(/นนท์ · Non/);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select นนท์" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark present" }));
    await screen.findByRole("button", { name: "Confirm" });
    fireEvent.keyDown(window, { key: "p" });
    await new Promise((r) => setTimeout(r, 20));
    expect(adminApi.mark).not.toHaveBeenCalled();
  });

  it("the panel marks the session you switched to", async () => {
    renderPage();
    fireEvent.click((await screen.findByText(/นนท์ · Non/)).closest("tr")!);
    fireEvent.click(screen.getByRole("button", { name: "afternoon" }));
    fireEvent.click(within(screen.getByRole("complementary", { name: "Details" })).getByRole("button", { name: "Late" }));
    await waitFor(() => expect(adminApi.mark).toHaveBeenCalledWith({ user_id: "c", date: "2026-11-23", session: "afternoon", status: "late" }));
  });

  it("shows who needs support on Today and tags them in the roster", async () => {
    renderPage();
    const card = await screen.findByRole("region", { name: "Needs support" });
    expect(card).toHaveTextContent("Leave 6/8");
    const row = (await screen.findByText(/นนท์ · Non/)).closest("tr")!;
    expect(within(row).getByText("Support")).toBeInTheDocument();
  });

  it("adds a note from the panel's Notes tab once", async () => {
    renderPage();
    fireEvent.click((await screen.findByText(/นนท์ · Non/)).closest("tr")!);
    const panel = screen.getByRole("complementary", { name: "Details" });
    fireEvent.click(within(panel).getByRole("tab", { name: "Notes" }));
    fireEvent.change(await within(panel).findByLabelText("New note"), { target: { value: "Called him" } });
    const b = within(panel).getByRole("button", { name: "Add note" });
    fireEvent.click(b);
    fireEvent.click(b);
    await waitFor(() => expect(wellbeingApi.addNote).toHaveBeenCalledTimes(1));
    expect(wellbeingApi.addNote).toHaveBeenCalledWith("c", "Called him");
  });

  it("marks check-ins from a shared network", async () => {
    const v = view();
    v.learners[0].morning = { ...v.learners[0].morning, flag: "shared_ip" } as never;
    vi.mocked(adminApi.today).mockResolvedValue(v);
    renderPage();
    const row = (await screen.findByText(/เถียม · Theim/)).closest("tr")!;
    expect(within(row).getByTitle("Checked in from the same network as another learner")).toBeInTheDocument();
  });

  it("hides Ping when Slack isn't connected", async () => {
    renderPage();
    await screen.findByText(/นนท์ · Non/);
    expect(screen.queryByRole("button", { name: /^Ping the/ })).toBeNull();
  });

  it("pings the ones not in yet once, after confirming", async () => {
    vi.mocked(slackApi.available).mockResolvedValue({ connected: true });
    renderPage();
    const ping = await screen.findByRole("button", { name: "Ping the 2 not in yet" });
    fireEvent.click(ping);
    const ok = await screen.findByRole("button", { name: "Confirm" });
    fireEvent.click(ok);
    fireEvent.click(ok);
    await waitFor(() => expect(slackApi.ping).toHaveBeenCalledTimes(1));
    expect(slackApi.ping).toHaveBeenCalledWith(["c", "d"]);
  });

  it("explains quiet hours instead of claiming it sent", async () => {
    vi.mocked(slackApi.available).mockResolvedValue({ connected: true });
    vi.mocked(slackApi.ping).mockResolvedValue({ sent: 0, no_slack: [], failed: 0, recent: 0, quiet: true });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Ping the 2 not in yet" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(slackApi.ping).toHaveBeenCalled());
    const { toast } = await import("sonner");
    await waitFor(() => expect(vi.mocked(toast).mock.calls.flat().join(" ")).toMatch(/quiet hours/i));
  });

  it("says who was skipped because they were pinged a moment ago", async () => {
    vi.mocked(slackApi.available).mockResolvedValue({ connected: true });
    vi.mocked(slackApi.ping).mockResolvedValue({ sent: 0, no_slack: [], failed: 0, recent: 2, quiet: false });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Ping the 2 not in yet" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    const { toast } = await import("sonner");
    await waitFor(() => expect(JSON.stringify([vi.mocked(toast).mock.calls, vi.mocked(toast.success).mock.calls])).toMatch(/pinged in the last 30 min/i));
  });
});
