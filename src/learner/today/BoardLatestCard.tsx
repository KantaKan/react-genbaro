import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { getPosts } from "@/application/services/boardService";
import { nicknames } from "../lib/name";

const ago = (iso: string) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return h < 1 ? "just now" : h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
};

export function BoardLatestCard() {
  const { data = [] } = useQuery(["board-posts"], getPosts, { staleTime: 60_000 });
  const posts = [...data].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)).slice(0, 3);
  return (
    <section className="l-card p-[22px]">
      <div className="flex items-start justify-between">
        <h3 className="text-[15px] font-semibold">From the Talk Board</h3>
        <Link to="/learner/board" className="-m-2 rounded-lg p-2 text-[13px] font-medium text-l-ink2 hover:bg-l-sub">
          Open board ›
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="mt-4 text-[13px] text-l-ink3">Nothing new yet.</p>
      ) : (
        posts.map((p) => {
          const n = nicknames(p.zoomName, p.zoomName);
          return (
            <Link key={p.id} to={`/talk-board/${p.id}`} className="flex gap-3 border-t border-l-hair py-3.5 first:mt-2 first:border-t-0">
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-indigo-500 text-xs font-semibold text-white">{(n.th || n.en).slice(0, 2)}</span>
              <span className="min-w-0">
                <span className="line-clamp-1 font-medium">{p.content}</span>
                <span className="text-[12.5px] text-l-ink3">
                  {n.th || n.en} · {p.comments?.length ?? 0} replies · {ago(p.createdAt)}
                </span>
              </span>
            </Link>
          );
        })
      )}
    </section>
  );
}
