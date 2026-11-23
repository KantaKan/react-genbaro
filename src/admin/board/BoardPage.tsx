import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { MessageCircle, Trash2 } from "lucide-react";
import { useUserData } from "@/UserDataContext";
import { boardService } from "@/application/services/boardService";
import { UserAvatar } from "@/components/user-avatar";
import { BOARD_REACTIONS, decodeHtmlEntities, type BoardPost } from "@/lib/board";
import { nicknames } from "@/learner/lib/name";
import { rankPosts } from "@/learner/board/BoardPage";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { useConfirm } from "../ui/Confirm";
import { useStaff } from "../team/useStaff";

const card = "rounded-2xl bg-l-card p-5 shadow-[0_0_0_1px_var(--l-hair)]";
const errMsg = (e: unknown) => (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? (e instanceof Error ? e.message : "Something went wrong");
const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
};
const display = (zoomName: string) => {
  const n = nicknames(zoomName, zoomName);
  return { th: n.th || n.en, en: n.en };
};

/** The cohort's Talk Board, for staff: read, post, and moderate. */
export function AdminBoardPage() {
  const [cohort] = useCohort();
  const { userData } = useUserData();
  const me = useStaff();
  // only once /admin/me has answered: useStaff assumes Owner until then
  const canModerate = me.known && me.can("care");
  const qc = useQueryClient();
  const confirm = useConfirm();
  const q = useQuery(["admin-board", cohort], () => boardService.getCohortPosts(cohort), { staleTime: 30_000 });
  const [mode, setMode] = useState<"latest" | "popular">("latest");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [text, setText] = useState("");
  const posting = useRef(false);
  const deleting = useRef(false);

  const tabs = useMemo(
    () => (
      <div className="inline-flex rounded-[10px] bg-l-sub p-[3px]">
        {(["latest", "popular"] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`rounded-lg px-3 py-1 text-small font-semibold ${mode === m ? "bg-l-card text-l-ink shadow-sm" : "text-l-ink2"}`}>
            {m === "latest" ? "Latest" : "Popular"}
          </button>
        ))}
      </div>
    ),
    [mode]
  );
  useAdminHeader({ title: "Talk Board", context: `JSD${cohort}`, actions: tabs });
  const refresh = () => qc.invalidateQueries(["admin-board"]);

  const post = async () => {
    const content = text.trim();
    if (!content || posting.current || !userData) return;
    posting.current = true;
    try {
      await boardService.createPost({ content, zoomName: userData.zoom_name ?? userData.first_name, cohort });
      setText("");
      refresh();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      posting.current = false;
    }
  };

  const remove = (title: string, run: () => Promise<void>, body: string) =>
    confirm.ask(
      title,
      async () => {
        if (deleting.current) return;
        deleting.current = true;
        try {
          await run();
          toast.success("Removed");
          refresh();
        } catch (e) {
          toast.error(errMsg(e));
        } finally {
          deleting.current = false;
        }
      },
      body
    );

  const posts: BoardPost[] = rankPosts(q.data ?? [], mode);
  const myName = display(userData?.zoom_name ?? userData?.first_name ?? "");

  return (
    <div className="flex max-w-[760px] flex-col gap-3.5">
      {canModerate && (
        <section className={card}>
          <div className="flex items-start gap-3">
            <UserAvatar userId={userData?._id} name={myName.en} className="h-9 w-9" />
            <textarea
              aria-label={`Post to JSD${cohort}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Write to JSD${cohort} as ${userData?.first_name ?? "staff"}…`}
              className="h-[46px] flex-1 resize-none rounded-[14px] bg-l-sub px-3.5 py-3 text-body shadow-[0_0_0_1px_var(--l-hair)] outline-none transition-[height] duration-300 focus:h-24 focus:bg-l-card focus:shadow-[0_0_0_1.5px_var(--l-ink)]"
            />
          </div>
          <div className="mt-2.5 flex justify-end">
            <button type="button" onClick={post} disabled={!text.trim()} className="rounded-full bg-l-ink px-4 py-1.5 text-body font-semibold text-l-card disabled:opacity-40">
              Post
            </button>
          </div>
        </section>
      )}

      {q.isLoading && <div className="h-40 animate-pulse rounded-2xl bg-l-sub" />}
      {q.isError && <p className="text-sm text-l-ink3">Couldn't load the board. Try again in a moment.</p>}
      {q.data && posts.length === 0 && <div className={`${card} text-center text-body text-l-ink3`}>No posts in JSD{cohort} yet.</div>}

      {posts.map((p) => {
        const who = display(p.zoomName);
        const replies = p.comments ?? [];
        const counts = BOARD_REACTIONS.map((r) => ({ ...r, n: (p.reactions ?? []).filter((x) => x.value === r.name).length })).filter((r) => r.n > 0);
        const isOpen = !!open[p.id];
        return (
          <article key={p.id} className={card}>
            <div className="flex items-center gap-2.5">
              <UserAvatar userId={p.userId} name={who.en} className="h-9 w-9" />
              <div className="min-w-0 flex-1">
                <b className="text-title font-semibold">{who.th}</b>
                {who.en && who.en !== who.th && <span className="ml-1.5 text-xs text-l-ink3">{who.en}</span>}
                <small className="block text-xs text-l-ink3">{ago(p.createdAt)}</small>
              </div>
              {canModerate && (
                <button
                  type="button"
                  aria-label={`Delete post by ${who.th}`}
                  onClick={() => remove(`Delete this post by ${who.th}?`, () => boardService.deletePost(p.id), "The post and all its replies are removed for everyone.")}
                  className="grid h-8 w-8 place-items-center rounded-lg text-l-ink3 hover:bg-l-sub hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                </button>
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-title leading-relaxed">{decodeHtmlEntities(p.content)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {counts.map((r) => (
                <span key={r.name} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-small tabular-nums shadow-[0_0_0_1px_var(--l-hair)]">
                  <img src={r.url} alt={r.name} className="h-4 w-4" />
                  {r.n}
                </span>
              ))}
              <span className="flex-1" />
              {replies.length > 0 ? (
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [p.id]: !isOpen }))} className="inline-flex items-center gap-1 text-small text-l-ink3 hover:text-l-ink">
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </button>
              ) : canModerate ? (
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [p.id]: !isOpen }))} className="inline-flex items-center gap-1 text-small text-l-ink3 hover:text-l-ink">
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Write a reply
                </button>
              ) : (
                <span className="text-small text-l-ink3">No replies</span>
              )}
            </div>
            {isOpen && (
              <ul className="mt-3 flex flex-col gap-2 border-t border-l-hair pt-3">
                {replies.map((c) => {
                  const cw = display(c.zoomName);
                  return (
                    <li key={c.id} className="flex items-start gap-2.5">
                      <UserAvatar userId={c.userId} name={cw.en} className="h-7 w-7" />
                      <div className="min-w-0 flex-1 rounded-xl bg-l-sub px-3 py-2">
                        <div className="flex items-baseline gap-2">
                          <b className="text-small font-semibold">{cw.th}</b>
                          <small className="text-micro text-l-ink3">{ago(c.createdAt)}</small>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-body leading-relaxed">{decodeHtmlEntities(c.content)}</p>
                      </div>
                      {canModerate && (
                        <button
                          type="button"
                          aria-label={`Delete reply by ${cw.th}`}
                          onClick={() => remove(`Delete this reply by ${cw.th}?`, () => boardService.deleteComment(p.id, c.id), "It's removed for everyone.")}
                          className="mt-1 grid h-7 w-7 place-items-center rounded-lg text-l-ink3 hover:bg-l-sub hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                        </button>
                      )}
                    </li>
                  );
                })}
                {canModerate && userData && (
                  <li>
                    <ReplyBox
                      avatar={<UserAvatar userId={userData._id} name={myName.en} className="h-7 w-7" />}
                      onSend={async (content) => {
                        await boardService.createComment({ postId: p.id, content, zoomName: userData.zoom_name ?? userData.first_name });
                        refresh();
                      }}
                    />
                  </li>
                )}
              </ul>
            )}
          </article>
        );
      })}
      {confirm.node}
    </div>
  );
}

/** Staff reply under a post. Sends once per click; keeps the text if sending fails. */
function ReplyBox({ avatar, onSend }: { avatar: React.ReactNode; onSend: (content: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const sending = useRef(false);
  const send = async () => {
    const content = text.trim();
    if (!content || sending.current) return;
    sending.current = true;
    try {
      await onSend(content);
      setText("");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      sending.current = false;
    }
  };
  return (
    <div className="flex items-start gap-2.5">
      {avatar}
      <textarea
        aria-label="Reply to this post"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        }}
        placeholder="Write a reply…"
        rows={1}
        className="min-h-[38px] flex-1 resize-none rounded-xl bg-l-sub px-3 py-2 text-body shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:bg-l-card focus:shadow-[0_0_0_1.5px_var(--l-ink)]"
      />
      <button type="button" onClick={send} disabled={!text.trim()} className="mt-0.5 rounded-full bg-l-ink px-3.5 py-1.5 text-small font-semibold text-l-card disabled:opacity-40">
        Reply
      </button>
    </div>
  );
}
