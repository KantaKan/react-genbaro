import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "react-query";
import { chessApi } from "./api";
import type { ChessMessage, Room } from "./types";

/** The running game; react-query stops the interval while the tab is in the background. */
export function useChessGame(cohort?: number) {
  return useQuery(["chess", cohort ?? 0], () => chessApi.current(cohort), { refetchInterval: 15_000 });
}

/** A room's chat, appended every 10 s from the last message seen; skipped while the tab is hidden. */
export function useChessMessages(room: Room, gameId: string | undefined, cohort?: number) {
  const [messages, setMessages] = useState<ChessMessage[]>([]);
  const last = useRef("");

  const add = useCallback((more: ChessMessage[]) => {
    if (!more.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const next = [...prev, ...more.filter((m) => !seen.has(m.id))];
      last.current = next[next.length - 1]?.id ?? "";
      return next;
    });
  }, []);

  useEffect(() => {
    setMessages([]);
    last.current = "";
    if (!gameId) return;
    let alive = true;
    const poll = () => {
      if (document.hidden) return;
      chessApi.messages(room, last.current, cohort).then((m) => alive && add(m), () => {});
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [room, gameId, cohort, add]);

  return { messages, add };
}
