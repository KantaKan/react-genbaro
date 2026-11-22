import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { SlackPage } from "./SlackPage";
import { slackApi, type SlackStatus } from "./api";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]) } }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]), me: vi.fn().mockResolvedValue({ id: "me", first_name: "Kan", staff_role: "owner", cohorts: [], groups: [] }) } }));
vi.mock("./api", () => ({ slackApi: { status: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), save: vi.fn(), channels: vi.fn(), test: vi.fn(), match: vi.fn(), log: vi.fn(), available: vi.fn(), ping: vi.fn() } }));

const base: SlackStatus = { connected: false, team: "", bot: "", alerts: "", report: "", announce: "", alert_new_leave: false, quiet_from: "", quiet_to: "", report_auto: false, report_cohort: 0, manifest: '{"display_information":{"name":"Baro"}}' };
const connected: SlackStatus = { ...base, connected: true, team: "Generation", bot: "baro", alerts: "C1", alert_new_leave: true, quiet_from: "21:00", quiet_to: "08:00" };

describe("SlackPage", () => {
  beforeEach(() => {
    vi.mocked(slackApi.status).mockResolvedValue(base);
    vi.mocked(slackApi.connect).mockReset().mockResolvedValue(connected);
    vi.mocked(slackApi.disconnect).mockReset().mockResolvedValue(undefined);
    vi.mocked(slackApi.save).mockReset().mockResolvedValue(undefined);
    vi.mocked(slackApi.test).mockReset().mockResolvedValue(undefined);
    vi.mocked(slackApi.channels).mockResolvedValue([{ id: "C1", name: "admin-alerts", private: true }, { id: "C2", name: "announcements", private: false }]);
    vi.mocked(slackApi.match).mockReset().mockResolvedValue({ matched: 49, missing: [{ id: "u1", name: "Mint S", email: "mint@x.co" }] });
    vi.mocked(slackApi.log).mockResolvedValue([{ at: "2026-11-23T03:00:00Z", kind: "new_leave", target: "C1", ok: false, error: "slack: not_in_channel" }, { at: "2026-11-23T02:00:00Z", kind: "ping", target: "U1", ok: true }]);
  });

  it("connects with a token once and clears the field", async () => {
    renderAdmin(<SlackPage />, "/admin/settings/slack");
    const field = await screen.findByLabelText("Bot token");
    fireEvent.change(field, { target: { value: "xoxb-123" } });
    const b = screen.getByRole("button", { name: "Connect" });
    fireEvent.click(b);
    fireEvent.click(b);
    await waitFor(() => expect(slackApi.connect).toHaveBeenCalledTimes(1));
    expect(slackApi.connect).toHaveBeenCalledWith("xoxb-123");
    await waitFor(() => expect(screen.queryByDisplayValue("xoxb-123")).toBeNull());
  });

  it("offers the app manifest to copy before connecting", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderAdmin(<SlackPage />, "/admin/settings/slack");
    fireEvent.click(await screen.findByRole("button", { name: "Copy manifest" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(base.manifest));
  });

  describe("when connected", () => {
    beforeEach(() => vi.mocked(slackApi.status).mockResolvedValue(connected));

    it("shows the workspace and disconnects after confirming", async () => {
      renderAdmin(<SlackPage />, "/admin/settings/slack");
      expect(await screen.findByText("Connected to Generation")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
      fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
      await waitFor(() => expect(slackApi.disconnect).toHaveBeenCalledTimes(1));
    });

    it("saves channels, alerts and quiet hours once, and sends a test message", async () => {
      renderAdmin(<SlackPage />, "/admin/settings/slack");
      fireEvent.change(await screen.findByLabelText("Announcements channel"), { target: { value: "C2" } });
      fireEvent.change(screen.getByLabelText("Quiet from"), { target: { value: "22:00" } });
      const save = screen.getByRole("button", { name: "Save" });
      fireEvent.click(save);
      fireEvent.click(save);
      await waitFor(() => expect(slackApi.save).toHaveBeenCalledTimes(1));
      expect(slackApi.save).toHaveBeenCalledWith({ alerts: "C1", report: "", announce: "C2", alert_new_leave: true, quiet_from: "22:00", quiet_to: "08:00", report_auto: false, report_cohort: 0 });
      fireEvent.click(screen.getByRole("button", { name: "Send test to Admin alerts" }));
      await waitFor(() => expect(slackApi.test).toHaveBeenCalledWith("alerts"));
    });

    it("turns on the Friday weekly report for a cohort and saves it", async () => {
      renderAdmin(<SlackPage />, "/admin/settings/slack");
      fireEvent.change(await screen.findByLabelText("Weekly report channel"), { target: { value: "C2" } });
      fireEvent.click(screen.getByLabelText("Send the weekly report automatically on Fridays at 17:00"));
      expect(screen.getByLabelText("Cohort for the weekly report")).toHaveValue(13);
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(slackApi.save).toHaveBeenCalledTimes(1));
      expect(slackApi.save).toHaveBeenCalledWith(expect.objectContaining({ report: "C2", report_auto: true, report_cohort: 13 }));
    });

    it("matches learners by email and lists who wasn't found", async () => {
      renderAdmin(<SlackPage />, "/admin/settings/slack");
      fireEvent.click(await screen.findByRole("button", { name: "Match by email" }));
      expect(await screen.findByText(/49 matched/)).toBeInTheDocument();
      expect(screen.getByText("Mint S")).toBeInTheDocument();
      expect(slackApi.match).toHaveBeenCalledWith(13);
    });

    it("shows recent sends and marks failures", async () => {
      renderAdmin(<SlackPage />, "/admin/settings/slack");
      expect(await screen.findByText(/not_in_channel/)).toBeInTheDocument();
    });
  });
});
