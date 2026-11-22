import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { TeamPage } from "./TeamPage";
import { teamApi } from "./api";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]) } }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]), me: vi.fn().mockResolvedValue({ id: "me", first_name: "Kan", staff_role: "owner", cohorts: [], groups: [] }) } }));
vi.mock("./api", async (o) => ({ ...(await o<object>()), teamApi: { team: vi.fn(), invite: vi.fn(), renew: vi.fn(), cancelInvite: vi.fn(), update: vi.fn(), remove: vi.fn() } }));

describe("TeamPage", () => {
  beforeEach(() => {
    vi.mocked(teamApi.team).mockResolvedValue({
      members: [
        { id: "me", first_name: "Kan", last_name: "P", email: "kan@x.co", staff_role: "owner", cohorts: [], groups: [], created_at: "2026-01-01T00:00:00Z" },
        { id: "t1", first_name: "Fah", last_name: "S", email: "fah@x.co", staff_role: "ta", cohorts: [13], groups: ["B"], created_at: "2026-11-01T00:00:00Z" },
      ],
      invites: [{ id: "i1", email: "new@x.co", role: "viewer", cohorts: [13], groups: [], expires_at: "2026-11-29T00:00:00Z" }],
    });
    vi.mocked(teamApi.invite).mockReset().mockResolvedValue({ id: "i2", token: "TOKEN123", expires_at: "2026-11-29T00:00:00Z" });
    vi.mocked(teamApi.update).mockReset().mockResolvedValue(undefined);
    vi.mocked(teamApi.remove).mockReset().mockResolvedValue(undefined);
  });

  it("invites once and shows the link to copy", async () => {
    renderAdmin(<TeamPage />, "/admin/team");
    fireEvent.click(await screen.findByRole("button", { name: "Invite someone" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "mint@x.co" } });
    fireEvent.click(screen.getByRole("button", { name: "TA" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Group B" }));
    const create = screen.getByRole("button", { name: "Create invite link" });
    fireEvent.click(create);
    fireEvent.click(create);
    await waitFor(() => expect(teamApi.invite).toHaveBeenCalledTimes(1));
    expect(teamApi.invite).toHaveBeenCalledWith({ email: "mint@x.co", role: "ta", cohorts: [13], groups: ["B"] });
    expect(await screen.findByDisplayValue(/\/invite\/TOKEN123$/)).toBeInTheDocument();
  });

  it("changes a role and removes after confirming; your own row is locked", async () => {
    renderAdmin(<TeamPage />, "/admin/team");
    const row = (await screen.findByText("fah@x.co")).closest("tr")!;
    fireEvent.change(within(row).getByLabelText("Role for Fah"), { target: { value: "admin" } });
    await waitFor(() => expect(teamApi.update).toHaveBeenCalledWith("t1", { role: "admin", cohorts: [13], groups: [] }));
    fireEvent.click(within(row).getByRole("button", { name: "Remove Fah" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(teamApi.remove).toHaveBeenCalledWith("t1"));
    const mine = screen.getByText("kan@x.co").closest("tr")!;
    expect(within(mine).queryByRole("button", { name: /Remove/ })).toBeNull();
  });
});
