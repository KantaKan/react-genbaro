import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { JourneyPage } from "./JourneyPage";
import { learnerApi } from "../api";
import type { Journey } from "./types";

vi.mock("../api", () => ({ learnerApi: { getJourney: vi.fn(), savePreferences: vi.fn() } }));
vi.mock("../cup/api", () => ({ cupApi: { me: vi.fn().mockResolvedValue({ my_medals: [] }) } }));
vi.mock("../shell/LearnerShell", () => ({ usePageHeader: () => undefined }));

const story: Journey = {
  unlocked: true, name: "Fern", cohort: "13", first_day: "2026-09-01", last_day: "2026-12-18", weeks: 16, class_days: 76, written: 72,
  grid: [{ date: "2026-09-01", zone: "comfort" }, { date: "2026-09-02", zone: null }],
  zone_counts: { comfort: 38, "stretch-enjoying": 21, "stretch-overwhelmed": 10, panic: 3 }, main_zone: "comfort",
  hardest_week: { number: 11, from: "2026-11-09", to: "2026-11-13", zones: ["stretch-overwhelmed", "panic", "", "comfort", "comfort"] },
  darkest_night: { date: "2026-11-11", zone: "panic", text: "รู้สึกตามเพื่อนไม่ทัน", reply: "", reply_name: "" },
  comeback: { length: 23, after_darkest: true }, attendance_rate: null, badges: 7, ta_replies: 0,
  quote: { reflection_id: "r1", date: "2026-12-12", text: "deploy ครั้งแรก" }, quote_options: [],
};

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <JourneyPage />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("JourneyPage", () => {
  beforeEach(() => localStorage.clear());

  it("says it isn't time yet while locked", async () => {
    vi.mocked(learnerApi.getJourney).mockResolvedValue({ unlocked: false });
    renderPage();
    expect(await screen.findByText(/ยังไม่ถึงเวลา/)).toBeInTheDocument();
  });

  it("walks the story with the arrow keys and handles a night without a TA reply", async () => {
    vi.mocked(learnerApi.getJourney).mockResolvedValue(story);
    renderPage();
    expect(await screen.findByText(/Fern/)).toBeInTheDocument();
    expect(screen.getByText(/เรียนจบแล้ว/)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("คืนที่คุณเขียนถึงตัวเอง")).toBeInTheDocument();
    for (let i = 0; i < 3; i++) fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(/รู้สึกตามเพื่อนไม่ทัน/)).toBeInTheDocument();
    expect(screen.getByText("แล้วคุณก็ผ่านมันมาได้")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("W11")).toBeInTheDocument();
  });

  it("hides attendance when there is none and lets the learner hide the darkest night", async () => {
    vi.mocked(learnerApi.getJourney).mockResolvedValue(story);
    renderPage();
    await screen.findByText(/เรียนจบแล้ว/);
    for (let i = 0; i < 4; i++) fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.click(screen.getByRole("button", { name: "ซ่อนหน้านี้" }));
    expect(screen.queryByText(/รู้สึกตามเพื่อนไม่ทัน/)).not.toBeInTheDocument();
    expect(localStorage.getItem("journey-hide-night")).toBe("1");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.queryByText("มาเรียน")).not.toBeInTheDocument();
    expect(screen.getByText("badges")).toBeInTheDocument();
  });
});
