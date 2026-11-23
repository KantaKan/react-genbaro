import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { MessageCircle } from "lucide-react";
import { useUserData } from "@/UserDataContext";
import { boardService } from "@/application/services/boardService";
import { UserAvatar } from "@/components/user-avatar";
import { BOARD_REACTIONS, decodeHtmlEntities, type BoardPost } from "@/lib/board";
import { usePageHeader } from "../shell/LearnerShell";
import { nicknames } from "../lib/name";
import { usePeople } from "../lib/usePeople";
import type { Person } from "../lib/people";

export function rankPosts(list: BoardPost[], mode: "latest" | "popular"): BoardPost[] {
  const score = (p: BoardPost) => (p.reactions?.length ?? 0) + (p.comments?.length ?? 0);
  return [...list].sort((a, b) => (mode === "popular" ? score(b) - score(a) || (b.createdAt > a.createdAt ? 1 : -1) : b.createdAt > a.createdAt ? 1 : -1));
}

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
};

export function BoardPage() {
  const qc = useQueryClient();
  const { userData } = useUserData();
  const { byId } = usePeople();
  const { data = [] } = useQuery(["board-posts"], () => boardService.getPosts(), { staleTime: 30_000 });
  const [mode, setMode] = useState<"latest" | "popular">("latest");
  const [text, setText] = useState("");
  const [bump, setBump] = useState<string | null>(null);
  const posting = useRef(false);
  const tabs = useMemo(
    () => (
      <div className="flex rounded-[10px] bg-l-sub p-[3px]">
        {(["latest", "popular"] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`rounded-lg px-3 py-1 text-small font-semibold capitalize ${mode === m ? "bg-l-card text-l-ink shadow-sm" : "text-l-ink2"}`}>
            {m}
          </button>
        ))}
      </div>
    ),
    [mode]
  );
  usePageHeader({ title: "Talk Board", context: `Questions, resources and memes for JSD${userData?.cohort_number ?? ""}`, actions: tabs });
  const me = nicknames(userData?.zoom_name, userData?.first_name ?? "");

  const post = async () => {
    const content = text.trim();
    if (!content || posting.current || !userData) return;
    posting.current = true;
    try {
      await boardService.createPost({ content, zoomName: userData.zoom_name ?? userData.first_name, cohort: userData.cohort_number });
      setText("");
      qc.invalidateQueries(["board-posts"]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't post");
    } finally {
      posting.current = false;
    }
  };

  const react = async (p: BoardPost, name: string) => {
    const mine = p.reactions?.find((r) => r.userId === userData?._id);
    setBump(`${p.id}:${name}`);
    try {
      if (mine?.value === name) await boardService.removeReaction(p.id);
      else await boardService.addReaction({ postId: p.id, reaction: name });
      qc.invalidateQueries(["board-posts"]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't react");
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-3.5">
        <section className="l-card p-[22px]">
          <div className="flex items-start gap-3">
            <UserAvatar userId={userData?._id} name={me.en} avatar={(userData as Person | null)?.avatar} className="h-10 w-10" />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share something with your cohort…"
              className="h-[68px] flex-1 resize-none rounded-[14px] bg-l-sub px-3.5 py-3 text-body sm:h-[46px] shadow-[0_0_0_1px_var(--l-hair)] outline-none transition-[height] duration-500 focus:h-24 focus:bg-l-card focus:shadow-[0_0_0_1.5px_var(--l-ink)]"
            />
          </div>
          <div className="mt-2.5 flex justify-end">
            <button type="button" onClick={post} disabled={!text.trim()} className="rounded-full bg-l-ink px-4 py-1.5 text-body font-medium text-l-card disabled:opacity-40">
              Post
            </button>
          </div>
        </section>

        {rankPosts(data, mode).map((p) => {
          const n = nicknames(p.zoomName, p.zoomName);
          const counts = BOARD_REACTIONS.map((r) => ({ ...r, n: (p.reactions ?? []).filter((x) => x.value === r.name).length, mine: (p.reactions ?? []).some((x) => x.value === r.name && x.userId === userData?._id) }));
          return (
            <article key={p.id} className="l-card p-[22px]">
              <div className="flex items-center gap-2.5">
                <UserAvatar userId={p.userId} name={n.en} avatar={byId.get(p.userId)?.avatar} className="h-[38px] w-[38px]" />
                <div className="flex-1">
                  <b className="font-semibold">{n.th || n.en}</b>
                  <small className="block text-xs text-l-ink3">{ago(p.createdAt)}</small>
                </div>
              </div>
              <p className="mt-3.5 whitespace-pre-wrap leading-relaxed text-l-ink">{decodeHtmlEntities(p.content)}</p>
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                {counts.map((r) => (
                  <button
                    key={r.name}
                    type="button"
                    aria-label={`React with ${r.name}`}
                    aria-pressed={r.mine}
                    onClick={() => react(p, r.name)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-body tabular-nums transition ${r.mine ? "bg-indigo-50 font-semibold text-indigo-700 shadow-[0_0_0_1.5px_#6366f1] dark:bg-indigo-500/15 dark:text-indigo-300" : "bg-l-card shadow-[0_0_0_1px_var(--l-hair)]"} ${r.n === 0 && !r.mine ? "opacity-60 hover:opacity-100" : ""}`}
                  >
                    <img src={r.url} alt="" className={`h-[18px] w-[18px] ${bump === `${p.id}:${r.name}` ? "animate-[l-bump_.5s]" : ""}`} onAnimationEnd={() => setBump(null)} />
                    {r.n > 0 && r.n}
                  </button>
                ))}
                <span className="flex-1" />
                <Link to={`/talk-board/${p.id}`} className="inline-flex items-center gap-1 text-small text-l-ink3 hover:text-l-ink">
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {p.comments?.length ?? 0} {(p.comments?.length ?? 0) === 1 ? "reply" : "replies"}
                </Link>
              </div>
            </article>
          );
        })}
        {data.length === 0 && <div className="l-card p-10 text-center text-l-ink3">No posts yet. Start the conversation.</div>}
        <style>{`@keyframes l-bump{40%{transform:scale(1.6) rotate(-10deg)}}`}</style>
      </div>
      <aside className="l-card p-[22px] lg:sticky lg:top-20">
        <h5 className="mb-2.5 text-small font-semibold uppercase tracking-[.08em] text-l-ink3">Board rules</h5>
        <p className="text-body leading-relaxed text-l-ink2">Be kind. No answers to graded exercises before the deadline. Memes are welcome, spam is not.</p>
      </aside>
    </div>
  );
}
