import { useEffect, useRef, useState } from "react";
import { getThailandDateISO } from "@/utils/date-utils";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { cohortApi, type CohortSettings } from "./api";
import { chessApi } from "@/learner/chess/api";
import { Link } from "react-router-dom";

function ChessEnd({ cohort }: { cohort: number }) {
  const [sure, setSure] = useState(false);
  const end = async () => {
    try {
      await chessApi.end(cohort);
      toast.success("Game ended as a draw. A new one starts within a minute.");
    } catch {
      toast.error("Couldn't end the game");
    } finally {
      setSure(false);
    }
  };
  return sure ? (
    <span className="flex gap-1.5">
      <button type="button" onClick={end} className="rounded-full bg-red-600 px-3 py-1.5 text-small font-semibold text-white">
        End as a draw
      </button>
      <button type="button" onClick={() => setSure(false)} className="rounded-full px-3 py-1.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
        Keep playing
      </button>
    </span>
  ) : (
    <button type="button" onClick={() => setSure(true)} className="rounded-full px-3 py-1.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
      End this game
    </button>
  );
}

type Clock = { h: number; m: number };
const toStr = (c: Clock) => `${String(c.h).padStart(2, "0")}:${String(c.m).padStart(2, "0")}`;
const toClock = (s: string): Clock => {
  const [h, m] = s.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
};
const GROUPS = "ABCDEFGHIJ".split("");
const box = "rounded-2xl p-5 shadow-[0_0_0_1px_var(--l-hair)]";
const input = "rounded-xl bg-l-sub px-3 py-2 text-body text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]";

