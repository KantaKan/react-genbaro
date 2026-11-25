import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { AttendanceStatusType } from "@/domain/types/attendance";
import { adminApi } from "../api";
import { useAdminHeader, useSidePanel } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { LearnerPanel } from "../learner/LearnerPanel";
import { useMarkWithUndo } from "../learner/useMarkWithUndo";
import { useConfirm } from "../ui/Confirm";
import { useSlackAvailable } from "../slack/useSlackAvailable";
import { slackApi } from "../slack/api";
import type { Session, TodayLearner, TodayView } from "../types";
import { SessionCard } from "./SessionCard";
import { LeaveMini } from "./LeaveMini";
import { JustIn } from "./JustIn";
import { Roster, type RosterLayout } from "./Roster";
import { SupportMini } from "./SupportMini";
import { NotesTab } from "../learner/NotesTab";
import { wellbeingApi } from "../wellbeing";
import { Link } from "react-router-dom";
import { bkkMinutes, bkkToday, currentSession, liveInterval } from "./time";
import { setPanelSession, usePanelSession } from "./sessionStore";
import { Bone, LoadingHint, SkeletonRows } from "@/components/LoadingSkeleton";

function useNowMin() {
  const [m, setM] = useState(() => bkkMinutes(new Date()));
  useEffect(() => {
    const t = setInterval(() => setM(bkkMinutes(new Date())), 30_000);
    return () => clearInterval(t);
  }, []);
  return m;
}

