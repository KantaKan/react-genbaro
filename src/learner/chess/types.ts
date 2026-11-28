export type Side = "white" | "black";
export type Room = Side | "all";

export interface ChessMove {
  ply: number;
  uci: string;
  san: string;
  side: Side;
  user_id: string;
  user_name: string;
  by_team: boolean;
  at: string;
}

export interface ChessProposal {
  id: string;
  user_id: string;
  user_name: string;
  uci: string;
  san: string;
  note: string;
  voters: string[] | null;
  at: string;
}

export interface ChessGame {
  id: string;
  cohort_number: number;
  status: "active" | "ended";
  started_at: string;
  ended_at?: string;
  result: string;
  end_reason: string;
  fen: string;
  moves: ChessMove[] | null;
  turn: { side: Side; picked_user_id: string; picked_at: string; deadline: string };
}

export interface ChessMember {
  id: string;
  name: string;
  group: string;
}

export interface ChessView {
  game: ChessGame | null;
  my_side: Side | "";
  you_are_picked: boolean;
  picked_name: string;
  teams: Partial<Record<Side, { groups: string[]; members: ChessMember[] | null }>> | null;
  proposals: ChessProposal[];
}

export interface ChessMessage {
  id: string;
  game_id: string;
  room: Room;
  user_id: string;
  user_name: string;
  text: string;
  system: boolean;
  at: string;
}
