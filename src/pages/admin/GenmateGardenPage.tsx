import { useMemo, useState } from "react";
import { GenmateGarden } from "@/components/genmate-garden";
import { useAdminHeader } from "@/admin/shell/AdminShell";
import { useCohort } from "@/admin/shell/useCohort";

const KEY = "baro-admin-garden-scope";

export function GenmateGardenPage() {
  const [cohort] = useCohort();
  const [all, setAll] = useState(() => {
    try {
      return localStorage.getItem(KEY) === "all";
    } catch {
      return false;
    }
  });
  const pick = (v: boolean) => {
    setAll(v);
    try {
      localStorage.setItem(KEY, v ? "all" : "cohort");
    } catch {
      /* private mode */
    }
  };
  const actions = useMemo(
    () => (
      <div className="inline-flex rounded-[10px] bg-l-sub p-[3px]">
        {([false, true] as const).map((v) => (
          <button key={String(v)} type="button" aria-pressed={all === v} onClick={() => pick(v)} className={`whitespace-nowrap rounded-lg px-3 py-1 text-small font-semibold ${all === v ? "bg-l-card text-l-ink shadow-sm" : "text-l-ink2"}`}>
            {v ? "All cohorts" : `JSD${cohort}`}
          </button>
        ))}
      </div>
    ),
    [all, cohort]
  );
  useAdminHeader({ title: "Garden", context: "Grown through reflection streaks", actions });

  return (
    <div className="mx-auto max-w-[1200px]">
      <GenmateGarden cohort={all || cohort <= 0 ? undefined : String(cohort)} />
    </div>
  );
}
