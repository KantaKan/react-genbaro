import { useRef } from "react";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import type { AttendanceStatusType } from "@/domain/types/attendance";
import { nicknames } from "@/learner/lib/name";
import { adminApi } from "../api";
import type { Session, SessionCell } from "../types";
import { STATUS_LABEL } from "../ui/status";

type Who = { id: string; first_name: string; zoom_name: string };

/** Marks one session, then offers Undo: restore the previous status, or delete the new record if there was none. */
export function useMarkWithUndo() {
  const busy = useRef(false);
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries(["admin-today"]);
    qc.invalidateQueries(["admin-register"]);
  };
  return async ({ learner, cell, session, date, status }: { learner: Who; cell: SessionCell; session: Session; date: string; status: AttendanceStatusType }) => {
    if (busy.current) return;
    busy.current = true;
    const name = nicknames(learner.zoom_name, learner.first_name);
    try {
      const rec = await adminApi.mark({ user_id: learner.id, date, session, status });
      refresh();
      const prev = cell.record_id ? (cell.status as AttendanceStatusType) : null;
      toast(`Marked ${name.th || name.en} ${STATUS_LABEL[status].toLowerCase()}`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              if (prev) await adminApi.mark({ user_id: learner.id, date, session, status: prev });
              else if (rec?._id) await adminApi.removeRecord(rec._id);
              refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Couldn't undo");
            }
          },
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      busy.current = false;
    }
  };
}
