import { useState, type ReactNode } from "react";
import type { ChessView, Room } from "./types";
import { Chat, LastMove, Proposals, Tabs, TeamPills, TeamRoster, TurnBanner, roomsFor } from "./parts";
import type { ChessProposal } from "./types";

export interface LayoutProps {
  view: ChessView;
  me: string;
  staff: boolean;
  cohort?: number;
  board: (size?: string) => ReactNode;
  moveBar: ReactNode;
  onPick?: (p: ChessProposal) => void;
  refresh: () => void;
}

function useRoom(p: LayoutProps) {
  const rooms = roomsFor(p.view, p.staff);
  const [room, setRoom] = useState<Room>(rooms[0].room);
  return { rooms, room: rooms.some((r) => r.room === room) ? room : rooms[0].room, setRoom };
}

const title = (v: ChessView) => `ตาที่ ${(v.game?.moves?.length ?? 0) + 1}`;

function ProposalsCard(p: LayoutProps) {
  return (
    <section className="l-card p-4">
      <h3 className="text-body font-semibold">
        ข้อเสนอของทีม <span className="font-normal text-l-ink3">· {p.view.you_are_picked ? "คุณเป็นคนเลือก" : `${p.view.picked_name || "คนที่ถูกสุ่ม"}จะเลือก`}</span>
      </h3>
      <div className="mt-2">
        <Proposals view={p.view} me={p.me} onPick={p.onPick} onVoted={p.refresh} />
      </div>
    </section>
  );
}

function ChatCard(p: LayoutProps & { tall?: boolean; extra?: { id: "proposals"; label: string } }) {
  const { rooms, room, setRoom } = useRoom(p);
  const [tab, setTab] = useState<Room | "proposals">(room);
  const cur = tab === "proposals" ? tab : room;
  const tabs: { id: Room | "proposals"; label: string }[] = [...rooms.map((r) => ({ id: r.room, label: r.label })), ...(p.extra ? [p.extra] : [])];
  return (
    <section className="l-card p-4">
      <Tabs
        tabs={tabs}
        value={cur}
        onChange={(t) => {
          setTab(t);
          if (t !== "proposals") setRoom(t);
        }}
      />
      <div className="mt-2">
        {cur === "proposals" ? <Proposals view={p.view} me={p.me} onPick={p.onPick} onVoted={p.refresh} /> : <Chat key={cur} room={cur} view={p.view} me={p.me} cohort={p.cohort} tall={p.tall} />}
      </div>
    </section>
  );
}

/** A: board on the left, proposals and chat in a rail. */
export function LayoutA(p: LayoutProps) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <b className="text-title">{title(p.view)}</b>
        <TeamPills view={p.view} />
        <span className="ml-auto">
          <TurnBanner view={p.view} />
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section className="l-card grid justify-items-center gap-3 p-4">
          {p.board("min(100%, 560px)")}
          <LastMove game={p.view.game!} />
          {p.moveBar}
        </section>
        <div className="grid content-start gap-4">
          <ProposalsCard {...p} />
          <ChatCard {...p} />
        </div>
      </div>
    </div>
  );
}

/** B: chat first, with a small pinned board that opens to full size. */
export function LayoutB(p: LayoutProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto grid max-w-[760px] gap-4">
      <section className="l-card flex flex-wrap items-center gap-4 p-3">
        {p.board(open ? "min(100%, 520px)" : "140px")}
        <div className="grid gap-1.5">
          <b className="text-title">{title(p.view)}</b>
          <TurnBanner view={p.view} />
          <LastMove game={p.view.game!} />
          <button type="button" onClick={() => setOpen(!open)} className="w-fit rounded-[10px] bg-zinc-900 px-3 py-1.5 text-small font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {open ? "ย่อกระดาน" : "เปิดกระดานเต็ม"}
          </button>
        </div>
        {p.moveBar && <div className="w-full">{p.moveBar}</div>}
      </section>
      <ProposalsCard {...p} />
      <ChatCard {...p} tall />
    </div>
  );
}

/** C: both teams' rosters flank the board, chat below. */
export function LayoutC(p: LayoutProps) {
  return (
    <div className="grid gap-4">
      <div className="grid items-start gap-4 lg:grid-cols-[200px_minmax(0,1fr)_200px]">
        <TeamRoster view={p.view} side="white" />
        <section className="l-card grid justify-items-center gap-3 p-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <b className="text-title">{title(p.view)}</b>
            <TurnBanner view={p.view} />
          </div>
          {p.board("min(100%, 500px)")}
          <LastMove game={p.view.game!} />
          {p.moveBar}
        </section>
        <TeamRoster view={p.view} side="black" dark />
      </div>
      <ChatCard {...p} extra={{ id: "proposals", label: `ข้อเสนอ ${p.view.proposals.length}` }} />
    </div>
  );
}

/** D: phones. Board full width, then tabs for proposals, team and cohort. */
export function LayoutD(p: LayoutProps) {
  return (
    <div className="grid gap-3">
      <div>
        <TurnBanner view={p.view} />
        <div className="mt-1 text-small text-l-ink3">
          {title(p.view)}
          {p.view.my_side ? ` · คุณอยู่${p.view.my_side === "white" ? "ทีมขาว" : "ทีมดำ"}` : ""}
        </div>
      </div>
      {p.board()}
      <LastMove game={p.view.game!} />
      {p.moveBar}
      <ChatCard {...p} extra={{ id: "proposals", label: `ข้อเสนอ ${p.view.proposals.length}` }} />
    </div>
  );
}
