import { setLogger } from "react-query";
import '@testing-library/jest-dom/vitest';

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn(() => null),
});

// A query that fails after a test ends would log during worker teardown and fail the run.
setLogger({ log: () => {}, warn: () => {}, error: () => {} });
