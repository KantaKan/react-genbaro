import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useClock } from "../checkin/useClock";
import { chessApi } from "./api";
import { useChessMessages } from "./usePolling";
import type { ChessGame, ChessMember, ChessProposal, ChessView, Room, Side } from "./types";

export const TEAM: Record<Side, string> = { white: "ทีมขาว", black: "ทีมดำ" };
export const KING: Record<Side, string> = { white: "♔", black: "♚" };

const hm = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" });
const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" });
const wd = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", weekday: "short" });

/** Time left on the turn; past today it shows the day and time, since the clock only runs 09:00–21:00. */
export function timeLeft(deadline: string, now: Date) {
  const d = new Date(deadline);
  const ms = d.getTime() - now.getTime();
  if (ms <= 0) return "หมดเวลา รอทีมเลือกให้";
  if (day.format(d) !== day.format(now)) return `ถึง ${wd.format(d)} ${hm.format(d)}`;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h ? `เหลือ ${h} ชม. ${m} นาที` : `เหลือ ${m} นาที`;
}

export function Avatar({ name, side }: { name: string; side?: Side | "" }) {
  return (
    <span
      className={cn(
        "grid h-6 w-6 shrink-0 place-items-center rounded-full text-micro font-bold",
        side === "black" ? "bg-zinc-800 text-white" : "bg-l-sub text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]",
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}

export function TeamPills({ view }: { view: ChessView }) {
  return (
    <>
      {(["white", "black"] as const).map((s) => (
        <span
          key={s}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-small font-semibold",
            s === "white" ? "bg-l-card shadow-[0_0_0_1px_var(--l-hair)]" : "bg-zinc-900 text-white",
          )}
        >
          {KING[s]} {TEAM[s]} {view.teams?.[s]?.groups?.join(" ")}
        </span>
      ))}
    </>
  );
}

/** Whose turn it is and for how long, or "your turn". */
export function TurnBanner({ view }: { view: ChessView }) {
  useClock(30_000);
  const now = new Date();
  const g = view.game as ChessGame;
  const mine = view.you_are_picked;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-small font-semibold", mine ? "bg-amber-100 text-amber-900" : "bg-l-sub text-l-ink2")}>
      {mine ? "ตาคุณ!" : (
        <>
          ตาของ <b>{view.picked_name || "…"}</b> ({TEAM[g.turn.side]})
        </>
      )}
      <span className="font-normal">· {timeLeft(g.turn.deadline, now)}</span>
    </span>
  );
}

export function LastMove({ game }: { game: ChessGame }) {
  const m = game.moves?.[game.moves.length - 1];
  if (!m) return <p className="text-small text-l-ink3">ยังไม่มีใครเดิน ทีมขาวเริ่มก่อน</p>;
  return (
    <p className="text-small text-l-ink3">
      {TEAM[m.side]}เดิน <b className="text-l-ink2">{m.san}</b> · {m.by_team ? "ทีมเลือกให้ (หมดเวลา)" : m.user_name}
    </p>
  );
}

