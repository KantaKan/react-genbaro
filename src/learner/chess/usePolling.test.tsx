import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { chessApi } from "./api";
import { useChessMessages } from "./usePolling";
import type { ChessMessage } from "./types";

const msg = (id: string, at: string): ChessMessage => ({ id, game_id: "g1", room: "all", user_id: "u", user_name: "U", text: id, system: false, at });

describe("useChessMessages", () => {
  it("keeps polling from the last polled message after I post, in time order", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(chessApi.messages).mockResolvedValueOnce([msg("m1", "2026-11-28T10:00:00Z")]);
    const { result } = renderHook(() => useChessMessages("all", "g1"));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    act(() => result.current.add([msg("m3", "2026-11-28T10:00:05Z")]));
    vi.mocked(chessApi.messages).mockResolvedValueOnce([msg("m2", "2026-11-28T10:00:03Z"), msg("m3", "2026-11-28T10:00:05Z")]);
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(chessApi.messages).toHaveBeenLastCalledWith("all", "m1", undefined);
    await waitFor(() => expect(result.current.messages.map((m) => m.id)).toEqual(["m1", "m2", "m3"]));
    vi.useRealTimers();
  });
});
