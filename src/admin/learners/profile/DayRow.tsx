import { useState } from "react";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { BarometerFace, type ZoneId } from "@/learner/today/BarometerFace";
import { CellChip } from "../../attendance/CellChip";
import type { Who } from "../../learner/useMarkWithUndo";
import { zoneLabel } from "../../ui/zones";
import { wellbeingApi, type OverviewDay, type SessionAt } from "../../wellbeing";

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });
const dayName = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", timeZone: "Asia/Bangkok" });

function Chip({ who, date, session, s }: { who: Who; date: string; session: "morning" | "afternoon"; s: SessionAt | null }) {
  return (
    <CellChip
      l={who}
      cell={{ status: s?.status ?? "" }}
      date={date}
      session={session}
      label={
        <>
          {session === "morning" ? "AM" : "PM"}
          {s?.at && s.marked_by === "self" && !s.at.startsWith("0001") && <span className="font-medium opacity-80">{time(s.at)}</span>}
        </>
      }
    />
  );
}

export function DayRow({ day, who, today, reflOpen = true, onNote, onStep }: { day: OverviewDay; who: Who; today: string; reflOpen?: boolean; onNote: (text: string) => Promise<unknown>; onStep: (text: string) => Promise<unknown> }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const r = day.reflection;
  const improve = r ? [["Tech · to improve", r.tech_improve], ["Non-tech · to improve", r.nontech_improve]].filter(([, t]) => t.trim()) : [];
  const well = r ? [r.tech_happy, r.nontech_happy].filter((t) => t.trim()) : [];
  const run = async (f: () => Promise<unknown>, clear = true) => {
    if (busy || !draft.trim()) return;
    setBusy(true);
    try {
      await f();
      if (clear) setDraft("");
      qc.invalidateQueries(["admin-overview", who.id]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setBusy(false);
    }
  };
  const send = () => r && run(() => wellbeingApi.reply(who.id, r.id, draft.trim()));
  return (
    <div id={`day-${day.date}`} className={`grid scroll-mt-16 grid-cols-[64px_88px_minmax(0,1fr)] gap-4 px-2 py-3.5 ${day.date === today ? "rounded-[14px] bg-l-sub" : "border-t border-l-hair"}`}>
      <div>
        <b className="text-body font-semibold">{dayName(day.date)}</b>
        {day.date === today && <div className="text-small text-l-ink3">Today</div>}
        {day.extra && <div className="text-small text-l-ink3">No class</div>}
      </div>
      <div className="flex flex-col items-start gap-1">
        {!day.extra && (
          <>
            <Chip who={who} date={day.date} session="morning" s={day.morning} />
            <Chip who={who} date={day.date} session="afternoon" s={day.afternoon} />
          </>
        )}
      </div>
      {!r ? (
        <div className="flex items-center gap-2 pt-0.5">
          <i className="block h-5 w-5 rounded-full shadow-[inset_0_0_0_1.5px_var(--l-hair)]" />
          <span className="text-small text-l-ink3">{day.date === today && !reflOpen ? "Reflections open at 16:45" : "No reflection"}</span>
        </div>
      ) : (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {r.zone && <BarometerFace zone={r.zone as ZoneId} size={20} />}
            <b className="text-body font-semibold">{zoneLabel(r.zone)}</b>
            {!r.reply && <span className="text-small text-l-ink3">{`Not replied${r.sent_at && !r.sent_at.startsWith("0001") ? ` · sent ${time(r.sent_at)}` : ""}`}</span>}
          </div>
          {improve.map(([label, text]) => (
            <div key={label} className="mt-2 rounded-[10px] bg-amber-50 px-3 py-2 dark:bg-amber-500/10">
              <p className="whitespace-pre-wrap text-body leading-relaxed">{text}</p>
              <small className="text-small text-l-ink3">{label}</small>
            </div>
          ))}
          {well.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-small font-medium text-l-ink2">{`What went well (${well.length})`}</summary>
              {well.map((t, i) => (
                <p key={i} className="mt-1.5 whitespace-pre-wrap text-body leading-relaxed text-l-ink2">
                  {t}
                </p>
              ))}
            </details>
          )}
          {r.reply ? (
            <div className="mt-2.5 flex gap-2 text-body">
              <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-l-sub text-[10px] font-bold text-l-ink2">{(r.reply_name || "?").slice(0, 1)}</span>
              <div>
                <b className="font-semibold">{r.reply_name || "Staff"}</b> {r.reply_at && <span className="text-small text-l-ink3">{time(r.reply_at)}</span>}
                <p className="whitespace-pre-wrap text-l-ink2">{r.reply}</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl bg-l-card shadow-[0_0_0_1px_var(--l-hair)] focus-within:shadow-[0_0_0_1.5px_var(--l-ink)]">
              <textarea
                aria-label={`Reply to ${who.first_name}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={`Reply to ${who.first_name}…`}
                className="block min-h-[52px] w-full resize-none rounded-xl bg-transparent px-3 py-2.5 text-body text-l-ink outline-none"
              />
              <div className="flex flex-wrap items-center gap-3 px-3 pb-2">
                <button type="button" disabled={!draft.trim() || busy} onClick={() => run(() => onNote(draft.trim()))} className="text-small font-medium text-l-ink2 hover:text-l-ink disabled:opacity-40">
                  + Save as TA note
                </button>
                <button type="button" disabled={!draft.trim() || busy} onClick={() => run(() => onStep(draft.trim().slice(0, 200)))} className="text-small font-medium text-l-ink2 hover:text-l-ink disabled:opacity-40">
                  + Add to support plan
                </button>
                <span className="ml-auto hidden text-small text-l-ink3 sm:inline">⌘↵</span>
                <button type="button" disabled={!draft.trim() || busy} onClick={send} className="rounded-full bg-l-ink px-3.5 py-1.5 text-small font-semibold text-l-card disabled:opacity-40">
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
