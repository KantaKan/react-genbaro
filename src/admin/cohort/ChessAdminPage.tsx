import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useAdminHeader } from "../shell/AdminShell";
import { useCohort } from "../shell/useCohort";
import { cohortApi } from "./api";
import { chessApi } from "@/learner/chess/api";
import { ChessPage } from "@/learner/chess/ChessPage";

const box = "rounded-2xl p-5 shadow-[0_0_0_1px_var(--l-hair)]";

export function ChessAdminPage() {
  const [cohort] = useCohort();
  const qc = useQueryClient();
  const q = useQuery(["admin-settings", cohort], () => cohortApi.settings(cohort));
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  useAdminHeader({ title: "Team chess", context: `JSD${cohort}` });
  const on = !!q.data?.chess_enabled;

  const toggle = async (v: boolean) => {
    if (!q.data || busy) return;
    setBusy(true);
    try {
      await cohortApi.saveSettings(cohort, { ...q.data, chess_enabled: v });
      toast.success(v ? "Team chess is on. The first game starts within a minute." : "Team chess is off. The game is paused.");
      qc.invalidateQueries(["admin-settings", cohort]);
      qc.invalidateQueries(["chess"]);
    } catch {
      toast.error("Couldn't save");
    } finally {
      setBusy(false);
    }
  };
  const end = async () => {
    try {
      await chessApi.end(cohort);
      toast.success("Game ended as a draw. A new one starts within a minute.");
      qc.invalidateQueries(["chess"]);
    } catch {
      toast.error("Couldn't end the game");
    } finally {
      setSure(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      <section className={`${box} max-w-[920px]`}>
        <label className="flex items-center gap-3">
          <span className="flex-1">
            <b className="block text-body font-semibold">Play team chess in JSD{cohort}</b>
            <small className="text-xs text-l-ink3">
              One slow game for the whole cohort, white vs black by GenMate group. A random teammate moves each turn, with 4 working hours (09:00–21:00) to play. Turning it off pauses the game.
            </small>
          </span>
          <Switch checked={on} disabled={!q.data || busy} onCheckedChange={toggle} aria-label="Team chess" />
        </label>
        {on && (
          <div className="mt-3 flex items-center gap-2 border-t border-l-hair pt-3">
            <span className="flex-1 text-small text-l-ink3">Ending counts as a draw and a new game starts with fresh teams.</span>
            {sure ? (
              <>
                <button type="button" onClick={end} className="rounded-full bg-red-600 px-3 py-1.5 text-small font-semibold text-white">
                  End as a draw
                </button>
                <button type="button" onClick={() => setSure(false)} className="rounded-full px-3 py-1.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
                  Keep playing
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setSure(true)} className="rounded-full px-3 py-1.5 text-small font-semibold shadow-[0_0_0_1px_var(--l-hair)]">
                End this game
              </button>
            )}
          </div>
        )}
      </section>
      {on && <ChessPage cohort={cohort} />}
    </div>
  );
}
