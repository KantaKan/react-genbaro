import { useCallback, useEffect, useRef, useState } from "react";
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
import { Roster } from "./Roster";
import { SupportMini } from "./SupportMini";
import { NotesTab } from "../learner/NotesTab";
import { wellbeingApi } from "../wellbeing";
import { Link } from "react-router-dom";
import { bkkMinutes, bkkToday, currentSession, liveInterval } from "./time";
import { setPanelSession, usePanelSession } from "./sessionStore";

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
          <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)} className={`pb-2 text-[12.5px] font-semibold capitalize ${tab === t ? "text-l-ink shadow-[inset_0_-2px_0_var(--l-ink)]" : "text-l-ink3"}`}>
            {t === "notes" ? "Notes" : "Overview"}
          </button>
        ))}
      </div>
      {tab === "notes" && (
        <div className="mt-3">
          <NotesTab learnerId={l.id} />
        </div>
      )}
      <Link to={`/admin/learners/${l.id}`} className="mt-4 block rounded-[11px] py-2 text-center text-[12.5px] font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
        Full profile
      </Link>
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
  const learners = view?.learners ?? [];
  const dateLabel = view ? new Date(`${view.date}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Bangkok" }) : "";
  const notYet = canMark ? learners.filter((l) => !l[s].status) : [];
  const ping = () =>
    confirm.ask(`Ping the ${notYet.length} who haven't checked in?`, async () => {
      if (pinging.current) return;
      pinging.current = true;
      try {
        const r = await slackApi.ping(notYet.map((l) => l.id));
        if (r.quiet) toast("Not sent: it's inside quiet hours (set in Slack settings).");
        else toast.success(`Sent to ${r.sent}${r.no_slack.length ? ` · ${r.no_slack.length} have no Slack` : ""}${r.failed ? ` · ${r.failed} failed` : ""}`);
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
        <button type="button" onClick={ping} className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold shadow-[0_0_0_1px_var(--l-hair)] hover:bg-l-sub">
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

  if (today.isLoading) return <div className="h-[180px] animate-pulse rounded-[18px] bg-l-sub" />;
  if (!view) return <p className="text-sm text-l-ink3">Couldn't load today. Try again in a moment.</p>;

  return (
    <div>
      <SessionCard view={view} session={s} onSession={setSession} nowMin={nowMin} />
      <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-2 2xl:grid-cols-3">
        <LeaveMini requests={leaves.data ?? []} learners={learners} />
        <JustIn view={view} session={s} />
        <SupportMini rows={support.data ?? []} />
      </div>
      {picked.size > 0 && (
        <div className="sticky top-[70px] z-[5] mt-4 flex items-center gap-2 rounded-xl bg-l-ink px-3 py-2 text-[12.5px] font-semibold text-l-card">
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
      />
      {confirm.node}
    </div>
  );
}
