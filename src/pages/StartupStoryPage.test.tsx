import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import StartupStoryPage from "./StartupStoryPage";

const me = "507f1f77bcf86cd799439012";
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ userId: me, userRole: "learner" }) }));

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
  unlocks: [{ fame: 20, kind: "founder", id: "Ex-FAANG Refugee", name: "Ex-FAANG Refugee" }], opt_out: false,
  perks: [{ id: "arch-btw", name: "I Use Arch btw 🐧", desc: "+1 Dev Community" }, { id: "ship-it", name: "Ship-It Energy 🚀", desc: "Builds faster" }, { id: "clean-code", name: "Clean-code Zealot", desc: "−1 bug" }],
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
  http.post("*/startup-story/runs/active/ipo-choice", async (info) => {
    await record("ipo-choice")(info);
    return HttpResponse.json({ data: { ...hubRun, act: 4, max_act: 4, endless: true, project_index: 9, next_boss: "outage-3am", next_pass_mark: 28, version: 9 } });
  }),
  http.post("*/startup-story/runs/active/perk", async (info) => {
    await record("perk")(info);
    return HttpResponse.json({ data: { ...hubRun, stage: "item", item_offer: ["rubber-duck"], staff: [{ ...founder, level: 3, xp: 5, xp_next: 210, perks: ["arch-btw"] }], version: 7 } });
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

  it("starts a project from a pitch card with one tap", async () => {
    run = { ...hubRun, pitches: [
      { type: "LINE Bot", theme: "Street Food", title: "🍜 Street-food LINE bot" },
      { type: "Mobile App", theme: "Pets", title: "🐶 Tinder for dogs" },
      { type: "VR Game", theme: "K-pop/Idols", title: "🎤 Front-row idol concert in VR" },
    ] };
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Tinder for dogs/ }));

    await screen.findByText(/Building/);
    expect(requests).toEqual([{ path: "projects", body: { pitch_index: 1, staff_ids: ["founder-0"] } }]);
  });

  it("falls back to the custom picker from a pitch card", async () => {
    run = { ...hubRun, pitches: [
      { type: "LINE Bot", theme: "Street Food", title: "🍜 Street-food LINE bot" },
      { type: "Mobile App", theme: "Pets", title: "🐶 Tinder for dogs" },
      { type: "VR Game", theme: "K-pop/Idols", title: "🎤 Front-row idol concert in VR" },
    ] };
    renderPage();

    expect(await screen.findByRole("button", { name: /Tinder for dogs/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Custom project/ }));

    fireEvent.click(await screen.findByRole("button", { name: "Game" }));
    fireEvent.click(screen.getByRole("button", { name: /Thai Culture/ }));
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
    expect(screen.getByText(/Reach 18\/40 to pass/)).toBeInTheDocument();
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

  it("saves the candidate opt-out from the Lobby toggle", async () => {
    run = null;
    server.use(
      http.get("*/startup-story", () => HttpResponse.json({ data: { ...overview(), opt_out: true } })),
      http.put("*/startup-story/opt-out", async (info) => {
        await record("opt-out")(info);
        return HttpResponse.json({ data: { opt_out: false } });
      }),
    );
    renderPage();

    const toggle = await screen.findByRole("checkbox", { name: /Hide me from/i });
    expect(toggle).toBeChecked();
    expect(screen.getByText(/first name can show up/i)).toBeInTheDocument();

    fireEvent.click(toggle);

    await waitFor(() => expect(requests).toEqual([{ path: "opt-out", body: { opt_out: false } }]));
    expect(await screen.findByRole("checkbox", { name: /Hide me from/i })).not.toBeChecked();
  });

  it("offers cash out or keep going after the IPO, then shows the endless act", async () => {
    run = { ...hubRun, act: 3, stage: "ipo_choice", project_index: 9 };
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /Keep going/ }));

    expect(await screen.findByText(/🚀 Endless/)).toBeInTheDocument();
    expect(screen.getByText(/Series B · Act 4 · Project 1\/3/)).toBeInTheDocument();
    expect(requests).toEqual([{ path: "ipo-choice", body: { keep_going: true } }]);
  });

  it("shows the server's boss pass mark, not a stale hardcoded one", async () => {
    run = { ...hubRun, act: 5, endless: true, project_index: 14, next_boss: "outage-3am", next_pass_mark: 30 };
    renderPage();

    expect(await screen.findByText(/Reach 30\/40 to pass/)).toBeInTheDocument();
  });

  it("warns about burned-out teammates and offers a team retreat instead of an item", async () => {
    run = { ...hubRun, stage: "item", item_offer: ["rubber-duck"], staff: [founder, { ...genmate, id: "dev-2", name: "Bank", genmate_id: undefined, burnout: 85 }] };
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /team retreat to Hua Hin/ }));

    await screen.findByRole("list", { name: "Your items" });
    expect(requests).toEqual([{ path: "item", body: { index: -1 } }]);
  });

  it("pauses for a perk pick on level-up and shows the perk on the dev card", async () => {
    run = { ...hubRun, stage: "perk", staff: [{ ...founder, level: 3, xp: 5, xp_next: 210 }], pending_perk: { dev_id: "founder-0", offer: ["ship-it", "arch-btw", "clean-code"] } };
    renderPage();

    expect(await screen.findByText(/Ploy reached Lv 3!/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /I Use Arch btw/ }));

    expect(await screen.findByRole("heading", { name: /Pick an item/ })).toBeInTheDocument();
    expect(requests).toEqual([{ path: "perk", body: { index: 1 } }]);
  });

  it("shows stars, the OSS badge and OSS boss names in an open-source run", async () => {
    run = { ...hubRun, oss: true, act: 3, project_index: 8, next_boss: "ipo-pitch", next_pass_mark: 45, fans: 1200 };
    renderPage();

    expect(await screen.findByText("🐙 Open Source")).toBeInTheDocument();
    expect(screen.getByText(/1,200 ⭐ stars/)).toBeInTheDocument();
    expect(screen.getByText("v1.0 Launch 🚀")).toBeInTheDocument();
    expect(screen.getByText(/Reach 45\/50 to pass/)).toBeInTheDocument();
  });
});
