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

  /** Merges messages in time order. Only polls move the cursor, so a posted message can't skip ones sent just before it. */
  const add = useCallback((more: ChessMessage[]) => {
    if (!more.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      return [...prev, ...more.filter((m) => !seen.has(m.id))].sort((a, b) => (a.at === b.at ? (a.id < b.id ? -1 : 1) : a.at < b.at ? -1 : 1));
    });
  }, []);

  useEffect(() => {
    setMessages([]);
    last.current = "";
    if (!gameId) return;
    let alive = true;
    const poll = () => {
      if (document.hidden) return;
      chessApi.messages(room, last.current, cohort).then((m) => {
        if (!alive || !m.length) return;
        last.current = m[m.length - 1].id;
        add(m);
      }, () => {});
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
