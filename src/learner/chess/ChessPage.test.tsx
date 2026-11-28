import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ChessPage } from "./ChessPage";
import { LearnerShell } from "../shell/LearnerShell";
import { chessApi } from "./api";
import type { ChessView } from "./types";

vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("../shell/StreakPill", () => ({ StreakPill: () => null }));
let role = "learner";
let me = "w1";
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ userRole: role, logout: vi.fn() }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: me, cohort_number: 13 } }) }));

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const view = (over: Partial<ChessView> = {}): ChessView => ({
  game: {
    id: "g1",
    cohort_number: 13,
    status: "active",
    started_at: "2026-11-26T03:00:00Z",
    result: "",
    end_reason: "",
    fen: START,
    moves: [],
    turn: { side: "white", picked_user_id: "w2", picked_at: "2026-11-26T03:00:00Z", deadline: "2099-01-01T07:00:00Z" },
  },
  my_side: "white",
  you_are_picked: false,
  picked_name: "Fern",
  teams: {
    white: { groups: ["A", "C"], members: [{ id: "w1", name: "Mint", group: "A" }, { id: "w2", name: "Fern", group: "C" }] },
    black: { groups: ["B"], members: [{ id: "b1", name: "Ton", group: "B" }] },
  },
  proposals: [{ id: "p1", user_id: "w1", user_name: "Mint", uci: "d2d4", san: "d4", note: "centre", voters: ["w1"], at: "2026-11-26T03:10:00Z" }],
  ...over,
});

let wide = true;
function setup() {
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: wide, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <LearnerShell>
          <ChessPage />
        </LearnerShell>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  role = "learner";
  me = "w1";
  wide = true;
  localStorage.clear();
  vi.mocked(chessApi.current).mockResolvedValue(view());
  vi.mocked(chessApi.messages).mockResolvedValue([]);
});
afterEach(() => vi.clearAllMocks());

describe("ChessPage", () => {
  it("explains when there is no game", async () => {
    vi.mocked(chessApi.current).mockResolvedValue(view({ game: null }));
    setup();
    expect(await screen.findByText("ยังไม่มีเกมหมากรุก")).toBeInTheDocument();
  });

  it("lets a teammate propose a move with a note and vote", async () => {
    setup();
    fireEvent.click(await screen.findByLabelText("e2 white pawn"));
    fireEvent.click(document.querySelector('[data-square="e4"]')!);
    fireEvent.change(screen.getByLabelText("เหตุผล"), { target: { value: "open lines" } });
    fireEvent.click(screen.getByRole("button", { name: "เสนอ e4" }));
    await waitFor(() => expect(chessApi.propose).toHaveBeenCalledWith("e2e4", "open lines"));
    fireEvent.click(screen.getAllByLabelText("เห็นด้วยกับ d4")[0]);
    await waitFor(() => expect(chessApi.vote).toHaveBeenCalledWith("p1"));
  });

  it("lets the picked member play a proposal", async () => {
    vi.mocked(chessApi.current).mockResolvedValue(view({ you_are_picked: true }));
    setup();
    fireEvent.click((await screen.findAllByText("d4")).find((el) => el.tagName === "BUTTON")!);
    fireEvent.click(screen.getByRole("button", { name: "เดิน d4" }));
    await waitFor(() => expect(chessApi.move).toHaveBeenCalledWith("d2d4"));
  });

  it("survives a null proposal list and shows a failed vote", async () => {
    vi.mocked(chessApi.current).mockResolvedValueOnce(view({ proposals: null as never }));
    const { unmount } = setup();
    expect(await screen.findByLabelText("e2 white pawn")).toBeInTheDocument();
    unmount();
    vi.mocked(chessApi.vote).mockRejectedValueOnce(new Error("that proposal is from an earlier turn"));
    setup();
    fireEvent.click((await screen.findAllByLabelText("เห็นด้วยกับ d4"))[0]);
    expect((await screen.findAllByText("that proposal is from an earlier turn")).length).toBeGreaterThan(0);
  });

  it("keeps the board read-only for the other side", async () => {
    me = "b1";
    vi.mocked(chessApi.current).mockResolvedValue(view({ my_side: "black", proposals: [] }));
    setup();
    expect(await screen.findByLabelText("e2 white pawn")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText(/ข้อเสนอของแต่ละทีมเห็นได้เฉพาะในทีม/).length).toBeGreaterThan(0);
  });

  it("remembers the chosen layout per learner", async () => {
    const { unmount } = setup();
    fireEvent.click(await screen.findByRole("button", { name: "C" }));
    expect(localStorage.getItem("chess-layout:w1")).toBe("C");
    expect(screen.getByText("กลุ่ม A C · 2 คน")).toBeInTheDocument();
    unmount();
    setup();
    expect(await screen.findByRole("button", { name: "C" })).toHaveAttribute("aria-pressed", "true");
  });

  it("uses the mobile layout on small screens with no switcher", async () => {
    wide = false;
    localStorage.setItem("chess-layout:w1", "C");
    setup();
    expect(await screen.findByText(/คุณอยู่ทีมขาว/)).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Layout" })).toBeNull();
  });

  it("posts to the team room and shows the message", async () => {
    vi.mocked(chessApi.post).mockResolvedValue({ id: "m1", game_id: "g1", room: "white", user_id: "w1", user_name: "Mint", text: "go d4", system: false, at: "" });
    setup();
    const box = (await screen.findAllByLabelText("ข้อความ"))[0];
    fireEvent.change(box, { target: { value: "go d4" } });
    fireEvent.submit(box.closest("form")!);
    await waitFor(() => expect(chessApi.post).toHaveBeenCalledWith("white", "go d4", undefined));
    expect(await screen.findByText("go d4")).toBeInTheDocument();
  });
});
