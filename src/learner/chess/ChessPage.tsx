import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Chess } from "chess.js";
import { useQueryClient } from "react-query";
import { useUserData } from "@/UserDataContext";
import { useAuth } from "@/application/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { usePageHeader } from "../shell/LearnerShell";
import { Board } from "./Board";
import { chessApi } from "./api";
import { useChessGame } from "./usePolling";
import { LayoutA, LayoutB, LayoutC, LayoutD, type LayoutProps } from "./layouts";
import type { ChessView } from "./types";

type Layout = "A" | "B" | "C";
const LAYOUTS = { A: LayoutA, B: LayoutB, C: LayoutC };
const layoutKey = (userId: string) => `chess-layout:${userId}`;

function useWide() {
  const q = "(min-width: 1024px)";
  const [wide, setWide] = useState(() => typeof window.matchMedia !== "function" || window.matchMedia(q).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return wide;
}

function useLayout(userId: string): [Layout, (l: Layout) => void] {
  const read = (): Layout => {
    try {
      const v = localStorage.getItem(layoutKey(userId));
      return v === "B" || v === "C" ? v : "A";
    } catch {
      return "A";
    }
  };
  const [layout, setLayout] = useState<Layout>(read);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setLayout(read()), [userId]);
  return [
    layout,
    (l) => {
      setLayout(l);
      try {
        localStorage.setItem(layoutKey(userId), l);
      } catch {
        /* private window: keep it for this visit */
      }
    },
  ];
}

const sanOf = (fen: string, uci: string) => {
  try {
    return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san;
  } catch {
    return uci;
  }
};

function MoveBar({ view, uci, onDone, onCancel }: { view: ChessView; uci: string; onDone: () => void; onCancel: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const san = sanOf(view.game!.fen, uci);
  const go = async () => {
    setBusy(true);
    setErr("");
    try {
      await (view.you_are_picked ? chessApi.move(uci) : chessApi.propose(uci, note.trim()));
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid w-full max-w-[560px] gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {!view.you_are_picked && (
          <input
            value={note}
            maxLength={140}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เหตุผลสั้นๆ (ไม่ใส่ก็ได้)"
            aria-label="เหตุผล"
            className="min-w-0 flex-1 rounded-[10px] bg-l-card px-3 py-2 text-body shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_2px_var(--l-indigo)]"
          />
        )}
        <button type="button" disabled={busy} onClick={go} className={cn("rounded-[10px] bg-zinc-900 px-4 py-2 text-body font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900", view.you_are_picked && "flex-1")}>
          {view.you_are_picked ? `เดิน ${san}` : `เสนอ ${san}`}
        </button>
        <button type="button" onClick={onCancel} className="rounded-[10px] px-3 py-2 text-body font-medium text-l-ink2 hover:bg-l-sub">
          ยกเลิก
        </button>
      </div>
      {err && <p className="text-small text-red-600">{err}</p>}
    </div>
  );
}

export function ChessPage({ cohort: forCohort }: { cohort?: number } = {}) {
  const [params] = useSearchParams();
  const cohort = forCohort ?? (Number(params.get("cohort")) || undefined);
  const { userData } = useUserData();
  const { userRole } = useAuth();
  const me = userData?._id ?? "";
  const staff = userRole === "admin";
  const qc = useQueryClient();
  const game = useChessGame(cohort);
  const wide = useWide();
  const [layout, setLayout] = useLayout(me);
  const [pending, setPending] = useState("");
  const view = useMemo(() => game.data && { ...game.data, proposals: game.data.proposals ?? [] }, [game.data]);
  const fen = view?.game?.fen;
  useEffect(() => setPending(""), [fen]);

  const actions = useMemo(
    () =>
      wide ? (
        <div role="group" aria-label="Layout" className="flex rounded-full bg-l-sub p-0.5">
          {(["A", "B", "C"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={layout === l}
              onClick={() => setLayout(l)}
              className={cn("h-7 w-8 rounded-full text-small font-semibold", layout === l ? "bg-l-card text-l-ink shadow-[0_0_0_1px_var(--l-hair)]" : "text-l-ink3")}
            >
              {l}
            </button>
          ))}
        </div>
      ) : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wide, layout],
  );
  usePageHeader({ title: "หมากรุก", context: `JSD${cohort ?? userData?.cohort_number ?? ""} · ทีมขาวปะทะทีมดำ`, actions });

  if (game.isLoading) return <p className="text-body text-l-ink3">กำลังโหลดกระดาน…</p>;
  if (game.isError || !view) return <p className="text-body text-l-ink3">โหลดเกมไม่ได้ ลองใหม่อีกครั้ง</p>;
  if (!view.game) {
    return (
      <section className="l-card mx-auto max-w-[520px] p-6 text-center">
        <div className="text-4xl leading-none">♞</div>
        <h2 className="mt-3 text-title font-semibold">ยังไม่มีเกมหมากรุก</h2>
        <p className="mt-1 text-body text-l-ink3">ทีมงานยังไม่เปิดหมากรุกให้รุ่นนี้ หรือรุ่นยังมีกลุ่มเจนเมทไม่ถึงสองกลุ่ม</p>
      </section>
    );
  }

  const g = view.game;
  const canAct = view.my_side === g.turn.side;
  const refresh = () => {
    qc.invalidateQueries(["chess"]);
    qc.invalidateQueries(["chess-me"]);
  };
  const props: LayoutProps = {
    view,
    me,
    staff,
    cohort,
    refresh,
    onPick: canAct ? (p) => setPending(p.uci) : undefined,
    board: (size) => (
      <Board
        key={g.fen}
        fen={g.fen}
        orientation={view.my_side || "white"}
        onMove={canAct ? setPending : undefined}
        lastMove={g.moves?.[g.moves.length - 1]?.uci}
        proposals={pending ? [pending] : view.proposals.map((p) => p.uci)}
        size={size}
      />
    ),
    moveBar: pending ? (
      <MoveBar
        key={pending}
        view={view}
        uci={pending}
        onCancel={() => setPending("")}
        onDone={() => {
          setPending("");
          refresh();
        }}
      />
    ) : null,
  };
  const Active = wide ? LAYOUTS[layout] : LayoutD;
  return <Active {...props} />;
}
