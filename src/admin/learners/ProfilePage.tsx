import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { BarometerFace, type ZoneId } from "@/learner/today/BarometerFace";
import { nicknames } from "@/learner/lib/name";
import { useAdminHeader } from "../shell/AdminShell";
import { wellbeingApi } from "../wellbeing";
import { statusSolid } from "../ui/status";
import { zoneLabel } from "../ui/zones";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Bangkok" });

export function ProfilePage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const q = useQuery(["admin-overview", id], () => wellbeingApi.overview(id), { enabled: !!id });
  const [note, setNote] = useState("");
  const [step, setStep] = useState("");
  const busy = useRef(false);
  const o = q.data;
  const n = nicknames(o?.learner.zoom_name, o?.learner.first_name ?? "");
  useAdminHeader({ title: "Learner", context: o ? `${n.th || n.en} · #${o.learner.jsd_number}` : "" });
  const refresh = () => {
    qc.invalidateQueries(["admin-overview", id]);
    qc.invalidateQueries(["admin-support"]);
    qc.invalidateQueries(["admin-learners"]);
  };
  const once = async (f: () => Promise<unknown>, after?: () => void) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await f();
      after?.();
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      busy.current = false;
    }
  };
  if (q.isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-l-sub" />;
  if (!o) return <p className="text-sm text-l-ink3">Learner not found.</p>;
  const kpis = [
    ["Attendance", `${(o.attendance_rate * 100).toFixed(1)}%`, ""],
    ["Leave", `${o.leave_used} / 8`, o.leave_used >= 7 ? "text-red-600" : o.leave_used >= 6 ? "text-amber-600" : ""],
    ["Streak", String(o.streak), ""],
  ];
  return (
    <div>
      <Link to="/admin/learners" className="inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-small font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
        <ChevronLeft className="h-3.5 w-3.5" /> All learners
      </Link>
      <section className="mt-3.5 flex flex-wrap items-center gap-5 rounded-[20px] bg-gradient-to-b from-l-sub to-l-card p-5 shadow-[0_0_0_1px_var(--l-hair)]">
        <UserAvatar userId={o.learner.id} name={n.en} avatar={o.learner.avatar} className="h-[72px] w-[72px]" />
        <div className="min-w-[220px] flex-1">
          <h2 className="text-[22px] font-semibold tracking-tight">{n.th ? `${n.th} · ${o.learner.first_name} ${o.learner.last_name?.slice(0, 1) ?? ""}.` : o.learner.first_name}</h2>
          <p className="mt-0.5 text-small text-l-ink3">
            #{o.learner.jsd_number} · Group {o.learner.genmate_group || "–"} · {o.learner.email} · joined {when(o.learner.created_at)}
          </p>
          {o.reasons.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {o.reasons.map((r) => (
                <span key={r.key} className="inline-flex items-center gap-1.5 rounded-full bg-red-50 py-0.5 pl-2.5 pr-1 text-small font-semibold text-red-600 dark:bg-red-500/15">
                  {r.text}
                  {r.key !== "plan" ? (
                    <button type="button" aria-label={`Acknowledge ${r.text}`} title="Acknowledge for 7 days" onClick={() => once(() => wellbeingApi.ack(o.learner.id, r.key, r.text))} className="rounded-full bg-white/70 px-1.5 text-micro text-red-700 dark:bg-white/15 dark:text-red-200">
                      OK
                    </button>
                  ) : (
                    <span className="pr-1.5" />
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-6 border-l border-l-hair pl-5">
          {kpis.map(([k, v, c]) => (
            <div key={k}>
              <small className="text-small text-l-ink3">{k}</small>
              <b className={`block text-[22px] font-bold tabular-nums tracking-tight ${c}`}>{v}</b>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-2">
        <section className="rounded-2xl p-4 shadow-[0_0_0_1px_var(--l-hair)]">
          <h4 className="text-body font-semibold">Last 4 weeks</h4>
          <div className="mt-2.5 grid grid-cols-5 gap-1">
            {o.last20.map((d) => (
              <span key={d.date} title={`${d.date}: ${d.morning || "–"} / ${d.afternoon || "–"}`} className="grid h-[34px] grid-rows-2 gap-0.5">
                <i className={`block rounded ${statusSolid(d.morning)}`} />
                <i className={`block rounded ${statusSolid(d.afternoon)}`} />
              </span>
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-3 text-small text-l-ink2">
            {[["bg-emerald-400", "On time"], ["bg-amber-400", "Late"], ["bg-red-400", "Absent"], ["bg-indigo-400", "Excused"]].map(([c, t]) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <i className={`block h-2.5 w-2.5 rounded-[3px] ${c}`} />
                {t}
              </span>
            ))}
          </div>
        </section>
        <section className="rounded-2xl p-4 shadow-[0_0_0_1px_var(--l-hair)]">
          <h4 className="text-body font-semibold">Mood · last 10 nights</h4>
          <div className="mt-2.5 flex gap-1">
            {o.nights.map((x) => (
              <span key={x.day} title={`${x.day}: ${zoneLabel(x.zone)}`} className="flex flex-1 flex-col items-center gap-1 text-micro text-l-ink3">
                {x.zone ? <BarometerFace zone={x.zone as ZoneId} size={24} /> : <i className="block h-6 w-6 rounded-full shadow-[inset_0_0_0_1.5px_var(--l-hair)]" />}
                {new Date(`${x.day}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "narrow", timeZone: "Asia/Bangkok" })}
              </span>
            ))}
          </div>
          {o.latest_quote && (
            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-l-sub px-3.5 py-3 text-body leading-relaxed">
              “{o.latest_quote.text.trim().split("\n").filter(Boolean)[0]}”
              <small className="mt-1 block text-small text-l-ink3">
                {when(o.latest_quote.day)} · {zoneLabel(o.latest_quote.zone)}
              </small>
            </p>
          )}
        </section>
        <section className="rounded-2xl p-4 shadow-[0_0_0_1px_var(--l-hair)]">
          <h4 className="text-body font-semibold">TA notes</h4>
          {o.notes.length === 0 && <p className="mt-2 text-small text-l-ink3">No notes yet.</p>}
          {o.notes.map((x) => (
            <div key={x.id} className="border-b border-l-hair py-2.5 text-body leading-relaxed last:border-0">
              <small className="block text-small text-l-ink3">
                {x.author_name} · {when(x.created_at)}
              </small>
              <span className="whitespace-pre-wrap">{x.text}</span>
            </div>
          ))}
          <textarea aria-label="New note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a private note…" className="mt-2 h-[70px] w-full resize-none rounded-xl bg-l-sub px-3 py-2.5 text-body text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]" />
          <button type="button" disabled={!note.trim()} onClick={() => once(() => wellbeingApi.addNote(o.learner.id, note.trim()), () => setNote(""))} className="mt-2 rounded-full bg-l-ink px-4 py-1.5 text-small font-semibold text-l-card disabled:opacity-40">
            Add note
          </button>
        </section>
        <section className="rounded-2xl p-4 shadow-[0_0_0_1px_var(--l-hair)]">
          <h4 className="text-body font-semibold">Support plan</h4>
          {o.support.length === 0 && <p className="mt-2 text-small text-l-ink3">No steps yet.</p>}
          {o.support.map((s) => (
            <div key={s.id} className="group flex items-center gap-2.5 border-b border-l-hair py-2.5 text-body last:border-0">
              <input type="checkbox" aria-label={s.text} checked={s.done} onChange={() => once(() => wellbeingApi.setStep(s.id, !s.done))} className="h-4 w-4 accent-zinc-900" />
              <span className={s.done ? "text-l-ink3 line-through" : ""}>{s.text}</span>
              <small className="ml-auto text-small text-l-ink3">{s.done && s.done_at ? `done ${when(s.done_at)}` : s.author_name}</small>
              <button type="button" aria-label={`Delete ${s.text}`} onClick={() => once(() => wellbeingApi.deleteStep(s.id))} className="text-l-ink3 opacity-0 transition-opacity hover:text-red-600 focus:opacity-100 group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="mt-2 flex gap-2">
            <input aria-label="New step" value={step} onChange={(e) => setStep(e.target.value)} placeholder="Add a step…" maxLength={200} className="flex-1 rounded-xl bg-l-sub px-3 py-2 text-body text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none" />
            <button type="button" disabled={!step.trim()} onClick={() => once(() => wellbeingApi.addStep(o.learner.id, step.trim()), () => setStep(""))} className="rounded-full px-4 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)] disabled:opacity-40">
              Add
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