/** Panel content reads the cached board, so it updates when the board refreshes. */
function PanelFor({ id, cohort, onMove }: { id: string; cohort: number; onMove: (d: 1 | -1) => void }) {
  const { data } = useQuery(["admin-today", cohort], () => adminApi.today(cohort), { staleTime: 15_000 });
  const session = usePanelSession();
  const { close } = useSidePanel();
  const [tab, setTab] = useState<"overview" | "notes">("overview");
  const l = data?.learners.find((x) => x.id === id);
  if (!l || !data) return null;
  return (
    <div>
      <LearnerPanel learner={l} session={session} date={data.date} live canMark={data.class_today} onChanged={() => {}} onPrev={() => onMove(-1)} onNext={() => onMove(1)} onClose={close} hideStats={tab === "notes"} />
      <div role="tablist" className="mt-4 flex gap-4 border-b border-l-hair">
        {(["overview", "notes"] as const).map((t) => (
          <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)} className={`pb-2 text-small font-semibold capitalize ${tab === t ? "text-l-ink shadow-[inset_0_-2px_0_var(--l-ink)]" : "text-l-ink3"}`}>
            {t === "notes" ? "Notes" : "Overview"}
          </button>
        ))}
      </div>
      {tab === "notes" && (
        <div className="mt-3">
          <NotesTab learnerId={l.id} />
        </div>
      )}
      <Link to={`/admin/learners/${l.id}`} className="mt-4 block rounded-[11px] py-2 text-center text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
        Full profile
      </Link>
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <aside className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:order-2 xl:grid-cols-1">
          <section className="rounded-[18px] bg-gradient-to-b from-l-sub to-l-card p-4 shadow-[0_0_0_1px_var(--l-hair)]">
            <div className="flex items-center justify-between gap-2">
              <Bone className="h-5 w-36" />
              <Bone className="h-6 w-[136px] rounded-[10px]" />
            </div>
            <div className="mt-3 flex items-center gap-4">
              <Bone className="h-[84px] w-[84px] shrink-0 rounded-full" />
              <div className="grid gap-2">
                <Bone className="h-[26px] w-24" />
                <Bone className="h-3.5 w-36" />
              </div>
            </div>
            <Bone className="mt-4 h-[5px] w-full rounded-full" />
            <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Bone key={i} className="h-3.5" />
              ))}
            </div>
          </section>
          {["w-16", "w-24", "w-28"].map((w) => (
            <section key={w} className="rounded-2xl bg-l-card p-4 shadow-[0_0_0_1px_var(--l-hair)]">
              <Bone className={`h-4 ${w}`} />
              <div className="mt-3 grid gap-2.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Bone className="h-6 w-6 shrink-0 rounded-full" />
                    <Bone className="h-3.5 flex-1" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </aside>
        <div className="min-w-0 xl:order-1">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <Bone className="h-[34px] w-72 rounded-[11px]" />
            <Bone className="h-[30px] w-48 rounded-[9px]" />
          </div>
          <div className="overflow-hidden rounded-[18px] bg-l-card shadow-[0_0_0_1px_var(--l-hair)]">
            <table className="w-full border-separate border-spacing-0 text-body">
              <tbody>
                <SkeletonRows cols={["check", "person", "chips", "text", "meter", "text", "actions"]} rows={10} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <LoadingHint label="Loading today" />
    </div>
  );
}

export function TodayPage() {
  const [cohort] = useCohort();
  const qc = useQueryClient();
  const nowMin = useNowMin();
  const [params] = useSearchParams();
  const { open, close, openKey } = useSidePanel();
  const mark = useMarkWithUndo();
  const confirm = useConfirm();
  const [session, setSession] = useState<Session | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string | null>(null);
  const slackOn = useSlackAvailable();
  const pinging = useRef(false);

  // Timing comes from this browser's clock, not the last response, so an all-day tab keeps up.
  const today = useQuery(["admin-today", cohort], () => adminApi.today(cohort), {
    staleTime: 0,
    refetchInterval: (d) => (d ? liveInterval(d.rules, bkkMinutes(new Date()), d.class_today) : 60_000),
    refetchOnWindowFocus: true,
  });
  const leaves = useQuery(["admin-leaves", cohort, "pending"], () => adminApi.leaves({ cohort, status: "pending" }));
  const support = useQuery(["admin-support", cohort], () => wellbeingApi.support(cohort), { staleTime: 60_000 });
  const supportIds = new Set((support.data ?? []).map((r) => r.learner.id));
  const view = today.data;
  const s: Session = session ?? (view ? currentSession(view.rules, nowMin) : "morning");
  useEffect(() => setPanelSession(s), [s]);
  const stale = !!view && view.date !== bkkToday();
  useEffect(() => {
    if (stale) today.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale, nowMin]);
  const canMark = !!view?.class_today;
  const [layout, setLayout] = useState<RosterLayout>(() => {
    try {
      return localStorage.getItem("baro-today-roster") === "number" ? "number" : "group";
    } catch {
      return "group";
    }
  });
  const chooseLayout = (l: RosterLayout) => {
    setLayout(l);
    try {
      localStorage.setItem("baro-today-roster", l);
    } catch {
      /* private mode */
    }
  };
  // By number: one list #1, #2, #3… ; by group: the server's order (grouped).
  const learners = useMemo(() => {
    const list = view?.learners ?? [];
    const sorted = layout === "number" ? [...list].sort((a, b) => a.jsd_number.localeCompare(b.jsd_number, undefined, { numeric: true })) : list;
    // The roster pins who's not in yet on top; keep J/K in the same order.
    return canMark ? [...sorted.filter((l) => !l[s].status), ...sorted.filter((l) => l[s].status)] : sorted;
  }, [view, layout, canMark, s]);
  const dateLabel = view ? new Date(`${view.date}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Bangkok" }) : "";
  const notYet = canMark ? learners.filter((l) => !l[s].status) : [];
  const ping = () =>
    confirm.ask(`Ping the ${notYet.length} who haven't checked in?`, async () => {
      if (pinging.current) return;
      pinging.current = true;
      try {
        const r = await slackApi.ping(notYet.map((l) => l.id));
        if (r.quiet) toast("Not sent: it's inside quiet hours (set in Slack settings).");
        else toast.success(`Sent to ${r.sent}${r.no_slack.length ? ` · ${r.no_slack.length} have no Slack` : ""}${r.recent ? ` · ${r.recent} pinged in the last 30 min` : ""}${r.failed ? ` · ${r.failed} failed` : ""}`);
      } catch (e) {
        toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Couldn't send");
      } finally {
        pinging.current = false;
      }
    }, "Each gets a short check-in reminder on Slack.");
  useAdminHeader({
    title: "Today",
    context: dateLabel,
    actions:
      slackOn && notYet.length > 0 ? (
        <button type="button" onClick={ping} className="rounded-full px-3.5 py-1.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)] hover:bg-l-sub">
          Ping the {notYet.length} not in yet
        </button>
      ) : undefined,
  });

  const openLearner = useCallback(
    (id: string) => {
      setCursor(id);
      const move = (d: 1 | -1) => {
        const list = (qc.getQueryData<TodayView>(["admin-today", cohort])?.learners ?? []).map((x) => x.id);
        const next = list[Math.max(0, Math.min(list.length - 1, list.indexOf(id) + d))];
        if (next && next !== id) openLearner(next);
      };
      open(<PanelFor id={id} cohort={cohort} onMove={move} />, `learner:${id}`);
    },
    [open, cohort, qc]
  );
  const selected = openKey?.startsWith("learner:") ? openKey.slice(8) : null;

  useEffect(() => {
    const id = params.get("learner");
    if (id && learners.some((l) => l.id === id) && selected !== id) openLearner(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, learners.length]);

  const quick = (l: TodayLearner, status: AttendanceStatusType) => view && canMark && mark({ learner: l, cell: l[s], session: s, date: view.date, status, live: true });

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT|BUTTON/.test(t.tagName) || e.metaKey || e.ctrlKey || !learners.length) return;
      if (document.querySelector('[role="dialog"],[role="alertdialog"]')) return; // never act behind a dialog
      const ids = learners.map((l) => l.id);
      const cur = cursor ?? ids[0];
      const i = ids.indexOf(cur);
      const key = e.key.toLowerCase();
      if (key === "j" || key === "k") {
        const next = ids[Math.max(0, Math.min(ids.length - 1, i + (key === "j" ? 1 : -1)))];
        setCursor(next);
        if (selected) openLearner(next);
      } else if (key === "enter") openLearner(cur);
      else if (key === "x") setPicked((p) => (p.has(cur) ? (p.delete(cur), new Set(p)) : new Set(p.add(cur))));
      else if (key === "p" || key === "l" || key === "e") {
        const l = learners.find((x) => x.id === cur);
        if (l) quick(l, key === "p" ? "present" : key === "l" ? "late" : "absent_excused");
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const bulk = (status: AttendanceStatusType, label: string) =>
    confirm.ask(`${label} for ${picked.size} learners?`, async () => {
      if (!view) return;
      try {
        await adminApi.bulk({ user_ids: [...picked], date: view.date, session: s, status });
        setPicked(new Set());
        qc.invalidateQueries(["admin-today"]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't save");
      }
    });

  if (today.isLoading) return <TodaySkeleton />;
  if (!view) return <p className="text-sm text-l-ink3">Couldn't load today. Try again in a moment.</p>;

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <aside aria-label="Live" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:sticky xl:top-[70px] xl:order-2 xl:grid-cols-1">
        <SessionCard view={view} session={s} onSession={setSession} nowMin={nowMin} />
        <JustIn view={view} session={s} />
        <LeaveMini requests={leaves.data ?? []} learners={learners} />
        <SupportMini rows={support.data ?? []} />
      </aside>
      <div className="min-w-0 xl:order-1">
      {picked.size > 0 && (
        <div className="sticky top-[70px] z-[5] mb-3 flex items-center gap-2 rounded-xl bg-l-ink px-3 py-2 text-small font-semibold text-l-card">
          {picked.size} selected
          <span className="flex-1" />
          <button type="button" onClick={() => bulk("present", "Mark present")} className="rounded-lg bg-white/15 px-2.5 py-1">
            Mark present
          </button>
          <button type="button" onClick={() => bulk("absent_excused", "Excuse")} className="rounded-lg bg-white/15 px-2.5 py-1">
            Excuse
          </button>
          <button type="button" aria-label="Clear selection" onClick={() => setPicked(new Set())} className="rounded-lg bg-white/15 px-2 py-1">
            ✕
          </button>
        </div>
      )}
      <Roster
        learners={learners}
        session={s}
        selected={selected}
        picked={picked}
        onOpen={(id) => (selected === id ? close() : openLearner(id))}
        onPick={(id) => setPicked((p) => (p.has(id) ? (p.delete(id), new Set(p)) : new Set(p.add(id))))}
        onQuick={quick}
        canMark={canMark}
        supportIds={supportIds}
        layout={layout}
        onLayout={chooseLayout}
      />
      </div>
      {confirm.node}
    </div>
  );
}
