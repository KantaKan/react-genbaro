import { setLogger } from "react-query";
import '@testing-library/jest-dom/vitest';

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn(() => null),
});

// A query that fails after a test ends would log during worker teardown and fail the run.
setLogger({ log: () => {}, warn: () => {}, error: () => {} });

// Pages that show holiday-aware streaks fetch /holidays; tests that care mock leaveService themselves.
vi.mock("@/application/services/leaveService", async (orig) => {
  const real = await orig<typeof import("@/application/services/leaveService")>();
  const getHolidays = vi.fn().mockResolvedValue([]);
  return { ...real, getHolidays, leaveService: { ...real.leaveService, getHolidays } };
});
