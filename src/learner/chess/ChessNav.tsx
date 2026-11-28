import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { chessApi } from "./api";

/** Whether chess is on for my cohort and it's my turn; shared by the nav dot and the Today card. */
export function useChessMe() {
  return useQuery(["chess-me"], chessApi.me, { refetchInterval: 60_000, staleTime: 30_000 });
}

export function ChessTurnCard() {
  const { data } = useChessMe();
  if (!data?.my_turn) return null;
  return (
    <Link to="/learner/chess" className="l-card flex items-center gap-3 p-[18px] hover:bg-l-sub">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-xl text-amber-900">♞</span>
      <span className="min-w-0 flex-1">
        <span className="block text-title font-semibold">ถึงตาคุณเดินแล้ว</span>
        <span className="text-small text-l-ink3">ทีมรอคุณอยู่ เพื่อนเสนอตาเดินไว้ให้ดูแล้ว</span>
      </span>
      <span className="text-body font-medium text-l-ink2">เดิน ›</span>
    </Link>
  );
}
