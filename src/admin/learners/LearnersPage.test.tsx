import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { LearnersPage } from "./LearnersPage";
import { wellbeingApi, type LearnerRow } from "../wellbeing";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]) } }));
vi.mock("../wellbeing", async (orig) => ({ ...(await orig<object>()), wellbeingApi: { learners: vi.fn() } }));

const row = (o: Partial<LearnerRow>): LearnerRow => ({ id: "x", first_name: "", zoom_name: "", jsd_number: "01", genmate_group: "A", email: "", attendance_rate: 1, leave_used: 0, mood: [], last_seen: null, support: false, ...o });
const rows = [
  row({ id: "u1", first_name: "Kanokwan", zoom_name: "04_Kanokwan(Mint/มิ้นท์)", jsd_number: "04", email: "mint@x.com", support: true, leave_used: 7 }),
  row({ id: "u2", first_name: "Fah", zoom_name: "09_Fah(Fah/ฟ้า)", jsd_number: "09", email: "fah@x.com" }),
  row({ id: "u3", first_name: "Ploy", zoom_name: "02_Ploy(Ploy/พลอย)", jsd_number: "02", attendance_status: "dropout" }),
];

describe("LearnersPage", () => {
  beforeEach(() => vi.mocked(wellbeingApi.learners).mockResolvedValue(rows));

  it("searches by Thai nickname and hides dropped learners by default", async () => {
    renderAdmin(<LearnersPage />, "/admin/learners");
    await screen.findByText(/ฟ้า · Fah/);
    expect(screen.queryByText(/พลอย/)).toBeNull();
    fireEvent.change(screen.getByLabelText("Search learners"), { target: { value: "มิ้นท์" } });
    expect(screen.queryByText(/ฟ้า · Fah/)).toBeNull();
    expect(screen.getByText(/มิ้นท์ · Mint/)).toBeInTheDocument();
  });

  it("filters to who needs support", async () => {
    renderAdmin(<LearnersPage />, "/admin/learners");
    fireEvent.click(await screen.findByRole("button", { name: /Needs support/ }));
    expect(screen.queryByText(/ฟ้า · Fah/)).toBeNull();
    expect(screen.getByText(/มิ้นท์ · Mint/)).toBeInTheDocument();
  });

  it("opens the profile on row click", async () => {
    renderAdmin(<LearnersPage />, "/admin/learners", "/admin/learners");
    fireEvent.click((await screen.findByText(/ฟ้า · Fah/)).closest("tr")!);
    expect(await screen.findByText("other page")).toBeInTheDocument();
  });
});
