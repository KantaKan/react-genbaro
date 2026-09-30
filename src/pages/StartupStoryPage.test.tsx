import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import StartupStoryPage from "./StartupStoryPage";

const T = Date.parse("2026-10-01T12:00:00Z");
const founder = { id: "founder-0", name: "Ploy", title: "Design Nerd", sprite: "designer", frontend: 3, backend: 1, design: 6, debug: 2, salary: 0 };
const hubRun = { _id: "run-1", mode: "free", status: "active", stage: "hub", project_index: 0, money: 10000, fans: 0, staff: [founder], score: 0, version: 2 };

const server = setupServer(
  http.get("*/startup-story", () => HttpResponse.json({
    data: { studio: { _id: "s1", fame: 0 }, run: hubRun, server_time: new Date(T).toISOString(), types: ["Game"], themes: ["Thai Culture"] },
  })),
  http.post("*/startup-story/runs/active/projects", () => HttpResponse.json({
    data: { ...hubRun, stage: "developing", version: 3, project: { type: "Game", theme: "Thai Culture", staff_ids: ["founder-0"], started_at: new Date(T + 20_000).toISOString(), ends_at: new Date(T + 50_000).toISOString() } },
  })),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

describe("StartupStoryPage", () => {
  it("keeps the dev countdown true to the server clock after actions", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(T);
    render(<QueryClientProvider client={new QueryClient()}><StartupStoryPage /></QueryClientProvider>);

    fireEvent.click(await screen.findByRole("button", { name: "Game" }));
    fireEvent.click(screen.getByRole("button", { name: "Thai Culture" }));
    now.mockReturnValue(T + 20_000);
    fireEvent.click(screen.getByRole("button", { name: /Start building/ }));

    expect(await screen.findByText("Building... 30s")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ship it" })).toBeDisabled();
  });
});
