import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { nicknames } from "@/learner/lib/name";
import { useAdminHeader } from "../shell/AdminShell";
import { wellbeingApi } from "../wellbeing";
import { Bone, LoadingHint } from "@/components/LoadingSkeleton";
import { KpiBoxes } from "./profile/KpiBoxes";
import { BadgeTiles } from "./profile/BadgeTiles";
import { AwardCareEnergyButton } from "@/components/award-care-energy-button";
import { AdminCosmeticGrantDialog } from "@/components/admin-cosmetic-grant-dialog";
import { AdminGiftBoxDialog } from "@/components/admin-gift-box-dialog";
import { AdminCharacterDialog } from "@/components/character/AdminCharacterDialog";
import { AdminPlantOverrideButton } from "@/components/admin-plant-override-button";
import { ResetPasswordButton } from "./profile/ResetPasswordButton";
import { CourseStrip } from "./profile/CourseStrip";
import { DayList, type Filter } from "./profile/DayList";
import { isUnreplied, mondayOf, reflectionsOpen, weeksOf } from "./profile/days";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Bangkok" });

export function ProfilePage() {
  const { id = "" } = useParams();
  return <LearnerProfile key={id} id={id} />;
}

function LearnerProfile({ id }: { id: string }) {
  const qc = useQueryClient();
  const q = useQuery(["admin-overview", id], () => wellbeingApi.overview(id), { enabled: !!id });
  const [note, setNote] = useState("");
  const [step, setStep] = useState("");
  const busy = useRef(false);
  const o = q.data;
  const n = nicknames(o?.learner.zoom_name, o?.learner.first_name ?? "");
  useAdminHeader({ title: "Learner", context: o ? `${n.th || n.en} · #${o.learner.jsd_number}` : "" });
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(new Set());
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const reflOpen = reflectionsOpen();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const pick = (date: string) => {
    setFilter("all");
    setQuery("");
    setOpenWeeks((s) => new Set(s).add(mondayOf(date)));
    requestAnimationFrame(() => document.getElementById(`day-${date}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };
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
  if (q.isLoading) return <ProfileSkeleton />;
  if (q.isError) return <p className="text-sm text-red-600">Couldn't load this learner. Refresh to try again.</p>;
  if (!o) return <p className="text-sm text-l-ink3">Learner not found.</p>;
  const nb = o.neighbors;
  const fullName = `${o.learner.first_name} ${o.learner.last_name ?? ""}`.trim();
  const who = { id: o.learner.id, first_name: o.learner.first_name, zoom_name: o.learner.zoom_name };
  const days = o.days ?? [];
  const unreplied = days.filter(isUnreplied).length;
  const replyNext = () => {
    const d = weeksOf(days).flatMap((w) => w.days).find(isUnreplied);
    if (d) pick(d.date);
  };
  const navBtn = "grid h-8 w-8 place-items-center rounded-[10px] text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)] hover:text-l-ink";
  return (
    <div>
      <div className="flex items-center gap-2">
        <Link to="/admin/learners" className="inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-small font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
          <ChevronLeft className="h-3.5 w-3.5" /> All learners
        </Link>
        {nb && nb.total > 0 && (
          <>
            <span className="ml-auto text-small tabular-nums text-l-ink3">{`${nb.index + 1} of ${nb.total}`}</span>
            {nb.prev ? (
              <Link to={`/admin/learners/${nb.prev}`} aria-label="Previous learner" title="Previous learner" className={navBtn}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : null}
            {nb.next ? (
              <Link to={`/admin/learners/${nb.next}`} aria-label="Next learner" title="Next learner" className={navBtn}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
          </>
        )}
      </div>
      <section className="mt-3.5 flex flex-wrap items-center gap-5 rounded-[20px] bg-gradient-to-b from-l-sub to-l-card p-5 shadow-[0_0_0_1px_var(--l-hair)]">
        <UserAvatar userId={o.learner.id} name={n.en} avatar={o.learner.avatar} className="h-[72px] w-[72px]" />
        <div className="min-w-[220px] flex-1">
          <h2 className="text-[22px] font-semibold tracking-tight">{n.th ? `${n.th} · ${o.learner.first_name} ${o.learner.last_name?.slice(0, 1) ?? ""}.` : o.learner.first_name}</h2>
          <p className="mt-0.5 text-small text-l-ink3">
            #{o.learner.jsd_number} · Group {o.learner.genmate_group || "–"} · JSD{o.learner.cohort_number} · joined {when(o.learner.created_at)}
          </p>
          <p className="text-small text-l-ink3">{o.learner.email}</p>
          <BadgeTiles badges={o.badges ?? []} userId={o.learner.id} />
        </div>
        <KpiBoxes o={o} today={today} open={reflOpen} />
        <div className="flex w-full flex-wrap gap-2 border-t border-l-hair pt-4">
          <AwardCareEnergyButton userId={o.learner.id} onCareEnergyAwarded={refresh} />
          <AdminCosmeticGrantDialog userId={o.learner.id} learnerName={fullName} />
          <AdminGiftBoxDialog userId={o.learner.id} learnerName={fullName} />
          <AdminCharacterDialog userId={o.learner.id} learnerName={fullName} />
          <AdminPlantOverrideButton userId={o.learner.id} current={o.plant ?? {}} onSaved={refresh} />
          <ResetPasswordButton userId={o.learner.id} name={n.en || o.learner.first_name} />
        </div>
      </section>

      <CourseStrip o={o} today={today} onPick={pick} />

      <div className="mt-3.5 grid items-start gap-3.5 lg:grid-cols-[minmax(0,1fr)_296px]">
        <div className="order-2 lg:order-1">
          <DayList
            days={days}
            who={who}
            today={today}
            reflOpen={reflOpen}
            open={openWeeks}
            filter={filter}
            setFilter={setFilter}
            q={query}
            setQ={setQuery}
            onToggle={(w) => setOpenWeeks((s) => { const x = new Set(s); if (x.has(w)) x.delete(w); else x.add(w); return x; })}
            onNote={(t) => wellbeingApi.addNote(o.learner.id, t).then(refresh)}
            onStep={(t) => wellbeingApi.addStep(o.learner.id, t).then(refresh)}
          />
        </div>
        <div className="order-1 flex flex-col gap-3.5 lg:sticky lg:top-4 lg:order-2">
        <section className="rounded-2xl bg-red-50/60 p-4 shadow-[0_0_0_1px_rgba(220,38,38,.18)] dark:bg-red-500/10">
          <h4 className="text-body font-semibold">Needs attention</h4>
          {o.reasons.length === 0 && unreplied === 0 && <p className="mt-2 text-small text-l-ink3">Nothing right now.</p>}
          <div className="mt-2 flex flex-col gap-2">
            {o.reasons.map((r) => (
              <div key={r.key} className="flex items-center gap-2 text-body">
                <span className="min-w-0 flex-1">{r.text}</span>
                {r.key !== "plan" && (
                  <button type="button" aria-label={`Acknowledge ${r.text}`} title="Hide for 7 days" onClick={() => once(() => wellbeingApi.ack(o.learner.id, r.key, r.text))} className="shrink-0 rounded-full px-2.5 py-0.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
                    Seen, 7 days
                  </button>
                )}
              </div>
            ))}
            {unreplied > 0 && (
              <div className="flex items-center gap-2 text-body">
                <span className="min-w-0 flex-1">{`${unreplied} reflection${unreplied > 1 ? "s" : ""} not replied`}</span>
                <button type="button" onClick={replyNext} className="shrink-0 rounded-full px-2.5 py-0.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
                  Reply next ↓
                </button>
              </div>
            )}
          </div>
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
        <section className="rounded-2xl p-4 shadow-[0_0_0_1px_var(--l-hair)]">
          <h4 className="text-body font-semibold">
            TA notes <span className="text-small font-normal text-l-ink3">· only staff see these</span>
          </h4>
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
        </div>
      </div>
    </div>
  );
}

export function TableRedirect() {
  const { id = "" } = useParams();
  return <Navigate to={`/admin/learners/${id}`} replace />;
}

function ProfileSkeleton() {
  const card = "rounded-2xl p-4 shadow-[0_0_0_1px_var(--l-hair)]";
  return (
    <div>
      <Bone className="h-[30px] w-[118px] rounded-[10px]" />
      <section className="mt-3.5 flex flex-wrap items-center gap-5 rounded-[20px] bg-gradient-to-b from-l-sub to-l-card p-5 shadow-[0_0_0_1px_var(--l-hair)]">
        <Bone className="h-[72px] w-[72px] rounded-full" />
        <div className="grid min-w-[220px] flex-1 gap-2">
          <Bone className="h-[26px] w-56" />
          <Bone className="h-3.5 w-80 max-w-full" />
          <Bone className="h-[26px] w-40 rounded-lg" />
        </div>
        <div className="flex flex-wrap gap-2.5">
          {[0, 1, 2, 3].map((k) => (
            <Bone key={k} className="h-[78px] w-[104px] rounded-[14px]" />
          ))}
        </div>
      </section>
      <Bone className="mt-3.5 h-[74px] w-full rounded-2xl" />
      <div className="mt-3.5 grid items-start gap-3.5 lg:grid-cols-[minmax(0,1fr)_296px]">
        <section className={card}>
          <Bone className="h-6 w-72 max-w-full rounded-full" />
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="mt-4 grid grid-cols-[64px_88px_minmax(0,1fr)] gap-4">
              <Bone className="h-4 w-12" />
              <div className="grid gap-1">
                <Bone className="h-[22px] w-16 rounded-[7px]" />
                <Bone className="h-[22px] w-16 rounded-[7px]" />
              </div>
              <div className="grid gap-2">
                <Bone className="h-4 w-40" />
                <Bone className="h-12 w-full rounded-[10px]" />
              </div>
            </div>
          ))}
        </section>
        <div className="grid gap-3.5">
          {["h-24", "h-28", "h-32"].map((h) => (
            <Bone key={h} className={`${h} w-full rounded-2xl`} />
          ))}
        </div>
      </div>
      <LoadingHint label="Loading learner" />
    </div>
  );
}
