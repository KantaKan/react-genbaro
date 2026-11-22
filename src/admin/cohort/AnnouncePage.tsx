import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { notificationService } from "@/application/services/notificationService";
import type { CreateNotificationRequest } from "@/domain/types/notification";
import { nicknames } from "@/learner/lib/name";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { wellbeingApi } from "../wellbeing";
import { useConfirm } from "../ui/Confirm";

type Audience = "everyone" | "groups" | "people";
const field = "w-full rounded-xl bg-l-sub px-3 py-2.5 text-[13.5px] text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]";
const seg = (on: boolean) => `rounded-[7px] px-3 py-1 text-xs font-semibold ${on ? "bg-l-ink text-l-card" : "text-l-ink2"}`;

export function AnnouncePage() {
  const [cohort] = useCohort();
  const qc = useQueryClient();
  const learners = useQuery(["admin-learners", cohort], () => wellbeingApi.learners(cohort));
  const sent = useQuery(["admin-announcements"], () => notificationService.getAllNotifications());
  const active = useMemo(() => (learners.data ?? []).filter((l) => l.attendance_status !== "dropout" && l.attendance_status !== "dismissed"), [learners.data]);
  const groups = useMemo(() => [...new Set(active.map((l) => l.genmate_group).filter(Boolean))].sort(), [active]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [aud, setAud] = useState<Audience>("everyone");
  const [pickedGroups, setPickedGroups] = useState<Set<string>>(new Set());
  const [pickedPeople, setPickedPeople] = useState<Set<string>>(new Set());
  const [when, setWhen] = useState("");
  const [days, setDays] = useState(7);
  const busy = useRef(false);
  const confirm = useConfirm();
  useAdminHeader({ title: "Announcements", context: "Shown as a banner to learners" });

  // Always send explicit ids: an empty list would reach every cohort, not just this one.
  const recipients = aud === "everyone" ? active.map((l) => l.id) : aud === "groups" ? active.filter((l) => pickedGroups.has(l.genmate_group)).map((l) => l.id) : active.filter((l) => pickedPeople.has(l.id)).map((l) => l.id);
  const count = recipients.length;
  const ok = title.trim() && message.trim() && count > 0;
  const toggle = (set: Set<string>, v: string, f: (s: Set<string>) => void) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    f(n);
  };
  const send = () =>
    confirm.ask(`Send “${title.trim()}” to ${count} learner${count === 1 ? "" : "s"}?`, async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const start = when ? new Date(when) : new Date();
        const end = new Date(start.getTime() + days * 86400e3);
        const body: CreateNotificationRequest & { recipient_ids: string[] } = {
          title: title.trim(),
          message: message.trim(),
          is_active: true,
          priority: "important",
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          recipient_ids: recipients,
        };
        await notificationService.createNotification(body);
        toast.success("Announcement sent");
        setTitle("");
        setMessage("");
        qc.invalidateQueries(["admin-announcements"]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't send");
      } finally {
        busy.current = false;
      }
    });
  const list = [...(sent.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    <div>
      <div className="grid gap-3.5 xl:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl p-5 shadow-[0_0_0_1px_var(--l-hair)]">
          <h4 className="text-[13px] font-semibold">New announcement</h4>
          <label className="mt-3 block text-xs font-semibold text-l-ink2">
            Title
            <input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={`${field} mt-1.5 font-semibold`} />
          </label>
          <label className="mt-3 block text-xs font-semibold text-l-ink2">
            Message
            <textarea aria-label="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className={`${field} mt-1.5 resize-none font-normal`} />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span className="w-16 text-xs text-l-ink3">Send to</span>
            <div className="inline-flex rounded-[10px] bg-l-card p-[3px] shadow-[0_0_0_1px_var(--l-hair)]">
              {([["everyone", "Everyone"], ["groups", "Groups"], ["people", "People"]] as const).map(([k, t]) => (
                <button key={k} type="button" aria-pressed={aud === k} onClick={() => setAud(k)} className={seg(aud === k)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {aud === "groups" && (
            <div className="mt-2.5 flex flex-wrap gap-2 pl-[74px]">
              {groups.map((g) => (
                <label key={g} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
                  <input type="checkbox" aria-label={`Group ${g}`} checked={pickedGroups.has(g)} onChange={() => toggle(pickedGroups, g, setPickedGroups)} className="accent-zinc-900" />
                  {g}
                </label>
              ))}
            </div>
          )}
          {aud === "people" && (
            <div className="mt-2.5 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pl-[74px]">
              {active.map((l) => {
                const n = nicknames(l.zoom_name, l.first_name);
                return (
                  <label key={l.id} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs shadow-[0_0_0_1px_var(--l-hair)]">
                    <input type="checkbox" aria-label={n.th || n.en} checked={pickedPeople.has(l.id)} onChange={() => toggle(pickedPeople, l.id, setPickedPeople)} className="accent-zinc-900" />
                    {n.th || n.en}
                  </label>
                );
              })}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span className="w-16 text-xs text-l-ink3">When</span>
            <input aria-label="Start time" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="rounded-xl bg-l-sub px-3 py-1.5 text-[13px] text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
            <span className="text-xs text-l-ink3">{when ? "" : "Now ·"} shows for</span>
            <input aria-label="Days" type="number" min={1} max={60} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} className="w-14 rounded-lg bg-l-sub px-2 py-1.5 text-[13px] shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
            <span className="text-xs text-l-ink3">days</span>
            <span className="flex-1" />
            <button type="button" disabled={!ok} onClick={send} className="rounded-full bg-l-ink px-4 py-2 text-[13px] font-semibold text-l-card disabled:opacity-40">
              Send to {count} learner{count === 1 ? "" : "s"}
            </button>
          </div>
        </section>
        <section className="rounded-2xl p-5 shadow-[0_0_0_1px_var(--l-hair)]">
          <h4 className="text-[13px] font-semibold">Preview on a learner's Today</h4>
          <div className="mt-3 flex items-start gap-3 rounded-2xl bg-gradient-to-b from-indigo-50 to-l-card p-3.5 shadow-[0_0_0_1px_var(--l-hair)] dark:from-indigo-500/15">
            <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-l-card shadow-[0_0_0_1px_var(--l-hair)]">
              <Megaphone className="h-4 w-4" strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <b className="text-sm">{title || "Your title"}</b>
              <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-l-ink2">{message || "Your message shows here."}</p>
              <small className="text-[11.5px] text-l-ink3">Banner on every page until they close it</small>
            </div>
          </div>
        </section>
      </div>
      <h3 className="mb-2.5 mt-6 text-[15px] font-semibold">Sent</h3>
      <section className="rounded-2xl px-4 py-1 shadow-[0_0_0_1px_var(--l-hair)]">
        {list.length === 0 && <p className="py-4 text-[12.5px] text-l-ink3">Nothing sent yet.</p>}
        {list.map((n) => {
          const seen = ((n as unknown as { read_by_users?: string[] }).read_by_users ?? []).length;
          const live = n.is_active && new Date(n.end_date) > new Date();
          return (
            <div key={n.id} className="grid grid-cols-[minmax(0,1.4fr)_90px_110px_auto] items-center gap-3 border-b border-l-hair py-3 text-[13px] last:border-0">
              <b className="truncate font-semibold">{n.title}</b>
              <span className="tabular-nums text-l-ink2">{`${seen} seen`}</span>
              <span className="text-xs text-l-ink3">{new Date(n.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" })}</span>
              {live ? (
                <button
                  type="button"
                  aria-label={`Stop ${n.title}`}
                  onClick={async () => {
                    await notificationService.toggleNotificationActive(n.id, false);
                    qc.invalidateQueries(["admin-announcements"]);
                  }}
                  className="rounded-full px-3 py-1 text-xs font-semibold shadow-[0_0_0_1px_var(--l-hair)]"
                >
                  Stop
                </button>
              ) : (
                <span className="text-xs text-l-ink3">Ended</span>
              )}
            </div>
          );
        })}
      </section>
      {confirm.node}
    </div>
  );
}
