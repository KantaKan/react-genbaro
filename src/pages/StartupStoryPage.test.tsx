import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import StartupStoryPage from "./StartupStoryPage";

const me = "507f1f77bcf86cd799439012";
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ userId: me, userRole: "learner" }) }));
vi.mock("@/application/contexts/UserDataContext", () => ({ useUserData: () => ({ userData: { startup_story_opt_out: false } }) }));

const T = Date.parse("2026-10-01T12:00:00Z");
const founder = { id: "founder-0", name: "Ploy", title: "Design Nerd", sprite: "designer", frontend: 3, backend: 1, design: 6, debug: 2, salary: 0 };
const genmate = { id: "cand-1", name: "Mint", title: "Backend Dev", sprite: "dev", genmate_id: "u2", trait: "night_owl", frontend: 2, backend: 3, design: 1, debug: 2, salary: 1200 };
const hubRun = {
  _id: "run-1", mode: "free", status: "active", stage: "hub", act: 1, market: { hot: ["Thai Culture"], cold: ["Fintech"] }, boss_order: ["outage-3am", "demo-day"],
  bosses_passed: 0, project_index: 0, money: 10000, fans: 0, staff: [founder], candidates: [genmate], score: 0, version: 2,
};
const items = [
  { id: "rubber-duck", name: "Rubber Duck", icon: "🦆", rarity: "common", desc: "−2 bugs per ship" },
  { id: "legacy", name: "Legacy Codebase", icon: "☠️", rarity: "cursed", desc: "×1.3 power, +6 bugs" },
  { id: "keyboard", name: "Mechanical Keyboard", icon: "⌨️", rarity: "common", desc: "+2 team Frontend" },
];
let run: Record<string, unknown> | null = hubRun;
let attemptsLeft = 3;
let requests: Array<{ path: string; body: unknown }> = [];

const overview = () => ({
  studio: { _id: "s1", fame: 12, hall_of_fame: [] }, run, ranked_attempts_left: attemptsLeft, week_key: "2026-W40",
  server_time: new Date(T).toISOString(), types: ["Game"], themes: ["Thai Culture", "Fintech"], items,
  unlocks: [{ fame: 20, kind: "founder", id: "Ex-FAANG Refugee", name: "Ex-FAANG Refugee" }],
});
const record = (path: string) => async ({ request }: { request: Request }) => {
  const text = await request.text();
  requests.push({ path, body: text ? JSON.parse(text) : undefined });
};

const server = setupServer(
  http.get("*/startup-story", () => HttpResponse.json({ data: overview() })),
  http.get("*/startup-story/leaderboard", () => HttpResponse.json({ data: [{ owner_id: "other", name: "Nat", score: 9000 }, { owner_id: me, name: "Ploy", score: 8000 }] })),
  http.post("*/startup-story/runs/active/projects", async (info) => {
    await record("projects")(info);
    return HttpResponse.json({
      data: { ...hubRun, stage: "developing", version: 3, project: { type: "Game", theme: "Thai Culture", staff_ids: ["founder-0"], started_at: new Date(T + 20_000).toISOString(), ends_at: new Date(T + 50_000).toISOString() } },
    });
  }),
  http.post("*/startup-story/runs/active/item", async (info) => {
    await record("item")(info);
    return HttpResponse.json({ data: { ...hubRun, items: ["legacy"], version: 5 } });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
  run = hubRun;
  attemptsLeft = 3;
  requests = [];
});
afterAll(() => server.close());

const renderPage = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><StartupStoryPage /></QueryClientProvider>);

describe("StartupStoryPage", () => {
  it("keeps the dev countdown true to the server clock after actions", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(T);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Game" }));
    fireEvent.click(screen.getByRole("button", { name: /Thai Culture/ }));
    now.mockReturnValue(T + 20_000);
    fireEvent.click(screen.getByRole("button", { name: /Start building/ }));

    expect(await screen.findByText("Building... 30s")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ship it" })).toBeDisabled();
  });

  it("enables Ship exactly when the server's ends_at arrives", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(T);
    run = { ...hubRun, stage: "developing", project: { type: "Game", theme: "Thai Culture", staff_ids: ["founder-0"], started_at: new Date(T).toISOString(), ends_at: new Date(T + 30_000).toISOString() } };
    renderPage();

    expect(await screen.findByRole("button", { name: "Ship it" })).toBeDisabled();
    now.mockReturnValue(T + 29_500);
    expect(await screen.findByText("Building... 1s")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ship it" })).toBeDisabled();
    now.mockReturnValue(T + 30_000);
    expect(await screen.findByText("Ready to ship! 🚀")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ship it" })).toBeEnabled();
  });

  it("marks the market and sends only the selected staff", async () => {
    run = { ...hubRun, staff: [founder, { ...genmate, id: "dev-2" }] };
    renderPage();

    expect(await screen.findByRole("button", { name: "Thai Culture 🔥" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fintech 🧊" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Game" }));
    fireEvent.click(screen.getByRole("button", { name: "Thai Culture 🔥" }));
    fireEvent.click(screen.getByRole("button", { name: /Mint/ }));
    fireEvent.click(screen.getByRole("button", { name: /Start building/ }));

    await screen.findByText(/Building/);
    expect(requests).toEqual([{ path: "projects", body: { type: "Game", theme: "Thai Culture", staff_ids: ["founder-0"] } }]);
  });

  it("shows genmate candidates and blocks hiring past the team cap", async () => {
    run = { ...hubRun, staff: [founder, { ...founder, id: "dev-9", name: "Bank" }] };
    renderPage();

    fireEvent.click(await screen.findByRole("tab", { name: /Hire/ }));
    expect(screen.getByLabelText("genmate")).toBeInTheDocument();
    expect(screen.getByText(/Night Owl/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Team full" })).toBeDisabled();
  });

  it("introduces the boss before its project", async () => {
    run = { ...hubRun, project_index: 2 };
    renderPage();

    expect(await screen.findByText("3AM Production Outage 🚨")).toBeInTheDocument();
    expect(screen.getByText(/Reach 20\/40 to pass/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Face the boss/ })).toBeInTheDocument();
  });

  it("drafts an item and shows it in the HUD", async () => {
    run = { ...hubRun, stage: "item", item_offer: ["rubber-duck", "legacy", "keyboard"] };
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Legacy Codebase/ }));

    const owned = await screen.findByRole("list", { name: "Your items" });
    expect(within(owned).getByText("Legacy Codebase")).toBeInTheDocument();
    expect(requests).toEqual([{ path: "item", body: { index: 1 } }]);
  });

  it("shows ranked attempts, fame progress and the cohort board in the lobby", async () => {
    run = null;
    attemptsLeft = 0;
    renderPage();

    expect(await screen.findByRole("button", { name: /Weekly Seed/ })).toBeDisabled();
    expect(screen.getByText(/Next: Ex-FAANG Refugee at 20/)).toBeInTheDocument();
    expect(await screen.findByText("🥈 Ploy (you)")).toBeInTheDocument();
  });
});
