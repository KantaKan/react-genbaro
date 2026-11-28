import { setLogger } from "react-query";
import '@testing-library/jest-dom/vitest';

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn(() => null),
});

// A query that fails after a test ends would log during worker teardown and fail the run.
setLogger({ log: () => {}, warn: () => {}, error: () => {} });

// The learner shell asks whether chess is on; chess tests set their own results on these fns.
vi.mock("@/learner/chess/api", () => ({
  chessApi: {
    current: vi.fn().mockResolvedValue({ game: null, my_side: "", you_are_picked: false, picked_name: "", teams: null, proposals: [] }),
    me: vi.fn().mockResolvedValue({ enabled: false, my_turn: false }),
    move: vi.fn().mockResolvedValue(null),
    propose: vi.fn().mockResolvedValue(null),
    vote: vi.fn().mockResolvedValue(null),
    messages: vi.fn().mockResolvedValue([]),
    post: vi.fn(),
    end: vi.fn().mockResolvedValue(null),
  },
}));

// Pages that show holiday-aware streaks fetch /holidays; tests that care mock leaveService themselves.
vi.mock("@/application/services/leaveService", async (orig) => {
  const real = await orig<typeof import("@/application/services/leaveService")>();
  const getHolidays = vi.fn().mockResolvedValue([]);
  return { ...real, getHolidays, leaveService: { ...real.leaveService, getHolidays } };
});
