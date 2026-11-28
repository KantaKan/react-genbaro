import type { Night } from "./model";

const dateLabel = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });

/** Every night, oldest first, laid out for paper; only visible when printing. */
export function PrintJournal({ nights }: { nights: Night[] }) {
  const rows: [string, string][] = [];
  return (
    <section data-testid="print-journal" className="hidden text-[11pt] leading-relaxed text-black print:block">
      {[...nights]
        .sort((a, b) => a.day.localeCompare(b.day))
        .map((n) => {
          rows.length = 0;
          if (n.techHappy.trim()) rows.push(["Tech · ได้อะไร", n.techHappy]);
          if (n.techImprove.trim()) rows.push(["Tech · อยากพัฒนา", n.techImprove]);
          if (n.softHappy.trim()) rows.push(["Non-tech · ได้อะไร", n.softHappy]);
          if (n.softImprove.trim()) rows.push(["Non-tech · อยากพัฒนา", n.softImprove]);
          return (
            <article key={n._id || n.day} className="break-inside-avoid border-b border-black/20 py-3">
              <h3 className="font-semibold">{`${dateLabel(n.day)} · ${n.barometer}`}</h3>
              {rows.map(([k, v]) => (
                <p key={k} className="mt-1 whitespace-pre-wrap">
                  <span className="text-black/60">{`${k}: `}</span>
                  {v}
                </p>
              ))}
              {n.reply && <p className="mt-1.5 whitespace-pre-wrap italic">{`${n.replyName ? `TA ${n.replyName}` : "TA"}: ${n.reply}`}</p>}
            </article>
          );
        })}
    </section>
  );
}
