import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { AlertTriangle, CalendarDays, ChevronDown, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TYPE_DOT, TYPE_LABEL, type CalWeek } from "@/calendar/types";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { useStaff } from "../team/useStaff";
import { weekLabel } from "../report/week";
import { calendarApi, type ImportPreview, type WeekDiff } from "./api";

const card = "rounded-2xl p-5 shadow-[0_0_0_1px_var(--l-hair)]";
const field = "w-full rounded-xl bg-l-sub px-3 py-2.5 text-body text-l-ink shadow-[0_0_0_1px_var(--l-hair)] outline-none focus:shadow-[0_0_0_1.5px_var(--l-ink)]";
const errMsg = (e: unknown) => (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Something went wrong";
const dayName = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const countSessions = (w: CalWeek) => w.days.reduce((n, d) => n + d.sessions.filter((s) => s.kind !== "break").length, 0);

const CHIP: Record<WeekDiff["status"], string> = {
  new: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  changed: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  same: "bg-l-sub text-l-ink3",
  removed: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};
const CHIP_LABEL: Record<WeekDiff["status"], string> = { new: "New", changed: "Changed", same: "Same", removed: "Removed" };

function ImportDialog({ cohort, file, onClose, onSaved }: { cohort: number; file: File; onClose: () => void; onSaved: () => void }) {
  const [sheet, setSheet] = useState("");
  const [pv, setPv] = useState<ImportPreview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const saving = useRef(false);

  useEffect(() => {
    let alive = true;
    setPv(null);
    setErr(null);
    calendarApi
      .import(cohort, file, sheet ? { sheet } : {})
      .then((r) => alive && setPv(r))
      .catch((e) => alive && setErr(errMsg(e)));
    return () => {
      alive = false;
    };
  }, [cohort, file, sheet]);

  const save = async () => {
    if (saving.current || !pv?.sheet) return;
    saving.current = true;
    try {
      await calendarApi.import(cohort, file, { sheet: pv.sheet, save: true, version: pv.version });
      toast.success("Calendar saved. Weeks stay hidden until you publish them.");
      onSaved();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      saving.current = false;
    }
  };

  const warns = pv?.warnings.filter((w) => w.level === "warn") ?? [];
  const notes = pv?.warnings.filter((w) => w.level !== "warn") ?? [];
  const touchesPublished = pv?.diff.some((d) => d.published && d.status === "changed");
  const goneWeeks = pv?.diff.filter((d) => d.published && d.status === "removed").map((d) => d.n) ?? [];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="learner max-h-[88vh] max-w-[640px] overflow-y-auto rounded-[22px] border-0 bg-l-card text-l-ink">
        <DialogTitle>Import calendar</DialogTitle>
        <p className="-mt-1 truncate text-xs text-l-ink3">{file.name}</p>

        {!pv && !err && <div className="h-32 animate-pulse rounded-xl bg-l-sub" />}
        {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-body font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">{err}</p>}

        {pv?.needs_sheet && pv.needs_sheet.length > 0 && (
          <label className="block text-xs font-semibold text-l-ink2">
            Which sheet is JSD{cohort}'s calendar?
            <select aria-label={`Which sheet is JSD${cohort}'s calendar?`} value={sheet} onChange={(e) => setSheet(e.target.value)} className={`${field} mt-1.5`}>
              <option value="">Choose a sheet…</option>
              {pv.needs_sheet.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}

        {pv && pv.sheet && (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <b className="text-title font-semibold">
                {pv.weeks} weeks · {pv.sessions} sessions
              </b>
              <span className="text-xs text-l-ink3">from sheet {pv.sheet}</span>
            </div>

            {warns.length > 0 && (
              <div className="rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-500/10">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> {warns.length} thing{warns.length === 1 ? "" : "s"} to check in the file
                </div>
                <ul className="space-y-1 text-small text-amber-900 dark:text-amber-200">
                  {warns.map((w, i) => (
                    <li key={i}>{w.message}</li>
                  ))}
                </ul>
              </div>
            )}
            {notes.length > 0 && (
              <details className="text-xs text-l-ink3">
                <summary className="cursor-pointer font-semibold">{notes.length} more notes</summary>
                <ul className="mt-1.5 space-y-1">
                  {notes.map((w, i) => (
                    <li key={i}>{w.message}</li>
                  ))}
                </ul>
              </details>
            )}

            {goneWeeks.length > 0 && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-small font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300">
                {goneWeeks.length === 1 ? `Week ${goneWeeks[0]} is` : `Weeks ${goneWeeks.join(", ")} are`} published and will disappear for learners if you save.
              </p>
            )}
            {touchesPublished && (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-small font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                Learners can already see this week, so they will see these changes straight away.
              </p>
            )}

            <div>
              <h4 className="mb-1.5 text-body font-semibold">{pv.has_existing ? "What changes" : "Weeks in this file"}</h4>
              <ul className="divide-y divide-[var(--l-hair)] rounded-xl shadow-[0_0_0_1px_var(--l-hair)]">
                {pv.diff.map((d) => (
                  <li key={d.n} className="px-3.5 py-2.5 text-body">
                    <div className="flex items-center gap-2.5">
                      <b className="font-semibold">Week {d.n}</b>
                      <span className={`rounded-full px-2 py-0.5 text-micro font-semibold ${CHIP[d.status]}`}>{CHIP_LABEL[d.status]}</span>
                      {d.published && <span className="text-micro font-medium text-l-ink3">published</span>}
                      <span className="ml-auto text-xs text-l-ink3">
                        {d.status === "new" ? `${d.added} sessions` : d.status === "changed" ? `${d.added} added · ${d.removed} removed` : d.status === "removed" ? `${d.removed} sessions` : ""}
                      </span>
                    </div>
                    {d.lines.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 pl-1 text-xs text-l-ink2">
                        {d.lines.map((l, i) => (
                          <li key={i}>{l}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-body font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
            Cancel
          </button>
          {pv?.sheet && !err && (
            <button type="button" onClick={save} className="rounded-full bg-l-ink px-5 py-2 text-body font-semibold text-l-card">
              Save calendar
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CalendarPage() {
  const [cohort] = useCohort();
  const me = useStaff();
  const canEdit = me.can("cohort_admin");
  const qc = useQueryClient();
  const q = useQuery(["admin-calendar", cohort], () => calendarApi.get(cohort));
  const cal = q.data;
  const [file, setFile] = useState<File | null>(null);
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [zoom, setZoom] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const busy = useRef<Record<string, boolean>>({});
  useEffect(() => setZoom(cal?.zoom_url ?? ""), [cal?.zoom_url]);

  const once = async (key: string, fn: () => Promise<void>) => {
    if (busy.current[key]) return;
    busy.current[key] = true;
    try {
      await fn();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      busy.current[key] = false;
    }
  };
  const refresh = () => qc.invalidateQueries(["admin-calendar"]);

  useAdminHeader({
    title: "Calendar",
    context: `JSD${cohort}`,
    actions:
      canEdit && cal?.imported ? (
        <button type="button" onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)] hover:bg-l-sub">
          <Upload className="h-3.5 w-3.5" /> Import from spreadsheet
        </button>
      ) : undefined,
  });

  const picker = (
    <input
      ref={input}
      aria-label="Calendar spreadsheet"
      type="file"
      accept=".xlsx"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (f) setFile(f);
      }}
    />
  );

  if (q.isLoading) return <div className="h-48 animate-pulse rounded-2xl bg-l-sub" />;
  if (!cal) return <p className="text-sm text-l-ink3">Couldn't load the calendar. Try again in a moment.</p>;

  return (
    <div className="flex max-w-[860px] flex-col gap-3.5">
      {picker}
      {!cal.imported ? (
        <section className={`${card} text-center`}>
          <CalendarDays className="mx-auto h-7 w-7 text-l-ink3" strokeWidth={1.4} />
          <h4 className="mt-2 text-title font-semibold">Import the program calendar</h4>
          <p className="mx-auto mt-1 max-w-[460px] text-body leading-relaxed text-l-ink2">
            Upload the spreadsheet the program team sends. Baro finds JSD{cohort}'s sheet, reads every week, and keeps a clean copy. Learners only see a week after you publish it.
          </p>
          {canEdit ? (
            <button type="button" onClick={() => input.current?.click()} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-l-ink px-5 py-2 text-body font-semibold text-l-card">
              <Upload className="h-3.5 w-3.5" /> Import from spreadsheet
            </button>
          ) : (
            <p className="mt-3 text-xs text-l-ink3">An Admin can import it.</p>
          )}
        </section>
      ) : (
        <>
          <p className="text-xs text-l-ink3">
            From {cal.sheet} · imported{cal.imported_by ? ` by ${cal.imported_by}` : ""}
            {cal.imported_at ? ` on ${new Date(cal.imported_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" })}` : ""}. Weeks stay hidden from learners until you publish them.
          </p>

          <section className={card}>
            <label className="block text-xs font-semibold text-l-ink2">
              Join Zoom link
              <div className="mt-1.5 flex gap-2">
                <input aria-label="Zoom link" value={zoom} onChange={(e) => setZoom(e.target.value)} disabled={!canEdit} placeholder="https://zoom.us/j/…" className={field} />
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      once("zoom", async () => {
                        await calendarApi.setZoom(cohort, zoom.trim());
                        toast.success("Zoom link saved");
                        refresh();
                      })
                    }
                    className="shrink-0 rounded-full bg-l-ink px-4 text-small font-semibold text-l-card"
                  >
                    Save link
                  </button>
                )}
              </div>
            </label>
            <small className="mt-1.5 block text-xs text-l-ink3">Shown to learners as the Join Zoom button while a session is on.</small>
          </section>

          <ul className="flex flex-col gap-2">
            {cal.weeks.map((w) => {
              const holidays = w.days.filter((d) => d.holiday).length;
              const open = openWeek === w.n;
              return (
                <li key={w.n} className={`${card} !p-0`}>
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <b className="text-title font-semibold">Week {w.n}</b>
                      <span className="ml-2 text-body text-l-ink2">{weekLabel(w.monday)}</span>
                      <small className="ml-2 text-xs text-l-ink3">
                        {countSessions(w)} sessions{holidays > 0 ? ` · ${holidays} holiday${holidays === 1 ? "" : "s"}` : ""}
                      </small>
                    </div>
                    <button type="button" aria-label={`View week ${w.n}`} aria-expanded={open} onClick={() => setOpenWeek(open ? null : w.n)} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-l-ink2 shadow-[0_0_0_1px_var(--l-hair)]">
                      {open ? "Hide" : "View"} <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    {canEdit ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!w.published}
                        aria-label={`Publish week ${w.n}`}
                        onClick={() =>
                          once(`pub-${w.n}`, async () => {
                            await calendarApi.publish(cohort, w.n, !w.published);
                            refresh();
                          })
                        }
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${w.published ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
                      >
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${w.published ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-l-ink2">{w.published ? "Published" : "Hidden"}</span>
                    )}
                    {canEdit && <span className="w-[68px] text-xs font-medium text-l-ink3">{w.published ? "Published" : "Hidden"}</span>}
                  </div>
                  {open && (
                    <div className="grid gap-3 border-t border-l-hair px-4 py-3 sm:grid-cols-2">
                      {w.days.map((d) => (
                        <div key={d.date}>
                          <div className="mb-1 text-xs font-semibold text-l-ink2">
                            {dayName(d.date)} {d.holiday && <span className="font-medium text-amber-700">· Holiday</span>}
                          </div>
                          <ul className="space-y-1">
                            {d.sessions.map((s, i) => (
                              <li key={i} className="flex gap-2 text-small">
                                <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TYPE_DOT[s.type] ?? TYPE_DOT.other }} title={TYPE_LABEL[s.type]} />
                                <span className="w-[84px] shrink-0 tabular-nums text-l-ink3">
                                  {s.start}–{s.end}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className={s.kind === "break" ? "text-l-ink3" : "font-medium"}>{s.title}</span>
                                  {s.code && <span className="ml-1 text-l-ink3">{s.code}</span>}
                                  {s.facilitators.length > 0 && <span className="block text-l-ink3">{s.facilitators.join(", ")}</span>}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {file && canEdit && (
        <ImportDialog
          cohort={cohort}
          file={file}
          onClose={() => setFile(null)}
          onSaved={() => {
            setFile(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
