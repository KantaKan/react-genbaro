import { useRef, useState } from "react";
import { Lock, X } from "lucide-react";
import { toast } from "react-toastify";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/user-avatar";
import { userService } from "@/application/services/userService";
import { nicknames } from "../lib/name";
import type { Person } from "../lib/people";
import { usePeople, safeUrl } from "../lib/usePeople";
import { useChampion } from "../cup/useChampion";
import { Medal } from "../today/Medal";

const QUICK = ["Great pair partner", "Always helps", "Clean code"];

/** Public profile of a classmate: never attendance, leave, streak or reflections. */
export function ClassmatePanel({ person, isMe, onClose, onEditAvatar }: { person: Person | null; isMe: boolean; onClose: () => void; onEditAvatar: () => void }) {
  const [text, setText] = useState("");
  const sending = useRef(false);
  if (!person) return null;
  const n = nicknames(person.zoom_name, person.first_name);
  const send = async () => {
    if (sending.current || !text.trim()) return;
    sending.current = true;
    try {
      await userService.addProfileComment(person._id, { content: text.trim() });
      toast.success(`Recommendation sent to ${n.th || n.en}`);
      setText("");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send");
    } finally {
      sending.current = false;
    }
  };
  const recs = (person.profile_comments ?? []).filter((c) => !c.parentId).slice(0, 3);
  const raw = person.social_links ?? {};
  const links = { github: safeUrl(raw.github), linkedin: safeUrl(raw.linkedin), instagram: safeUrl(raw.instagram) };
  const { byId } = usePeople();
  const { isChampion } = useChampion();
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="learner flex w-full flex-col gap-0 border-l-0 bg-l-card p-0 text-l-ink sm:max-w-[440px] [&>button]:hidden">
        <div className="flex-1 overflow-y-auto px-[22px] pb-[22px]">
          <div className="relative -mx-[22px] h-[110px] bg-gradient-to-br from-indigo-100 via-pink-50 to-emerald-100 dark:from-indigo-500/20 dark:via-pink-500/10 dark:to-emerald-500/20">
            <button type="button" aria-label="Close" onClick={onClose} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-zinc-900 backdrop-blur">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative z-[1] -mt-[38px] flex items-end gap-3.5">
            <span className="rounded-full shadow-[0_0_0_4px_var(--l-card)]">
              <UserAvatar userId={person._id} name={n.en} avatar={person.avatar} champion={isChampion(person.genmate_group)} className="h-[84px] w-[84px]" />
            </span>
            <div className="pb-1">
              <SheetTitle className="text-[21px] font-semibold text-l-ink">{n.th ? `${n.th} · ${n.en}` : n.en}</SheetTitle>
              <span className="text-[13px] text-l-ink2">
                {person.first_name} · #{person.jsd_number ?? "–"} · Group {person.genmate_group ?? "–"}
              </span>
            </div>
          </div>
          {isMe && (
            <button type="button" onClick={onEditAvatar} className="mt-3.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium shadow-[0_0_0_1px_var(--l-hair)]">
              Customize avatar
            </button>
          )}
          {person.bio && <p className="mt-3.5 leading-relaxed text-l-ink2">{person.bio}</p>}
          {!!person.skills?.length && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {person.skills.map((s) => (
                <span key={s} className="rounded-lg bg-l-sub px-2 py-0.5 text-[11.5px] font-medium text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
                  {s}
                </span>
              ))}
            </div>
          )}
          {(links.github || links.linkedin || links.instagram) && (
            <div className="mt-3.5 flex gap-1.5">
              {(["github", "linkedin", "instagram"] as const).map((k) =>
                links[k] ? (
                  <a key={k} href={links[k]} target="_blank" rel="noreferrer" className="rounded-[10px] px-2.5 py-1.5 text-[12.5px] font-medium capitalize shadow-[0_0_0_1px_var(--l-hair)]">
                    {k === "github" ? "GitHub" : k === "linkedin" ? "LinkedIn" : "Instagram"}
                  </a>
                ) : null
              )}
            </div>
          )}
          <h4 className="mb-2.5 mt-[22px] text-[12px] font-semibold uppercase tracking-[.08em] text-l-ink3">Badges{person.badges?.length ? ` · ${person.badges.length}` : ""}</h4>
          {person.badges?.length ? (
            <div className="flex flex-wrap gap-2.5">
              {person.badges.slice(0, 6).map((b) => (
                <Medal key={b._id ?? b.name} name={b.name} color={b.color || "#6366f1"} glyph={b.name.slice(0, 1).toUpperCase()} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-l-ink3">No badges yet.</p>
          )}
          <h4 className="mb-1 mt-[22px] text-[12px] font-semibold uppercase tracking-[.08em] text-l-ink3">Recommendations · {person.profile_comments?.length ?? 0}</h4>
          {recs.length === 0 && <p className="text-[13px] text-l-ink3">No recommendations yet.</p>}
          {recs.map((c) => (
            <div key={c.id ?? c._id} className="flex gap-2.5 border-t border-l-hair py-2.5 first:border-t-0">
              <UserAvatar userId={c.userId} name={c.zoomName} avatar={byId.get(c.userId)?.avatar} className="h-[30px] w-[30px]" />
              <div>
                <q className="block text-[13px] leading-relaxed">{c.content}</q>
                <small className="text-[11.5px] text-l-ink3">{nicknames(c.zoomName, c.zoomName).th || nicknames(c.zoomName, c.zoomName).en}</small>
              </div>
            </div>
          ))}
          {!isMe && (
            <div className="mt-3 rounded-2xl p-3 shadow-[0_0_0_1px_var(--l-hair)] focus-within:shadow-[0_0_0_1.5px_var(--l-ink)]">
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={`What's great about working with ${n.en}?`} className="h-[60px] w-full resize-none bg-transparent text-[13.5px] outline-none" />
              <div className="flex flex-wrap items-center gap-1.5">
                {QUICK.map((qq) => (
                  <button key={qq} type="button" onClick={() => setText((t) => `${t ? `${t} ` : ""}${qq}.`)} className="rounded-full bg-l-sub px-2.5 py-1 text-[12px] shadow-[0_0_0_1px_var(--l-hair)]">
                    {qq}
                  </button>
                ))}
                <span className="flex-1" />
                <button type="button" onClick={send} className="rounded-full bg-l-ink px-3.5 py-1.5 text-[13px] font-medium text-l-card">
                  Recommend
                </button>
              </div>
            </div>
          )}
          <div className="mt-[22px] flex items-start gap-2.5 rounded-[14px] bg-l-sub px-3.5 py-3 text-[12.5px] leading-relaxed text-l-ink2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>{isMe ? "This is what classmates see. Attendance, leave and reflections are private: only you and TAs can see them." : `Attendance, leave and reflections are private. Only ${n.en} and TAs can see them.`}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
