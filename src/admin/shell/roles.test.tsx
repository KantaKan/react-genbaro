import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, within } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { adminApi } from "../api";
import { can } from "../team/perm";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]) } }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]), me: vi.fn() } }));

const me = (staff_role: string, cohorts: number[] = [13], groups: string[] = []) => vi.mocked(adminApi.me).mockResolvedValue({ id: "me", first_name: "Kan", staff_role, cohorts, groups } as never);

describe("roles in the admin shell", () => {
  beforeEach(() => vi.mocked(adminApi.me).mockReset());

  it("mirrors the backend table", () => {
    expect(can("viewer", "mark")).toBe(false);
    expect(can("ta", "leave")).toBe(true);
    expect(can("ta", "cohort_admin")).toBe(false);
    expect(can("admin", "team")).toBe(false);
    expect(can("owner", "team")).toBe(true);
  });

  it("a viewer sees no cohort tools, no Team, and a Read only tag", async () => {
    me("viewer");
    renderAdmin(<p>page</p>, "/admin/x");
    expect(await screen.findByText("Read only")).toBeInTheDocument();
    const nav = screen.getAllByRole("navigation", { name: "Admin" })[0];
    expect(within(nav).queryByText("Check-in rules")).toBeNull();
    expect(within(nav).queryByText("Team & roles")).toBeNull();
    expect(within(nav).getByText("Today")).toBeInTheDocument();
  });

  it("the owner sees Team & roles", async () => {
    me("owner", []);
    renderAdmin(<p>page</p>, "/admin/x");
    const nav = screen.getAllByRole("navigation", { name: "Admin" })[0];
    expect(await within(nav).findByText("Team & roles")).toBeInTheDocument();
  });

  it("everyone, even a viewer, can open the weekly report", async () => {
    me("viewer");
    renderAdmin(<p>page</p>, "/admin/x");
    await screen.findByText("Read only");
    expect(within(screen.getAllByRole("navigation", { name: "Admin" })[0]).getByText("Weekly report")).toBeInTheDocument();
  });

  it("everyone can look at the calendar", async () => {
    me("viewer");
    renderAdmin(<p>page</p>, "/admin/x");
    await screen.findByText("Read only");
    expect(within(screen.getAllByRole("navigation", { name: "Admin" })[0]).getByText("Calendar")).toBeInTheDocument();
  });

  it("Slack settings are for the owner only", async () => {
    me("admin", [13]);
    renderAdmin(<p>page</p>, "/admin/x");
    await screen.findByText("Admin");
    const nav = screen.getAllByRole("navigation", { name: "Admin" })[0];
    expect(within(nav).queryByText("Slack")).toBeNull();
  });

  it("the owner sees Slack settings", async () => {
    me("owner", []);
    renderAdmin(<p>page</p>, "/admin/x");
    const nav = screen.getAllByRole("navigation", { name: "Admin" })[0];
    expect(await within(nav).findByText("Slack")).toBeInTheDocument();
  });

  it("a TA picks only their cohorts and can't create one", async () => {
    me("ta", [13, 14], ["B"]);
    renderAdmin(<p>page</p>, "/admin/x");
    await screen.findByText("TA");
    fireEvent.click(screen.getByRole("button", { name: /JSD13/ }));
    expect(screen.queryByText("+ New cohort…")).toBeNull();
    expect(screen.getByRole("button", { name: "JSD14" })).toBeInTheDocument();
  });
});
