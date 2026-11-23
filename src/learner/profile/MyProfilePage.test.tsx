import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { MyProfilePage } from "./MyProfilePage";
import { learnerApi } from "../api";

vi.mock("../cup/api", () => ({ cupApi: { me: vi.fn().mockResolvedValue({ champion_group: "F", my_medals: [{ week: "2026-08-24", week_no: 8 }], standings: [] }) } }));
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/UserDataContext", () => ({
  useUserData: () => ({
    userData: { _id: "me", first_name: "Aphiradee", zoom_name: "03_Aphiradee(Black/แบล็ค)", jsd_number: "03", genmate_group: "F", cohort_number: 13, bio: "Ex-accountant", skills: ["React", "Figma", "Go", "SQL", "CSS"], badges: [], profile_comments: [] },
    loading: false,
    refetchUserData: vi.fn(),
  }),
}));
const { refl } = vi.hoisted(() => {
const zones = ["Comfort Zone", "Stretch zone - Enjoying the challenges", "Stretch zone - Overwhelmed", "Panic Zone"];
const refl = Array.from({ length: 25 }, (_, i) => ({
  _id: `r${i}`,
  user_id: "me",
  date: `2026-08-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
  day: `2026-08-${String(i + 1).padStart(2, "0")}`,
  reflection: { barometer: zones[i % 4], tech_sessions: {}, non_tech_sessions: {} },
}));
return { refl };
});
vi.mock("../api", async (orig) => {
  const real = await orig<typeof import("../api")>();
  return {
    ...real,
    learnerApi: {
      ...real.learnerApi,
      getSummary: vi.fn().mockResolvedValue({ streak: 12, attendance_rate: 0.971, perfect_week: false, leave_used: 2, leave_allowance: 8, preferences: { checkin_style: "cat", checkin_random: false } }),
      getMyReflections: vi.fn().mockResolvedValue(refl),
      savePreferences: vi.fn().mockResolvedValue({}),
    },
  };
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <MyProfilePage />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("MyProfilePage", () => {
  it("shows my own stats", async () => {
    renderPage();
    expect(await screen.findByText("97.1%")).toBeInTheDocument();
    expect(screen.getByText("Plant streak")).toBeInTheDocument();
  });

  it("draws one barometer bar per reflection and can narrow to the last 4 weeks", async () => {
    renderPage();
    const strip = await screen.findByTestId("barometer-strip");
    expect(await within(strip).findAllByTestId("baro-bar")).toHaveLength(25);
    fireEvent.click(screen.getByRole("button", { name: "Last 4 weeks" }));
    expect(within(strip).getAllByTestId("baro-bar")).toHaveLength(20);
  });

  it("caps skills at five", async () => {
    renderPage();
    fireEvent.change(await screen.findByPlaceholderText("Add a skill"), { target: { value: "Docker" } });
    expect(screen.getByRole("button", { name: "Add skill" })).toBeDisabled();
    expect(learnerApi.savePreferences).not.toHaveBeenCalled();
  });

  it("shows Cup medals and the champion frame", async () => {
    renderPage();
    expect(await screen.findByText("GenMate Cup · Week 8")).toBeInTheDocument();
    expect(document.querySelector("[data-champion]")).not.toBeNull();
  });
});
