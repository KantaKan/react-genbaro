import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { GroupsPage, shuffleGroups } from "./GroupsPage";
import { cohortApi } from "./api";
import { wellbeingApi } from "../wellbeing";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]) } }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]), learners: vi.fn() } }));
vi.mock("./api", () => ({ cohortApi: { moveGroups: vi.fn() } }));

const L = (id: string, th: string, g: string) => ({ id, first_name: th, zoom_name: `01_${th}(${th}/${th})`, jsd_number: "01", genmate_group: g, email: "", attendance_rate: 1, leave_used: 0, mood: [], last_seen: null, support: false });

describe("GroupsPage", () => {
  beforeEach(() => {
    vi.mocked(wellbeingApi.learners).mockResolvedValue([L("a", "Mint", "B"), L("b", "Fah", "C"), L("c", "Non", "B")]);
    vi.mocked(cohortApi.moveGroups).mockReset().mockResolvedValue(undefined);
  });

  it("moves a learner with the keyboard-friendly menu and saves once", async () => {
    renderAdmin(<GroupsPage />, "/admin/groups");
    const chip = (await screen.findByText("Mint")).closest("li")!;
    fireEvent.change(within(chip).getByLabelText("Move Mint to"), { target: { value: "C" } });
    expect(within(screen.getByRole("region", { name: "Group C" })).getByText("Mint")).toBeInTheDocument();
    const save = screen.getByRole("button", { name: /Save 1 change/ });
    fireEvent.click(save);
    fireEvent.click(save);
    await waitFor(() => expect(cohortApi.moveGroups).toHaveBeenCalledTimes(1));
    expect(cohortApi.moveGroups).toHaveBeenCalledWith(13, [{ user_id: "a", group: "C" }]);
  });

  it("shuffles into balanced groups", () => {
    const out = shuffleGroups(["1", "2", "3", "4", "5"], 2, () => 0.3);
    const sizes = Object.values(out.reduce<Record<string, number>>((m, g) => ((m[g] = (m[g] ?? 0) + 1), m), {}));
    expect(sizes.sort()).toEqual([2, 3]);
  });
});
