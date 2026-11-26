import { useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AttendanceStatusType } from "@/domain/types/attendance";
import { useMarkWithUndo, type Who } from "../learner/useMarkWithUndo";
import type { SessionCell } from "../types";
import { STATUS_LABEL, statusChip } from "../ui/status";

const GLYPH: Record<string, string> = { present: "✓", late: "L", absent: "A", absent_excused: "E", late_excused: "E", holiday: "–", no_class: "–", "": "" };
const OPTIONS: [string, AttendanceStatusType][] = [
  ["Present", "present"],
  ["Late", "late"],
  ["Excused", "absent_excused"],
  ["Absent", "absent"],
];
const dayLabel = (d: string) => new Date(`${d}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", timeZone: "Asia/Bangkok" });

/** One session's status; click to change it (with undo). */
export function CellChip({ l, cell, date, session, label }: { l: Who; cell: Pick<SessionCell, "status">; date: string; session: "morning" | "afternoon"; label?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const mark = useMarkWithUndo();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${dayLabel(date)} ${session}: ${STATUS_LABEL[cell.status]}`}
          className={`${label ? "inline-flex h-[22px] items-center gap-1 px-2" : "grid h-6 w-[34px] place-items-center"} rounded-[7px] text-micro font-bold transition-transform hover:scale-105 ${statusChip(cell.status)}`}
        >
          {label ?? GLYPH[cell.status] ?? ""}
        </button>
      </PopoverTrigger>
      <PopoverContent className="learner w-40 rounded-xl border-0 bg-l-card p-1 text-l-ink shadow-[0_0_0_1px_var(--l-hair),0_12px_30px_-16px_rgba(0,0,0,.35)]">
        <div role="menu" aria-label="Set status">
          {OPTIONS.map(([t, s]) => (
            <button
              key={s}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                mark({ learner: l, cell: cell as SessionCell, session, date, status: s });
              }}
              className="flex w-full rounded-lg px-2.5 py-1.5 text-left text-body hover:bg-l-sub"
            >
              {t}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
