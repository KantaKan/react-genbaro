import { api } from "@/infrastructure/api";
import { call } from "../api";
import type { ChessMessage, ChessView, Room } from "./types";

const q = (cohort?: number) => (cohort ? `cohort=${cohort}` : "");

export const chessApi = {
  current: (cohort?: number) => call<ChessView>(api.get(`/chess/current?${q(cohort)}`)),
  me: () => call<{ enabled: boolean; my_turn: boolean }>(api.get("/chess/me")),
  move: (uci: string) => call<unknown>(api.post("/chess/move", { uci })),
  propose: (uci: string, note: string) => call<unknown>(api.post("/chess/proposals", { uci, note })),
  vote: (id: string) => call<unknown>(api.post(`/chess/proposals/${id}/vote`)),
  messages: (room: Room, after: string, cohort?: number) =>
    call<ChessMessage[]>(api.get(`/chess/messages?room=${room}&after=${encodeURIComponent(after)}&${q(cohort)}`)),
  post: (room: Room, text: string, cohort?: number) => call<ChessMessage>(api.post(`/chess/messages?${q(cohort)}`, { room, text })),
  end: (cohort: number) => call<unknown>(api.post(`/admin/chess/${cohort}/end`)),
};