export function RulesPage() {
  const [cohort] = useCohort();
  const qc = useQueryClient();
  const q = useQuery(["admin-settings", cohort], () => cohortApi.settings(cohort));
  const [s, setS] = useState<CohortSettings | null>(null);
  const busy = useRef(false);
  useEffect(() => setS(q.data ?? null), [q.data]);
  useAdminHeader({ title: "Check-in rules", context: `JSD${cohort}` });
  if (!s) return <div className="h-48 animate-pulse rounded-2xl bg-l-sub" />;

  const setTime = (sess: "morning" | "afternoon", k: "open_at" | "late_after" | "absent_after", v: string) =>
    setS({ ...s, rules: { ...s.rules, [sess]: { ...s.rules[sess], [k]: toClock(v) } } });
  const region = s.checkin_region ?? "anywhere";
  const flag = s.flag_unusual ?? true;
  const pos = (c: Clock) => (((c.h * 60 + c.m) - 480) / 540) * 100;
  const save = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      await cohortApi.saveSettings(cohort, { ...s, checkin_region: region, flag_unusual: flag });
      toast.success("Rules saved");
      qc.invalidateQueries(["admin-settings", cohort]);
      qc.invalidateQueries(["admin-today"]);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg ?? "Couldn't save");
    } finally {
      busy.current = false;
    }
  };
  return (
    <div className="flex max-w-[920px] flex-col gap-3.5">
      <section className={box}>
        <h4 className="text-body font-semibold">
          Check-in times <span className="ml-1.5 text-xs font-medium text-l-ink3">Applies from the next check-in</span>
        </h4>
        {(["morning", "afternoon"] as const).map((sess) => (
          <div key={sess} className="mt-3 grid grid-cols-[100px_repeat(3,minmax(0,1fr))] items-center gap-2.5">
            <b className="text-body font-semibold capitalize">{sess}</b>
            {([["open_at", "Opens"], ["late_after", "Late after"], ["absent_after", "Absent after"]] as const).map(([k, t]) => (
              <label key={k} className="flex flex-col gap-1 rounded-xl px-3 py-2 shadow-[0_0_0_1px_var(--l-hair)]">
                <small className="text-micro text-l-ink3">{t}</small>
                <input type="time" aria-label={`${sess === "morning" ? "Morning" : "Afternoon"} ${t.toLowerCase()}`} value={toStr(s.rules[sess][k])} onChange={(e) => setTime(sess, k, e.target.value)} className="bg-transparent text-base font-semibold tabular-nums outline-none" />
              </label>
            ))}
          </div>
        ))}
        <div className="relative mt-4 h-[26px] rounded-lg bg-l-sub shadow-[inset_0_0_0_1px_var(--l-hair)]">
          {(["morning", "afternoon"] as const).map((sess) => {
            const w = s.rules[sess];
            return [
              <i key={`${sess}a`} className="absolute bottom-[3px] top-[3px] rounded-md bg-emerald-200 dark:bg-emerald-500/40" style={{ left: `${pos(w.open_at)}%`, width: `${pos(w.late_after) - pos(w.open_at)}%` }} />,
              <i key={`${sess}b`} className="absolute bottom-[3px] top-[3px] rounded-md bg-amber-200 dark:bg-amber-500/40" style={{ left: `${pos(w.late_after)}%`, width: `${pos(w.absent_after) - pos(w.late_after)}%` }} />,
            ];
          })}
        </div>
        <div className="mt-1 flex justify-between text-micro text-l-ink3">
          {["8:00", "10:00", "12:00", "14:00", "16:00", "17:00"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </section>

      <section className={box}>
        <h4 className="text-body font-semibold">
          Where learners can check in from <span className="ml-1.5 text-xs font-medium text-l-ink3">Everyone learns from home</span>
        </h4>
        <div role="radiogroup" aria-label="Check-in region" className="mt-2.5 grid gap-2">
          {([["anywhere", "Anywhere", "Home Wi-Fi, mobile data, anything."], ["thailand", "Only from Thailand", "Blocks check-ins from other countries when the server can tell."]] as const).map(([k, t, d]) => (
            <label key={k} className={`flex cursor-pointer items-start gap-3 rounded-xl px-3.5 py-3 shadow-[0_0_0_1px_var(--l-hair)] ${region === k ? "bg-l-sub" : ""}`}>
              <input type="radio" name="region" checked={region === k} onChange={() => setS({ ...s, checkin_region: k })} className="mt-1 accent-zinc-900" aria-label={t} />
              <span>
                <b className="block text-body font-semibold">{t}</b>
                <small className="text-xs text-l-ink3">{d}</small>
              </span>
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-3 border-t border-l-hair pt-3">
          <span className="flex-1">
            <b className="block text-body font-semibold">Flag unusual check-ins</b>
            <small className="text-xs text-l-ink3">Marks learners who check in from the same network in Today. Never blocks anyone.</small>
          </span>
          <Switch checked={flag} onCheckedChange={(v) => setS({ ...s, flag_unusual: v })} aria-label="Flag unusual check-ins" />
        </label>
        <p className="mt-3 rounded-xl bg-l-sub px-3.5 py-2.5 text-small text-l-ink2">Check-in is a time stamp, not a location check. You still see who's really there on Zoom.</p>
      </section>

      <section className={box}>
        <h4 className="text-body font-semibold">Course</h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-l-ink2">
            Start date
            <input type="date" value={s.start_date ?? ""} onChange={(e) => setS({ ...s, start_date: e.target.value })} className={input} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-l-ink2">
            Course length (class days)
            <input type="number" min={1} value={s.course_days ?? 75} onChange={(e) => setS({ ...s, course_days: Number(e.target.value) })} className={input} />
          </label>
          <div className="flex flex-col gap-1.5 text-xs font-semibold text-l-ink2">
            Leave allowance
            <span className="py-2 text-body font-normal text-l-ink">8 days · warnings at 4, 6, 7</span>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-l-sub px-3.5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-l-ink2">
              Graduated · last class day
              <input type="date" aria-label="Last class day" value={s.graduated_on ?? ""} onChange={(e) => setS({ ...s, graduated_on: e.target.value || undefined })} className={input} />
            </label>
            {s.graduated_on ? (
              <button type="button" onClick={() => setS({ ...s, graduated_on: undefined })} className="rounded-full px-3 py-1.5 text-small font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
                Still running
              </button>
            ) : (
              <button type="button" onClick={() => setS({ ...s, graduated_on: getThailandDateISO() })} className="rounded-full px-3 py-1.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
                Graduated today
              </button>
            )}
          </div>
          <p className="mt-2 text-small text-l-ink2">
            {s.graduated_on
              ? `JSD${cohort} has no class after ${s.graduated_on}: no check-in, no automatic absences and no "hasn't written" nudges. Their history stays.`
              : "Set this when the cohort finishes, so Baro stops treating weekdays as class days for them."}
          </p>
        </div>
        <h5 className="mt-4 text-xs font-semibold text-l-ink2">GenMate group chat links</h5>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {GROUPS.map((g) => (
            <label key={g} className="flex items-center gap-2 text-body">
              <b className="w-5 font-semibold">{g}</b>
              <input
                aria-label={`Group ${g} chat link`}
                value={s.group_chat_urls?.[g] ?? ""}
                onChange={(e) => setS({ ...s, group_chat_urls: { ...(s.group_chat_urls ?? {}), [g]: e.target.value } })}
                placeholder="https://…"
                className={`${input} flex-1 py-1.5`}
              />
            </label>
          ))}
        </div>
      </section>

      <section className={box}>
        <label className="flex items-center gap-3">
          <span className="flex-1">
            <b className="block text-body font-semibold">Team chess</b>
            <small className="text-xs text-l-ink3">One slow game for the whole cohort, white vs black by GenMate group. A random teammate moves each turn, 4 working hours (09:00–21:00) to play.</small>
          </span>
          <Switch checked={!!s.chess_enabled} onCheckedChange={(v) => setS({ ...s, chess_enabled: v })} aria-label="Team chess" />
        </label>
        {q.data?.chess_enabled && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-l-hair pt-3">
            <Link to={`/learner/chess?cohort=${cohort}`} className="rounded-full px-3 py-1.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
              Watch the board
            </Link>
            <ChessEnd cohort={cohort} />
          </div>
        )}
      </section>

      <div className="flex items-center gap-2">
        <span className="flex-1 text-xs text-l-ink3">Every change is saved to the Activity log with your name.</span>
        <button type="button" onClick={() => setS(q.data ?? null)} className="rounded-full px-4 py-2 text-body font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
          Reset
        </button>
        <button type="button" onClick={save} className="rounded-full bg-l-ink px-4 py-2 text-body font-semibold text-l-card">
          Save rules
        </button>
      </div>
    </div>
  );
}
