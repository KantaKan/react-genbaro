import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { BarometerFace, ZONES, type ZoneId } from "@/learner/today/BarometerFace";
import { nicknames } from "@/learner/lib/name";
import { useAdminHeader, useSidePanel } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { wellbeingApi, type Board, type Entry, type LearnerRef, type Zone } from "../wellbeing";

import { ZONE_BG, zoneLabel } from "../ui/zones";
import { getThailandDateISO } from "@/utils/date-utils";
const nick = (l: Pick<LearnerRef, "zoom_name" | "first_name">) => nicknames(l.zoom_name, l.first_name);
const shortDay = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "narrow", day: "numeric", timeZone: "Asia/Bangkok" });

/** Wraps watch words in <mark>. */
function Marked({ text, words }: { text: string; words: string[] | null }) {
  if (!words?.length || !text) return <>{text}</>;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return (
    <>
      {text.split(re).map((p, i) =>
        i % 2 ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-500/30">
            {p}
          </mark>
        ) : (
          p
        )
      )}
    </>
  );
}

function Tiles({ b }: { b: Board }) {
  const total = Math.max(1, ZONES.reduce((a, z) => a + b.zones[z.id], 0));
  return (
    <>
      <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {ZONES.map((z) => {
          const n = b.zones[z.id];
          const d = n - b.zones_prev[z.id];
          const worse = z.id === "panic" || z.id === "stretch-overwhelmed" ? d > 0 : d < 0;
          return (
            <div key={z.id} role="group" aria-label={zoneLabel(z.id)} className="flex flex-col items-center gap-0.5 rounded-2xl bg-l-sub px-2 pb-3 pt-3.5 text-center shadow-[0_0_0_1px_var(--l-hair)]">
              <BarometerFace zone={z.id} size={44} />
              <b className="mt-1.5 text-[26px] font-bold leading-none tabular-nums tracking-tight">{n}</b>
              <span className="min-h-[31px] text-xs leading-tight text-l-ink2">
                {z.a}
                {z.b !== "zone" && <br />}
                {z.b !== "zone" ? z.b : ""}
              </span>
              <span className="text-micro tabular-nums text-l-ink3">{Math.round((n / total) * 100)}%</span>
              {b.range === "night" && (
                <span className={`mt-1.5 rounded-full px-2 py-0.5 text-micro font-semibold ${d === 0 ? "bg-l-card text-l-ink3 shadow-[0_0_0_1px_var(--l-hair)]" : worse ? "bg-red-50 text-red-600 dark:bg-red-500/15" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15"}`}>
                  {d === 0 ? "same as last week" : `${d > 0 ? "+" : ""}${d} vs last week`}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3.5 flex h-2 gap-0.5 overflow-hidden rounded-full">
        {ZONES.map((z) => (
          <i key={z.id} className="block" style={{ flex: b.zones[z.id], background: `linear-gradient(90deg,${z.c1},${z.c2})` }} />
        ))}
      </div>
    </>
  );
}

function summary(b: Board): string {
  const ch = ZONES.map((z) => ({ z, d: b.zones[z.id] - b.zones_prev[z.id] })).sort((x, y) => Math.abs(y.d) - Math.abs(x.d))[0];
  if (b.range !== "night" || !ch || ch.d === 0) return `${b.sent} of ${b.total} wrote. Nothing unusual compared with last week.`;
  return `${zoneLabel(ch.z.id)} is ${ch.d > 0 ? "up" : "down"} ${Math.abs(ch.d)} from the same night last week.`;
}

function ReflectionPanel({ cohort, range, learnerId }: { cohort: number; range: Board["range"]; learnerId: string }) {
  const { data } = useQuery(["admin-reflections", cohort, range], () => wellbeingApi.board(cohort, range), { staleTime: 60_000 });
  const qc = useQueryClient();
  const [reply, setReply] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const busy = useRef(false);
  const e = data?.entries.find((x) => x.learner.id === learnerId);
  const row = data?.map.find((x) => x.learner.id === learnerId);
  const who = e?.learner ?? row?.learner;
  if (!who) return null;
  const n = nick(who);
  const once = async (f: () => Promise<unknown>, ok: string) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await f();
      toast.success(ok);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      busy.current = false;
    }
  };
  const replyText = reply ?? e?.admin_feedback ?? "";
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 pr-10">
        <UserAvatar userId={who.id} name={n.en} avatar={who.avatar} className="h-[52px] w-[52px]" />
        <div>
          <b className="block text-heading font-semibold">{n.th ? `${n.th} · ${n.en}` : n.en}</b>
          <small className="text-small text-l-ink3">
            Group {who.genmate_group || "–"} · {data?.date}
          </small>
        </div>
      </div>
      <section className="mt-3.5 rounded-[14px] bg-l-sub p-3.5 shadow-[0_0_0_1px_var(--l-hair)]">
        <div className="text-small text-l-ink3">Barometer</div>
        <div className="mt-1 flex items-center gap-2 text-title font-semibold">
          {e?.zone ? <BarometerFace zone={e.zone as ZoneId} size={28} /> : null}
          {zoneLabel(e?.zone ?? "")}
        </div>
        {row && (
          <div className="mt-2.5 flex gap-[3px]">
            {row.nights.map((z, i) => (
              <i key={i} title={zoneLabel(z)} className="block h-2 flex-1 rounded-[3px]" style={{ background: z ? ZONE_BG[z] : "var(--l-hair)" }} />
            ))}
          </div>
        )}
      </section>
      {e ? (
        <div className="mt-3.5 grid gap-2.5">
          {[
            ["Tech sessions · went well", e.tech_happy],
            ["Tech sessions · to improve", e.tech_improve],
            ["Non-tech · went well", e.nontech_happy],
            ["Non-tech · to improve", e.nontech_improve],
          ].map(([h, t]) => (
            <section key={h} className="rounded-xl bg-l-sub px-3.5 py-3">
              <h5 className="text-micro font-bold uppercase tracking-[.06em] text-l-ink3">{h}</h5>
              <p className="mt-1 whitespace-pre-wrap text-body leading-relaxed">{t ? <Marked text={t} words={e.words} /> : <span className="text-l-ink3">—</span>}</p>
            </section>
          ))}
          {e.admin_feedback && (
            <p className="mt-1 text-small text-l-ink3">{repliedBy(e)}</p>
          )}
          <label className="mt-1 text-small font-semibold text-l-ink2">
            Reply to learner
            <span className="ml-1 font-normal text-l-ink3">(they see this on their reflection)</span>
            <textarea aria-label="Reply to learner" value={replyText} onChange={(ev) => setReply(ev.target.value)} className="mt-1.5 h-[70px] w-full resize-none rounded-xl bg-l-sub px-3 py-2.5 text-body font-normal text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]" />
          </label>
          <button
            type="button"
            disabled={!replyText.trim()}
            onClick={() => once(() => wellbeingApi.reply(who.id, e.reflection_id, replyText.trim()).then(() => (setReply(null), qc.invalidateQueries(["admin-reflections"]))), "Reply sent")}
            className="justify-self-end rounded-full bg-l-ink px-4 py-1.5 text-small font-semibold text-l-card disabled:opacity-40"
          >
            Send reply
          </button>
        </div>
      ) : (
        <p className="mt-3.5 rounded-xl bg-l-sub px-3.5 py-3 text-body text-l-ink3">No reflection for this night.</p>
      )}
      <div className="mt-4 text-small text-l-ink3">Add to their support plan</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["Check in tomorrow", "Pair with a buddy", "Talk about workload"].map((t) => (
          <button key={t} type="button" onClick={() => once(() => wellbeingApi.addStep(who.id, t), `Added: ${t}`)} className="rounded-full px-3 py-1.5 text-xs font-semibold shadow-[0_0_0_1px_var(--l-hair)] hover:bg-l-sub">
            {t}
          </button>
        ))}
      </div>
      <label className="mt-4 text-small text-l-ink3">
        Private note (only admins see this)
        <textarea value={note} onChange={(ev) => setNote(ev.target.value)} className="mt-1.5 h-[64px] w-full resize-none rounded-xl bg-l-sub px-3 py-2.5 text-body text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]" />
      </label>
      <button type="button" disabled={!note.trim()} onClick={() => once(() => wellbeingApi.addNote(who.id, note.trim()).then(() => setNote("")), "Note saved")} className="mt-2 self-end rounded-full px-4 py-1.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)] disabled:opacity-40">
        Save note
      </button>
    </div>
  );
}

export function ReflectionsPage() {
  const [cohort] = useCohort();
  const [range, setRange] = useState<Board["range"]>("night");
  const [sort, setSort] = useState<"worst" | "group" | "az">("worst");
  const [filter, setFilter] = useState<"all" | "panic" | "over">("all");
  const [q, setQ] = useState("");
  const { open } = useSidePanel();
  const board = useQuery(["admin-reflections", cohort, range], () => wellbeingApi.board(cohort, range), { keepPreviousData: true });
  const b = board.data;
  useAdminHeader({ title: "Reflections", context: "Barometer and what learners wrote" });
  const openL = (id: string) => open(<ReflectionPanel cohort={cohort} range={range} learnerId={id} />, `refl:${id}`);

  const map = useMemo(() => {
    if (!b) return [];
    const m = [...b.map];
    if (sort === "group") m.sort((x, y) => x.learner.genmate_group.localeCompare(y.learner.genmate_group));
    if (sort === "az") m.sort((x, y) => nick(x.learner).en.localeCompare(nick(y.learner).en));
    return m;
  }, [b, sort]);
  const entries = useMemo(() => {
    if (!b) return [] as Entry[];
    const needle = q.trim().toLowerCase();
    return b.entries.filter((e) => {
      if (filter === "panic" && e.zone !== "panic") return false;
      if (filter === "over" && e.zone !== "stretch-overwhelmed") return false;
      if (!needle) return true;
      return [e.tech_happy, e.tech_improve, e.nontech_happy, e.nontech_improve, e.learner.first_name, e.learner.zoom_name].join(" ").toLowerCase().includes(needle);
    });
  }, [b, q, filter]);

  if (board.isLoading) return <div className="h-48 animate-pulse rounded-2xl bg-l-sub" />;
  if (!b) return <p className="text-sm text-l-ink3">Couldn't load reflections.</p>;
  const night = new Date(`${b.date}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Bangkok" });
  return (
    <div>
      <div className="inline-flex rounded-[10px] bg-l-card p-[3px] shadow-[0_0_0_1px_var(--l-hair)]">
        {([["night", "Latest night"], ["week", "This week"], ["4w", "Last 4 weeks"]] as const).map(([k, t]) => (
          <button key={k} type="button" aria-pressed={range === k} onClick={() => setRange(k)} className={`rounded-[7px] px-3 py-1 text-xs font-semibold ${range === k ? "bg-l-ink text-l-card" : "text-l-ink2"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-3.5 grid gap-3.5 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl p-4 shadow-[0_0_0_1px_var(--l-hair)]">
          <h4 className="flex text-body font-semibold">
            How the cohort felt {range === "night" ? (b.date === getThailandDateISO() ? "tonight" : "last night") : range === "week" ? "this week" : "the last 4 weeks"}
            <span className="ml-auto text-xs font-medium text-l-ink3">{night}</span>
          </h4>
          <Tiles b={b} />
          <p className="mt-3 rounded-xl bg-l-sub px-3 py-2.5 text-body text-l-ink2">{summary(b)}</p>
        </section>
        <section className="rounded-2xl p-4 shadow-[0_0_0_1px_var(--l-hair)]">
          <h4 className="flex items-center gap-2 text-body font-semibold">
            Sent <span className="tabular-nums">{`${b.sent} / ${b.total}`}</span>
          </h4>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-l-sub shadow-[inset_0_0_0_1px_var(--l-hair)]">
            <i className="block h-full rounded-full bg-l-ink" style={{ width: `${(b.sent / Math.max(1, b.total)) * 100}%` }} />
          </div>
          {b.missing.length > 0 && (
            <>
              <div className="mb-2 mt-3 text-xs text-l-ink3">Haven't written yet</div>
              <div className="flex flex-wrap gap-1.5">
                {b.missing.slice(0, 10).map((l) => (
                  <span key={l.id} title={nick(l).th || nick(l).en} className="rounded-full shadow-[0_0_0_2px_var(--l-card)]">
                    <UserAvatar userId={l.id} name={nick(l).en} avatar={l.avatar} className="h-[30px] w-[30px]" />
                  </span>
                ))}
                {b.missing.length > 10 && <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-l-sub text-micro font-bold text-l-ink2">+{b.missing.length - 10}</span>}
              </div>
            </>
          )}
          <div className="mb-2 mt-4 text-xs text-l-ink3">Sent by group</div>
          <div className="grid gap-1.5">
            {b.by_group.map((g) => (
              <div key={g.group} className="grid grid-cols-[22px_1fr_34px] items-center gap-2 text-xs text-l-ink2">
                <span>{g.group || "–"}</span>
                <i className="block h-1.5 overflow-hidden rounded-full bg-l-sub shadow-[inset_0_0_0_1px_var(--l-hair)]">
                  <em className="block h-full rounded-full bg-l-ink2" style={{ width: `${(g.sent / Math.max(1, g.total)) * 100}%` }} />
                </i>
                <b className="text-right font-semibold tabular-nums">
                  {g.sent}/{g.total}
                </b>
              </div>
            ))}
          </div>
        </section>
      </div>

      {b.worth.length > 0 && (
        <section className="mt-3.5 rounded-2xl p-4 shadow-[0_0_0_1px_var(--l-hair)]">
          <h4 className="flex items-center gap-2 text-body font-semibold">
            Worth a look <span className="rounded-full bg-red-50 px-1.5 text-micro font-bold text-red-600 dark:bg-red-500/15">{b.worth.length}</span>
            <span className="text-xs font-medium text-l-ink3">Patterns, not single bad days</span>
          </h4>
          <div className="mt-2.5 grid gap-2.5 md:grid-cols-2">
            {b.worth.map((w) => {
              const n = nick(w.learner);
              return (
                <button key={w.learner.id} type="button" onClick={() => openL(w.learner.id)} className="flex items-start gap-3 rounded-[14px] bg-l-sub p-3 text-left shadow-[0_0_0_1px_var(--l-hair)] transition-transform duration-300 hover:-translate-y-0.5">
                  <UserAvatar userId={w.learner.id} name={n.en} avatar={w.learner.avatar} className="h-[34px] w-[34px]" />
                  <div className="min-w-0">
                    <b className="text-body font-semibold">
                      {n.th || n.en} · {w.patterns.map((p) => p.title).join(" · ")}
                    </b>
                    {w.quote && <p className="mt-0.5 text-small leading-snug text-l-ink2">“{w.quote}”</p>}
                    <div className="mt-2 flex gap-0.5">
                      {w.strip.map((z, i) => (
                        <i key={i} title={zoneLabel(z)} className="block h-1.5 w-3.5 rounded-sm" style={{ background: z ? ZONE_BG[z] : "var(--l-hair)" }} />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="mb-2.5 mt-6 flex flex-wrap items-center gap-2">
        <h3 className="text-title font-semibold">Mood map</h3>
        <span className="text-xs text-l-ink3">One square per night · click to read it</span>
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-micro text-l-ink2">
          {Object.entries(ZONE_BG).map(([z, c]) => (
            <span key={z} className="inline-flex items-center gap-1">
              <i aria-hidden className="block h-2.5 w-2.5 rounded-sm" style={{ background: c }} />
              {zoneLabel(z as Zone)}
            </span>
          ))}
        </span>
        <span className="flex-1" />
        {([["worst", "Worst first"], ["group", "By group"], ["az", "A–Z"]] as const).map(([k, t]) => (
          <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)} className={`rounded-[9px] px-2.5 py-1 text-small font-semibold ${sort === k ? "bg-l-sub text-l-ink shadow-[0_0_0_1px_var(--l-hair)]" : "text-l-ink2"}`}>
            {t}
          </button>
        ))}
      </div>
      <section className="overflow-x-auto rounded-2xl p-3.5 shadow-[0_0_0_1px_var(--l-hair)]">
        <div className="grid min-w-[640px] items-center gap-[3px] text-xs" style={{ gridTemplateColumns: `150px repeat(${b.dates.length}, minmax(0,1fr))` }}>
          <span />
          {b.dates.map((d) => (
            <span key={d} className="pb-1 text-center text-micro text-l-ink3">
              {shortDay(d)}
            </span>
          ))}
          {map.map((r) => {
            const n = nick(r.learner);
            return [
              <span key={`${r.learner.id}-n`} className="flex items-center gap-2 truncate pr-1.5">
                <UserAvatar userId={r.learner.id} name={n.en} avatar={r.learner.avatar} className="h-[22px] w-[22px]" />
                {n.th || n.en} <span className="text-l-ink3">· {r.learner.genmate_group}</span>
              </span>,
              ...r.nights.map((z, i) => (
                <button
                  key={`${r.learner.id}-${i}`}
                  type="button"
                  aria-label={`${n.th || n.en} · ${b.dates[i]} · ${zoneLabel(z)}`}
                  title={`${b.dates[i]} · ${zoneLabel(z)}`}
                  onClick={() => openL(r.learner.id)}
                  className={`h-6 rounded-md transition-transform hover:scale-110 ${z ? "" : "shadow-[inset_0_0_0_1.5px_var(--l-hair)]"}`}
                  style={z ? { background: ZONE_BG[z] } : undefined}
                />
              )),
            ];
          })}
        </div>
      </section>

      <div className="mb-2.5 mt-6 flex flex-wrap items-center gap-2">
        <h3 className="text-title font-semibold">What they wrote</h3>
        <span className="text-xs text-l-ink3">{night}</span>
        <span className="flex-1" />
        {([["all", "All"], ["panic", "Panic"], ["over", "Overwhelmed"]] as const).map(([k, t]) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={`rounded-[9px] px-2.5 py-1 text-small font-semibold ${filter === k ? "bg-l-sub text-l-ink shadow-[0_0_0_1px_var(--l-hair)]" : "text-l-ink2"}`}>
            {t}
          </button>
        ))}
        <label className="flex items-center gap-2 rounded-[10px] bg-l-sub px-3 py-1.5 text-l-ink3 shadow-[0_0_0_1px_var(--l-hair)]">
          <Search className="h-3.5 w-3.5" />
          <input aria-label="Search reflections" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Words like “lost”, “React”…" className="w-44 bg-transparent text-small text-l-ink outline-none" />
        </label>
      </div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
        {entries.map((e) => {
          const n = nick(e.learner);
          return (
            <button key={e.reflection_id} type="button" onClick={() => openL(e.learner.id)} className="rounded-2xl px-4 py-3.5 text-left shadow-[0_0_0_1px_var(--l-hair)] transition hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--l-hair),0_10px_28px_-18px_rgba(24,24,27,.3)]">
              <div className="flex items-center gap-2.5">
                <UserAvatar userId={e.learner.id} name={n.en} avatar={e.learner.avatar} className="h-[30px] w-[30px]" />
                <div className="min-w-0">
                  <b className="text-body font-semibold">{n.th ? `${n.th} · ${n.en}` : n.en}</b>
                  <small className="block text-small text-l-ink3">Group {e.learner.genmate_group || "–"}</small>
                </div>
                {e.zone && (
                  <span className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-l-sub py-0.5 pl-1 pr-2.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
                    <BarometerFace zone={e.zone as ZoneId} size={18} />
                    {zoneLabel(e.zone)}
                  </span>
                )}
              </div>
              <div className="mt-2.5 grid gap-2 text-small leading-relaxed">
                <div>
                  <small className="block text-micro font-bold uppercase tracking-[.06em] text-l-ink3">Tech · went well</small>
                  <Marked text={e.tech_happy || "—"} words={e.words} />
                </div>
                <div>
                  <small className="block text-micro font-bold uppercase tracking-[.06em] text-l-ink3">Tech · to improve</small>
                  <Marked text={e.tech_improve || "—"} words={e.words} />
                </div>
              </div>
            </button>
          );
        })}
        {entries.length === 0 && <p className="rounded-2xl bg-l-sub px-4 py-8 text-center text-body text-l-ink3">Nothing matches.</p>}
      </div>
    </div>
  );
}

/** "Replied by Neeti · 2h ago", so two TAs don't both answer the same night. */
function repliedBy(e: Entry): string {
  const raw = e.admin_feedback_name ?? "";
  const who = raw ? (raw.includes("(") ? nicknames(raw, raw.replace(/^\d+_/, "")).en : raw.replace(/^\d+_/, "")) : "";
  const at = e.admin_feedback_at ? new Date(e.admin_feedback_at).getTime() : NaN;
  let when = "";
  if (!Number.isNaN(at)) {
    const m = Math.max(0, Math.round((Date.now() - at) / 60000));
    when = m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
  }
  if (!who) return when ? `Already replied · ${when}` : "Already replied";
  return when ? `Replied by ${who} · ${when}` : `Replied by ${who}`;
}
