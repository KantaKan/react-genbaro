import { useRef } from "react";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import type { AttendanceStatusType } from "@/domain/types/attendance";
import { nicknames } from "@/learner/lib/name";
import { adminApi } from "../api";
import type { Session, SessionCell, TodayView } from "../types";
import { STATUS_LABEL } from "../ui/status";
import { bkkToday } from "../today/time";

type Who = { id: string; first_name: string; zoom_name: string };

/**
 * Marks one session, then offers Undo. Undo uses what the server says was there before
 * (restore it, or delete the new record if there was none), so a stale board can't lose a check-in.
 * One in-flight guard per learner+session, so different learners can be marked back to back.
 */
export function useMarkWithUndo() {
  const busy = useRef(new Set<string>());
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries(["admin-today"]);
    qc.invalidateQueries(["admin-register"]);
  };
  // Show the mark on the Today board right away; the refetch after the save brings the server's version.
  const showNow = (learnerId: string, session: Session, status: AttendanceStatusType) => {
    const saved = qc.getQueriesData<TodayView>(["admin-today"]);
    qc.cancelQueries(["admin-today"]);
    for (const [key, view] of saved) {
      if (!view) continue;
      qc.setQueryData<TodayView>(key, {
        ...view,
        learners: view.learners.map((l) => (l.id === learnerId ? { ...l, [session]: { ...l[session], status, marked_by: "admin" } } : l)),
      });
    }
    return () => saved.forEach(([key, view]) => qc.setQueryData(key, view));
  };
  return async ({ learner, session, date, status, live }: { learner: Who; cell?: SessionCell; session: Session; date: string; status: AttendanceStatusType; live?: boolean }) => {
    if (live && date !== bkkToday()) {
      toast.error("This board is from an earlier day. Refreshing…");
      refresh();
      return;
    }
    const key = `${learner.id}:${date}:${session}`;
    if (busy.current.has(key)) return;
    busy.current.add(key);
    const name = nicknames(learner.zoom_name, learner.first_name);
    const rollback = live ? showNow(learner.id, session, status) : () => {};
    try {
      const { record, previous } = await adminApi.mark({ user_id: learner.id, date, session, status });
      refresh();
      toast(`Marked ${name.th || name.en} ${STATUS_LABEL[status].toLowerCase()}`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              if (previous) await adminApi.restore(record._id, previous);
              else await adminApi.removeRecord(record._id);
              refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Couldn't undo");
            }
          },
        },
      });
    } catch (e) {
      rollback();
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      busy.current.delete(key);
    }
  };
}
