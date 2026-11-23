import { useRef, useState, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "react-toastify";
import { UserAvatar } from "@/components/user-avatar";
import { decodeHtmlEntities, type BoardComment } from "@/lib/board";
import { nicknames } from "../lib/name";

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
};

/** Oldest first, so a thread reads top to bottom. */
export const byTime = (list: BoardComment[] = []) => [...list].sort((a, b) => (a.createdAt > b.createdAt ? 1 : a.createdAt < b.createdAt ? -1 : 0));

function Reply({ c, avatar, clamp, extra }: { c: BoardComment; avatar?: ReactNode; clamp?: boolean; extra?: ReactNode }) {
  const n = nicknames(c.zoomName ?? "", c.zoomName ?? "");
  return (
    <div className="flex items-start gap-2.5">
      {avatar ?? <UserAvatar userId={c.userId} name={n.en} className="h-7 w-7" />}
      <div className="min-w-0 flex-1 rounded-xl bg-l-sub px-3 py-2 text-left">
        <div className="flex items-baseline gap-2">
          <b className="text-small font-semibold">{n.th || n.en}</b>
          <small className="text-micro text-l-ink3">{ago(c.createdAt)}</small>
        </div>
        <p className={`whitespace-pre-wrap break-words text-body leading-relaxed ${clamp ? "line-clamp-2" : ""}`}>{decodeHtmlEntities(c.content ?? "")}</p>
      </div>
      {extra}
    </div>
  );
}

/**
 * Replies live inside the post card: closed, it shows the latest reply; open, the whole thread
 * and (when onSend is given) a reply box. No trip to a separate page.
 */
export function PostThread({
  comments,
  open,
  onToggle,
  onSend,
  me,
  avatarFor,
  actionsFor,
}: {
  comments: BoardComment[];
  open: boolean;
  onToggle: () => void;
  onSend?: (content: string) => Promise<void>;
  me?: ReactNode;
  avatarFor?: (c: BoardComment) => ReactNode;
  actionsFor?: (c: BoardComment) => ReactNode;
}) {
  const thread = byTime(comments);
  const latest = thread[thread.length - 1];
  return (
    <div className="mt-3">
      <button type="button" aria-expanded={open} onClick={onToggle} className="inline-flex items-center gap-1 text-small text-l-ink3 hover:text-l-ink">
        <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
        {thread.length ? `${open ? "Hide" : thread.length > 1 ? `View all ${thread.length}` : "1"} ${thread.length === 1 && !open ? "reply" : "replies"}` : open ? "Hide" : onSend ? "Write a reply" : "No replies yet"}
      </button>
      {!open && latest && (
        <button type="button" onClick={onToggle} aria-label="Show replies" className="mt-2 block w-full">
          <Reply c={latest} avatar={avatarFor?.(latest)} clamp />
        </button>
      )}
      {open && (
        <ul className="mt-2 flex flex-col gap-2 border-t border-l-hair pt-3">
          {thread.map((c) => (
            <li key={c.id}>
              <Reply c={c} avatar={avatarFor?.(c)} extra={actionsFor?.(c)} />
            </li>
          ))}
          {onSend && (
            <li>
              <ReplyBox avatar={me} onSend={onSend} />
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Sends once per click; keeps the text if sending fails. Ctrl/Cmd+Enter sends. */
export function ReplyBox({ avatar, onSend }: { avatar?: ReactNode; onSend: (content: string) => Promise<void> }) {
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
      toast.error(e instanceof Error ? e.message : "Couldn't send your reply");
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
