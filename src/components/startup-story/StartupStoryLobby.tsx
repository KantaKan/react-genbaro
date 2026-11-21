import { PixelIcon } from "./office/PixelIcon";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { STARTUP_STORY_QUERY_KEY, startupStoryService, type StartupBoardTab, type StartupMode, type StartupOverview } from "@/application/services/startupStoryService";
import { actName, baht, ui } from "./startupStoryCatalog";

const boardTabs: { id: StartupBoardTab; label: string; empty: string }[] = [
  { id: "value", label: "Company value", empty: "No companies yet. Start one!" },
  { id: "deepest", label: "Highest stage", empty: "No Weekly Seed runs yet this week. Be the first!" },
  { id: "weekly", label: "Score", empty: "No ranked runs yet this week. Be the first!" },
  { id: "fame", label: "Fame", empty: "No fame yet. Finish a run to get on the board." },
];

function Leaderboard({ userId }: { userId: string | null }) {
  const [tab, setTab] = useState<StartupBoardTab>("deepest");
  const { data, isLoading, error } = useQuery(["startup-story-board", tab], () => startupStoryService.leaderboard(tab));
  return <section className={`${ui.card} space-y-3 p-4`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-xl font-black">Cohort board</h2>
      <div role="tablist" className="flex gap-1">
        {boardTabs.map(({ id, label }) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
          className={`${ui.chipBase} ${tab === id ? "bg-[#292542] text-[#fffaf0]" : "bg-white text-[#292542]"}`}>{label}</button>)}
      </div>
    </div>
    {isLoading && <p className="text-sm font-bold">Loading...</p>}
    {error ? <p className="text-sm font-bold">Couldn't load the board right now.</p> : null}
    {data && data.length === 0 && <p className="text-sm font-bold">{boardTabs.find((b) => b.id === tab)?.empty}</p>}
    {data && data.length > 0 && <ol className="space-y-1">
      {data.map((row, i) => <li key={row.owner_id} className={`flex items-center justify-between rounded-xl border-2 px-3 py-2 text-sm font-bold ${row.owner_id === userId ? "border-[#292542] bg-[#fbe39a]" : "border-transparent"}`}>
        <span className="inline-flex items-center gap-1">{i === 0 ? <PixelIcon name="trophy" size={1.5} label="1st" /> : `${i + 1}.`} {row.name}{row.owner_id === userId ? " (you)" : ""}</span>
        <span>{tab === "value" ? `${baht(row.score ?? 0)} · ${actName(row.max_act ?? 1)}` : tab === "deepest" ? `Act ${row.max_act ?? 1} · ${actName(row.max_act ?? 1)}` : tab === "weekly" ? `${(row.score ?? 0).toLocaleString()}${row.outcome === "ipo" ? " · IPO" : ""}` : `${row.fame ?? 0}`}</span>
      </li>)}
    </ol>}
  </section>;
}

function OptOut({ initial }: { initial: boolean }) {
  const queryClient = useQueryClient();
  const [optOut, setOptOut] = useState(initial);
  const save = useMutation(startupStoryService.setOptOut, {
    onSuccess: (next) => {
      setOptOut(next);
      queryClient.setQueryData<StartupOverview | undefined>(STARTUP_STORY_QUERY_KEY, (old) => (old ? { ...old, opt_out: next } : old));
    },
  });
  return <label className="flex items-start gap-3 text-sm font-bold">
    <input type="checkbox" className="mt-1 h-4 w-4 accent-[#292542]" checked={optOut} disabled={save.isLoading} onChange={(e) => save.mutate(e.target.checked)} />
    <span>Hide me from other genmates' startups<span className="block text-xs opacity-70">Normally your first name can show up as a hireable dev with random stats.</span></span>
  </label>;
}

type LobbyProps = {
  overview: StartupOverview;
  userId: string | null;
  pending: boolean;
  onStart: (mode: StartupMode) => void;
};

export function Lobby({ overview, userId, pending, onStart }: LobbyProps) {
  const { studio, unlocks, ranked_attempts_left: left, opt_out } = overview;
  const next = unlocks.find((u) => u.fame > studio.fame);
  const prev = [...unlocks].reverse().find((u) => u.fame <= studio.fame)?.fame ?? 0;
  const progress = next ? Math.min(100, ((studio.fame - prev) / (next.fame - prev)) * 100) : 100;
  const hall = [...(studio.hall_of_fame ?? [])].reverse().slice(0, 5);

  return <div className="space-y-4">
    <section className={`${ui.card} space-y-4 p-6 text-center`}>
      <PixelIcon name="rocket" size={5} />
      <h1 className="text-3xl font-black tracking-tight">Baro Startup Story</h1>
      <p className="text-sm font-bold opacity-80">Found a startup, hire genmates, beat the bosses, ring the IPO bell. ทุกรอบไม่เหมือนกัน!</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button className={`${ui.button} bg-[#fbe39a]`} disabled={pending || left <= 0} onClick={() => onStart("ranked")}>
          Weekly Seed <span className="opacity-70">({left}/3 left)</span>
        </button>
        <button className={`${ui.button} bg-[#7bc4a8]`} disabled={pending} onClick={() => onStart("free")}>Start your company</button>
      </div>
      <p className="text-xs font-bold opacity-70">Weekly Seed: everyone in your cohort gets the same random run this week ({overview.week_key}).</p>
      <p className="text-xs font-black">{overview.oss_unlocked ? "Secret founder unlocked: Open Source Maintainer. Look for them in your founder picks." : "??? Rumor says a founder only shows up for people who ship tools for other devs…"}</p>
    </section>

    <section className={`${ui.card} space-y-2 p-4`}>
      <div className="flex items-center justify-between text-sm font-black"><span>Fame {studio.fame}</span>{next && <span>Next: {next.name} at {next.fame}</span>}</div>
      <div className="h-3 overflow-hidden rounded-full border-2 border-[#292542] bg-white" role="progressbar" aria-label="Fame to next unlock" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <div className="h-full bg-[#cab2f1]" style={{ width: `${progress}%` }} />
      </div>
      {hall.length > 0 && <div className="pt-2">
        <p className="text-xs font-black uppercase tracking-widest">Hall of fame</p>
        <ul className="mt-1 space-y-1 text-sm font-bold">
          {hall.map((h) => <li key={h.run_id} className="flex justify-between gap-2"><span>{h.outcome === "ipo" ? "IPO · " : ""}{h.founder}{h.mode === "ranked" ? " ·" : ""}</span><span>{h.score.toLocaleString()}</span></li>)}
        </ul>
      </div>}
    </section>

    <Leaderboard userId={userId} />

    <section className={`${ui.card} p-4`}><OptOut key={String(opt_out)} initial={opt_out} /></section>
  </div>;
}
