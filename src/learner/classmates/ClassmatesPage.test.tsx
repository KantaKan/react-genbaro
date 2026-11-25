import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { LearnerShell } from "../shell/LearnerShell";
import { ClassmatesPage } from "./ClassmatesPage";
import { userService } from "@/application/services/userService";

const { people } = vi.hoisted(() => ({ people: [
      { _id: "me", first_name: "Aphiradee", zoom_name: "03_Aphiradee(Black/แบล็ค)", jsd_number: "03", genmate_group: "F", cohort_number: 13, role: "learner" },
      { _id: "u2", first_name: "Mint", zoom_name: "22_Mint(Mint/มิ้นท์)", jsd_number: "22", genmate_group: "F", cohort_number: 13, role: "learner", bio: "Loves CSS", skills: ["CSS"], avatar: { style: "lorelei", seed: "m", bg: "fce7f3" } },
      { _id: "u3", first_name: "Ajjima", zoom_name: "01_Ajjima(Theim/เถียม)", jsd_number: "01", genmate_group: "I", cohort_number: 13, role: "learner", attendance_status: "dropout", social_links: { github: "javascript:alert(1)", linkedin: "https://linkedin.com/in/x" }, profile_comments: [{ id: "c1", userId: "u2", zoomName: "22_Mint(Mint/มิ้นท์)", content: "Great at CSS", createdAt: "2026-09-01" }] },
    ] }));
vi.mock("../cup/api", () => ({ cupApi: { me: vi.fn().mockResolvedValue({ champion_group: "I", my_medals: [], standings: [] }) } }));
vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "learner" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/UserDataContext", () => ({
  useUserData: () => ({ userData: { _id: "me", first_name: "Aphiradee", zoom_name: "03_Aphiradee(Black/แบล็ค)", genmate_group: "F", cohort_number: 13 }, loading: false, refetchUserData: vi.fn() }),
}));
vi.mock("../api", async (orig) => ({ ...(await orig<object>()), learnerApi: { getSummary: vi.fn().mockResolvedValue({ streak: 0 }), getCohortPeople: vi.fn().mockResolvedValue(people) } }));
vi.mock("@/application/services/userService", () => ({
  userService: {
    getAllUsers: vi.fn(),
    addProfileComment: vi.fn().mockResolvedValue(undefined),
  },
}));

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/learner/directory"]}>
        <LearnerShell>
          <ClassmatesPage />
        </LearnerShell>
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("ClassmatesPage", () => {
  it("shows my GenMate group first", async () => {
    renderPage();
    const strip = await screen.findByRole("region", { name: /Your GenMate group/ });
    expect(within(strip).getByText("มิ้นท์")).toBeInTheDocument();
    expect(within(strip).queryByText("เถียม")).toBeNull();
  });

  it("opens a private-safe profile panel and sends one recommendation", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Open เถียม/ }));
    const panel = await screen.findByRole("dialog");
    expect(panel).toHaveTextContent("Attendance, leave and reflections are private");
    expect(panel.textContent).not.toMatch(/attendance rate|streak|dropout/i);
    fireEvent.change(within(panel).getByPlaceholderText(/What's great about working with/), { target: { value: "Great pair partner." } });
    fireEvent.click(within(panel).getByRole("button", { name: "Recommend" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Recommend" }));
    await waitFor(() => expect(userService.addProfileComment).toHaveBeenCalledTimes(1));
    expect(userService.addProfileComment).toHaveBeenCalledWith("u3", { content: "Great pair partner." });
  });

  it("never links to non-http social URLs and shows recommenders' avatars", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Open เถียม/ }));
    const panel = await screen.findByRole("dialog");
    expect(within(panel).queryByText("GitHub")).toBeNull();
    expect(within(panel).getByText("LinkedIn").closest("a")).toHaveAttribute("href", "https://linkedin.com/in/x");
    const rec = within(panel).getByText("Great at CSS").closest("div")!.parentElement!;
    expect(rec.querySelector("img[data-avatar='dicebear']")).not.toBeNull();
  });

  it("frames last week's Cup champions", async () => {
    renderPage();
    const card = await screen.findByRole("button", { name: /Open เถียม/ });
    await waitFor(() => expect(card.querySelector("[data-champion]")).not.toBeNull());
    for (const b of screen.getAllByRole("button", { name: /Open มิ้นท์/ })) expect(b.querySelector("[data-champion]")).toBeNull();
  });
});
