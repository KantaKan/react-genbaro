import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { getPosts } from "@/application/services/boardService";
import { decodeHtmlEntities, type BoardComment, type BoardPost } from "@/lib/board";
import { nicknames } from "../lib/name";

const ago = (iso: string) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return h < 1 ? "just now" : h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
};

/** The reply to show under a post: the most-liked one if any reply has reactions, else the newest. */
export function featuredReply(p: BoardPost): { reply: BoardComment; top: boolean } | null {
  const replies = p.comments ?? [];
  if (replies.length === 0) return null;
  const liked = [...replies].sort((a, b) => (b.reactions?.length ?? 0) - (a.reactions?.length ?? 0) || (b.createdAt > a.createdAt ? 1 : -1))[0];
  if ((liked.reactions?.length ?? 0) > 0) return { reply: liked, top: true };
  return { reply: [...replies].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))[0], top: false };
}

const who = (zoomName: string) => {
  const n = nicknames(zoomName, zoomName);
  return n.th || n.en;
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
        <ul className="mt-2">
          {posts.map((p) => {
            const name = who(p.zoomName);
            const f = featuredReply(p);
            return (
              <li key={p.id} className="border-t border-l-hair first:border-t-0">
                <Link to={`/talk-board/${p.id}`} className="-mx-2 flex gap-3 rounded-xl px-2 py-3.5 hover:bg-l-sub">
                  <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-indigo-500 text-xs font-semibold text-white">{name.slice(0, 2)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 font-medium">{decodeHtmlEntities(p.content)}</span>
                    <span className="text-[12.5px] text-l-ink3">
                      {name} · {p.comments?.length ?? 0} {(p.comments?.length ?? 0) === 1 ? "reply" : "replies"} · {ago(p.createdAt)}
                    </span>
                    {f && (
                      <span className="mt-2 flex gap-2 rounded-[12px] bg-l-sub px-3 py-2">
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-1.5 text-[11.5px]">
                            <b className="font-semibold text-l-ink2">{who(f.reply.zoomName)}</b>
                            <span className={f.top ? "font-semibold text-indigo-600 dark:text-indigo-300" : "text-l-ink3"}>{f.top ? "Top reply" : "Latest reply"}</span>
                            {f.top && <span className="text-l-ink3">· {f.reply.reactions.length} {f.reply.reactions.length === 1 ? "reaction" : "reactions"}</span>}
                          </span>
                          <span className="line-clamp-2 text-[13px] leading-snug text-l-ink">{decodeHtmlEntities(f.reply.content)}</span>
                        </span>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
