import { useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import type { Side } from "./types";

const GLYPH: Record<string, string> = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const NAME: Record<string, string> = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };
const FILES = "abcdefgh";

interface Props {
  fen: string;
  /** Which side sits at the bottom. */
  orientation?: Side;
  /** When set, the side to move can pick pieces and this gets the move as UCI (e2e4, e7e8q). */
  onMove?: (uci: string) => void;
  lastMove?: string;
  proposals?: string[];
  size?: number | string;
}

const squaresOf = (uci?: string) => (uci ? [uci.slice(0, 2), uci.slice(2, 4)] : []);

export function Board({ fen, orientation = "white", onMove, lastMove, proposals = [], size = "100%" }: Props) {
  const game = useMemo(() => new Chess(fen), [fen]);
  const [from, setFrom] = useState<Square | null>(null);
  const [promo, setPromo] = useState<string | null>(null);

  const targets = useMemo(() => (from ? game.moves({ square: from, verbose: true }) : []), [game, from]);
  const last = squaresOf(lastMove);
  const proposed = new Set(proposals.flatMap(squaresOf));
  const rows = game.board();
  const ranks = orientation === "white" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  const click = (sq: Square) => {
    if (!onMove) return;
    const hit = targets.filter((m) => m.to === sq);
    if (from && hit.length) {
      if (hit.some((m) => m.promotion)) return setPromo(from + sq);
      onMove(from + sq);
      return setFrom(null);
    }
    const piece = game.get(sq);
    setFrom(piece && piece.color === game.turn() && sq !== from ? sq : null);
  };

  return (
    <div style={{ position: "relative", width: size, maxWidth: "100%" }}>
      <div
        role="grid"
        aria-label="Chess board"
        style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", aspectRatio: "1", borderRadius: 10, overflow: "hidden", boxShadow: "0 0 0 1px var(--l-hair)", containerType: "inline-size" }}
      >
        {ranks.flatMap((r) =>
          ranks.map((_, i) => {
            const f = orientation === "white" ? i : 7 - i;
            const sq = (FILES[f] + (8 - r)) as Square;
            const p = rows[r][f];
            const light = (r + f) % 2 === 0;
            const target = targets.some((m) => m.to === sq);
            const ring = sq === from ? "#18181b" : last.includes(sq) ? "#c98a1b" : proposed.has(sq) ? "#4f7fd6" : "";
            return (
              <button
                key={sq}
                type="button"
                data-square={sq}
                aria-label={p ? `${sq} ${p.color === "w" ? "white" : "black"} ${NAME[p.type]}` : sq}
                aria-pressed={sq === from}
                onClick={() => click(sq)}
                disabled={!onMove}
                style={{
                  all: "unset",
                  display: "grid",
                  placeItems: "center",
                  position: "relative",
                  background: light ? "#efe6d3" : "#b99a73",
                  boxShadow: ring ? `inset 0 0 0 3px ${ring}` : undefined,
                  cursor: onMove ? "pointer" : "default",
                  fontSize: "10cqi",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                {p && (
                  <span style={{ color: p.color === "w" ? "#fff" : "#1c1a17", WebkitTextStroke: p.color === "w" ? "1px #2b241a" : undefined }}>
                    {GLYPH[p.type]}
                    {"︎"}
                  </span>
                )}
                {target && <span aria-hidden style={{ position: "absolute", width: "28%", height: "28%", borderRadius: "50%", background: "rgb(24 24 27 / .28)" }} />}
              </button>
            );
          }),
        )}
      </div>
      {promo && (
        <div role="dialog" aria-label="Promote to" className="l-card" style={{ position: "absolute", inset: "35% 15% auto", display: "flex", gap: 6, justifyContent: "center", padding: 10 }}>
          {["q", "r", "b", "n"].map((t) => (
            <button
              key={t}
              type="button"
              aria-label={`Promote to ${NAME[t]}`}
              onClick={() => {
                onMove?.(promo + t);
                setPromo(null);
                setFrom(null);
              }}
              style={{ all: "unset", cursor: "pointer", fontSize: 30, padding: "2px 6px", borderRadius: 8 }}
            >
              {GLYPH[t]}
              {"︎"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