export function Proposals({ view, me, onPick, onVoted, compact }: { view: ChessView; me: string; onPick?: (p: ChessProposal) => void; onVoted: () => void; compact?: boolean }) {
  const [busy, setBusy] = useState("");
  const list = [...view.proposals].sort((a, b) => (b.voters?.length ?? 0) - (a.voters?.length ?? 0));
  if (!view.game || (view.my_side !== view.game.turn.side && !view.proposals.length)) {
    return <p className="text-small text-l-ink3">ข้อเสนอของแต่ละทีมเห็นได้เฉพาะในทีม ตอนนี้เป็นตาของ{TEAM[view.game?.turn.side ?? "white"]}</p>;
  }
  if (!list.length) return <p className="text-small text-l-ink3">ยังไม่มีข้อเสนอ ลองเลือกตาเดินบนกระดานแล้วกดเสนอ</p>;
  const vote = async (p: ChessProposal) => {
    setBusy(p.id);
    try {
      await chessApi.vote(p.id);
      onVoted();
    } finally {
      setBusy("");
    }
  };
  return (
    <ul className="grid gap-1.5">
      {list.map((p, i) => {
        const agreed = !!p.voters?.includes(me);
        return (
          <li key={p.id} className={cn("flex items-center gap-2 rounded-xl bg-l-card px-2.5 py-2", i === 0 ? "shadow-[0_0_0_2px_#4f7fd6]" : "shadow-[0_0_0_1px_var(--l-hair)]")}>
            {!compact && <Avatar name={p.user_name} />}
            <button type="button" disabled={!onPick} onClick={() => onPick?.(p)} className="font-semibold disabled:cursor-default">
              {p.san}
            </button>
            <span className="min-w-0 flex-1 truncate text-small text-l-ink3">{compact ? p.user_name : p.note || p.user_name}</span>
            <button
              type="button"
              aria-pressed={agreed}
              aria-label={`เห็นด้วยกับ ${p.san}`}
              disabled={busy === p.id}
              onClick={() => vote(p)}
              className={cn("rounded-full px-2.5 py-0.5 text-small font-semibold", agreed ? "bg-zinc-900 text-white" : "bg-l-sub text-l-ink2")}
            >
              👍 {p.voters?.length ?? 0}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function TeamRoster({ view, side, dark }: { view: ChessView; side: Side; dark?: boolean }) {
  const team = view.teams?.[side];
  const members: ChessMember[] = team?.members ?? [];
  const moved = new Map<string, number>();
  for (const m of view.game?.moves ?? []) moved.set(m.user_id, (moved.get(m.user_id) ?? 0) + 1);
  const picked = view.game?.turn.picked_user_id;
  return (
    <section className={cn("rounded-[20px] p-3", dark ? "bg-zinc-900 text-zinc-100" : "l-card")}>
      <b>
        {KING[side]} {TEAM[side]}
      </b>
      <div className={cn("text-small", dark ? "text-zinc-400" : "text-l-ink3")}>
        กลุ่ม {team?.groups?.join(" ")} · {members.length} คน
      </div>
      <ul className="mt-2 grid max-h-[420px] gap-1 overflow-y-auto">
        {members.map((m) => (
          <li key={m.id} className={cn("flex items-center gap-2 rounded-[10px] px-1.5 py-1 text-body", m.id === picked && (dark ? "bg-zinc-700" : "bg-amber-50"))}>
            <Avatar name={m.name} side={side} />
            <span className="min-w-0 flex-1 truncate">{m.name}</span>
            <span className={cn("text-small", dark ? "text-zinc-400" : "text-l-ink3")}>{m.id === picked ? "ตอนนี้" : moved.get(m.id) ? `เดิน ${moved.get(m.id)}` : ""}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The rooms this viewer may use: their team's and the cohort's; staff get both teams. */
export function roomsFor(view: ChessView, staff: boolean): { room: Room; label: string }[] {
  const teams: Side[] = staff ? ["white", "black"] : view.my_side ? [view.my_side] : [];
  return [...teams.map((s) => ({ room: s as Room, label: TEAM[s] })), { room: "all" as Room, label: "ทั้งรุ่น" }];
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn("rounded-full px-3 py-1 text-small font-semibold", value === t.id ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-l-ink2 hover:bg-l-sub")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Chat({ room, view, me, cohort, tall }: { room: Room; view: ChessView; me: string; cohort?: number; tall?: boolean }) {
  const { messages, add } = useChessMessages(room, view.game?.id, cohort);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const sideOf = (id: string): Side | "" => (view.teams?.white?.members?.some((m) => m.id === id) ? "white" : view.teams?.black?.members?.some((m) => m.id === id) ? "black" : "");

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "nearest" });
  }, [messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setErr("");
    try {
      add([await chessApi.post(room, t, cohort)]);
      setText("");
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div>
      <div className={cn("overflow-y-auto", tall ? "h-[460px]" : "h-[260px]")}>
        {messages.length === 0 && <p className="py-6 text-center text-small text-l-ink3">ยังเงียบอยู่ ทักทายกันหน่อย</p>}
        {messages.map((m) =>
          m.system ? (
            <p key={m.id} className="my-1.5 rounded-xl bg-zinc-900 px-3 py-1.5 text-small text-white">
              {m.text}
            </p>
          ) : (
            <div key={m.id} className={cn("flex items-start gap-2 py-1", m.user_id === me && "flex-row-reverse")}>
              <Avatar name={m.user_name} side={sideOf(m.user_id)} />
              <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-xl bg-l-sub px-2.5 py-1.5 text-body leading-snug">
                {m.user_id !== me && <b className="mr-1">{m.user_name}</b>}
                {m.text}
              </div>
            </div>
          ),
        )}
        <div ref={end} />
      </div>
      <form
        className="mt-2 flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          placeholder={room === "all" ? "พิมพ์ถึงทั้งรุ่น…" : `พิมพ์ใน${TEAM[room]}…`}
          aria-label="ข้อความ"
          className="min-w-0 flex-1 rounded-[10px] bg-l-card px-3 py-2 text-body shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_2px_var(--l-indigo)]"
        />
        <button type="submit" className="rounded-[10px] bg-zinc-900 px-3 text-body font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
          ส่ง
        </button>
      </form>
      {err && <p className="mt-1 text-small text-red-600">{err}</p>}
    </div>
  );
}
