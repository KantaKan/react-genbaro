import { useState } from "react";
import { Lock } from "lucide-react";
import { BarometerFace, ZONES, type ZoneId } from "../today/BarometerFace";
import { answersComplete, type Answers, type Night } from "./model";

export const OPENS_AT = 16 * 3600 + 45 * 60;

const QUESTIONS: { key: keyof Answers; label: string; hint: string }[] = [
  { key: "th", label: "Tech · what went well?", hint: "e.g. useEffect cleanup finally clicked" },
  { key: "ti", label: "Tech · what to improve?", hint: "e.g. read error stacks from the bottom" },
  { key: "sh", label: "Non-tech · what went well?", hint: "e.g. asked for help early" },
  { key: "si", label: "Non-tech · what to improve?", hint: "e.g. sleep before midnight" },
];

const EMPTY: Answers = { th: "", ti: "", sh: "", si: "" };
const zoneName = (id: ZoneId) => {
  const z = ZONES.find((x) => x.id === id)!;
  return z.a === "Stretch" ? `Stretch, ${z.b}` : `${z.a} ${z.b}`;
};

export function TonightCard({
  dateLabel,
  nowSec,
  sent,
  onSend,
}: {
  dateLabel: string;
  nowSec: number;
  sent?: Night;
  onSend: (zone: ZoneId, answers: Answers) => Promise<void>;
}) {
  const [zone, setZone] = useState<ZoneId | null>(null);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [sending, setSending] = useState(false);
  const open = nowSec >= OPENS_AT;
  const filled = Object.values(answers).filter((s) => s.trim()).length;
  const ready = answersComplete(answers);

  const step = sent ? "Done for tonight" : zone ? "Step 2 of 2 · Answer all four" : "Step 1 of 2 · Pick a mood";

  const send = async () => {
    if (!zone || !ready || sending) return;
    setSending(true);
    try {
      await onSend(zone, { th: answers.th.trim(), ti: answers.ti.trim(), sh: answers.sh.trim(), si: answers.si.trim() });
      setZone(null);
      setAnswers(EMPTY);
    } catch {
      /* the page shows the error; keep what they wrote */
    } finally {
      setSending(false);
    }
  };

  const left = Math.max(0, OPENS_AT - nowSec);
  const rough = sent?.zone === "stretch-overwhelmed" || sent?.zone === "panic";

  return (
    <div className="p-6 sm:px-7">
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <span className="rounded-full bg-l-ink px-2.5 py-1 text-[12px] font-semibold text-l-card">Tonight · {dateLabel}</span>
        <span className={`text-[12.5px] font-semibold ${sent ? "text-l-green" : "text-l-ink3"}`}>{step}</span>
      </div>

      {sent ? (
        <div className="flex items-center gap-3.5">
          {sent.zone && <BarometerFace zone={sent.zone} size={52} />}
          <div>
            <div className="text-[19px] font-semibold tracking-tight">Sent. See you tomorrow.</div>
            <div className="mt-0.5 text-[13px] text-l-ink2">
              {rough ? "A TA will reach out. You don't have to figure it out alone." : "Your TAs read every reflection."}
            </div>
          </div>
        </div>
      ) : zone ? (
        <>
          <div className="flex items-center gap-3">
            <BarometerFace zone={zone} size={40} />
            <div className="flex-1">
              <div className="text-[13px] text-l-ink3">You picked</div>
              <div className="text-[17px] font-semibold">{zoneName(zone)}</div>
            </div>
            <button type="button" onClick={() => setZone(null)} className="rounded-full bg-l-sub px-3.5 py-2 text-[13px] font-semibold hover:bg-l-hair">
              Change
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUESTIONS.map((q) => (
              <label key={q.key} className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-l-ink2">
                {q.label}
                <textarea
                  rows={2}
                  value={answers[q.key]}
                  placeholder={q.hint}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                  className="resize-none rounded-xl bg-l-sub px-3 py-2.5 text-[13.5px] font-normal text-l-ink outline-none ring-1 ring-l-hair placeholder:text-l-ink3 focus:ring-2 focus:ring-l-ink"
                />
              </label>
            ))}
          </div>
          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            <span className="flex-1 text-[12.5px] text-l-ink3" aria-live="polite">
              {ready ? "All four answered. Ready to send." : `${filled} of 4 answered. Answer all four to send.`}
            </span>
            <button
              type="button"
              onClick={send}
              disabled={!ready || sending}
              className="rounded-full bg-l-ink px-5 py-2.5 text-[14px] font-semibold text-l-card transition disabled:opacity-35"
            >
              {sending ? "Sending…" : "Send reflection"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-[21px] font-semibold tracking-tight">How was today?</div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {ZONES.map((z) => (
              <button
                key={z.id}
                type="button"
                disabled={!open}
                aria-label={zoneName(z.id)}
                onClick={() => setZone(z.id)}
                className="flex flex-col items-center gap-2 rounded-[18px] bg-l-sub px-2 pb-3 pt-3.5 transition enabled:hover:-translate-y-0.5 enabled:hover:ring-2 enabled:hover:ring-l-hair disabled:opacity-60 disabled:saturate-[.65]"
              >
                <BarometerFace zone={z.id} />
                <span className="text-center text-[13px] font-semibold leading-tight">
                  {z.a}
                  <span className="block text-[11.5px] font-normal text-l-ink3">{z.b}</span>
                </span>
              </button>
            ))}
          </div>
          {open ? (
            <p className="mt-3.5 text-[12.5px] text-l-ink3">Pick a face, then answer all four questions. About 3 minutes.</p>
          ) : (
            <div className="mt-3.5 flex items-center gap-2.5 rounded-[14px] bg-l-sub px-3.5 py-3 text-[13px] text-l-ink2">
              <Lock className="h-4 w-4" strokeWidth={1.5} />
              <span>{`Opens at 16:45 · in ${Math.floor(left / 3600)}h ${Math.ceil((left % 3600) / 60)}m.`}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
