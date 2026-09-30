import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { startupStoryService, type StartupOverview, type StartupResult, type StartupRun } from "@/application/services/startupStoryService";
import { useAuth } from "@/application/contexts/AuthContext";
import { useUserData } from "@/application/contexts/UserDataContext";
import { fireConfetti } from "@/lib/confetti";
import { bosses, bossThreshold } from "@/components/startup-story/startupStoryCatalog";
import { DevPhase, FounderPick, Hub, ItemDraft, ReviewDialog, RunEnd, type BossOutcome } from "@/components/startup-story/StartupStoryScreens";
import { Lobby } from "@/components/startup-story/StartupStoryLobby";

const KEY = "startup-story";
type OverviewData = StartupOverview & { clockOffset: number };

function errorMessage(error: unknown) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Something went wrong, please try again.";
}

export default function StartupStoryPage() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { userData } = useUserData();
  const { data, isLoading, error, refetch } = useQuery(KEY, async (): Promise<OverviewData> => {
    const overview = await startupStoryService.overview();
    return { ...overview, clockOffset: Date.parse(overview.server_time) - Date.now() };
  });
  const [review, setReview] = useState<{ result: StartupResult; boss?: BossOutcome } | null>(null);
  const [ended, setEnded] = useState<{ run: StartupRun; fameBefore: number } | null>(null);
  const [actionError, setActionError] = useState("");

  const action = useMutation((call: () => Promise<StartupRun>) => call(), {
    onMutate: () => setActionError(""),
    onSuccess: (run) => {
      queryClient.setQueryData<OverviewData | undefined>(KEY, (old) => old && { ...old, run: run.status === "active" ? run : null });
      if (run.status === "ended") {
        setEnded({ run, fameBefore: data?.studio.fame ?? 0 });
        void queryClient.invalidateQueries(KEY);
        void queryClient.invalidateQueries("startup-story-board");
      }
    },
    onError: (err: { response?: { status?: number } }) => {
      setActionError(errorMessage(err));
      if (err?.response?.status === 409) void refetch();
    },
  });

  if (isLoading) return <p className="p-6 font-bold">Loading your startup...</p>;
  if (error || !data) return <p className="p-6 font-bold">{errorMessage(error)}</p>;

  const run = data.run;
  const pending = action.isLoading;
  const skin = data.studio.office_skin;

  const ship = () => {
    if (!run) return;
    const bossId = run.project?.boss;
    const before = run.bosses_passed;
    const act = run.act;
    action.mutate(startupStoryService.ship, {
      onSuccess: (next) => {
        if (next.status === "active") void queryClient.invalidateQueries(KEY);
        if (!next.last_result) return;
        const boss = bossId ? { name: bosses[bossId]?.name ?? bossId, passed: next.bosses_passed > before, threshold: bossThreshold(act) } : undefined;
        setReview({ result: next.last_result, boss });
        if (next.last_result.total >= 32 || next.outcome === "ipo") fireConfetti();
      },
    });
  };

  let screen;
  if (ended && !review) {
    const gain = data.studio.fame - ended.fameBefore;
    const unlocked = data.unlocks.filter((u) => u.fame > ended.fameBefore && u.fame <= data.studio.fame).map((u) => u.name);
    screen = <RunEnd run={ended.run} fameGain={gain > 0 ? gain : null} newUnlocks={unlocked} onDone={() => setEnded(null)} />;
  } else if (!run) {
    screen = <Lobby overview={data} userId={userId} optOut={Boolean(userData?.startup_story_opt_out)} pending={pending} onStart={(mode) => action.mutate(() => startupStoryService.startRun(mode))} />;
  } else if (run.stage === "founder") {
    screen = <FounderPick offer={run.founder_offer ?? []} pending={pending} onPick={(i) => action.mutate(() => startupStoryService.pickFounder(i))} />;
  } else if (run.stage === "developing") {
    screen = <DevPhase key={run.project?.started_at} run={run} items={data.items} skin={skin} clockOffset={data.clockOffset} pending={pending} onShip={ship} />;
  } else if (run.stage === "item") {
    screen = <ItemDraft run={run} items={data.items} pending={pending} onPick={(i) => action.mutate(() => startupStoryService.pickItem(i))} />;
  } else {
    screen = <Hub key={run.project_index} run={run} types={data.types} themes={data.themes} items={data.items} discovered={data.studio.discovered_combos ?? []} skin={skin} pending={pending}
      onStart={(type, theme, staffIds) => action.mutate(() => startupStoryService.startProject(type, theme, staffIds))}
      onHire={(id) => action.mutate(() => startupStoryService.hire(id))}
      onDismiss={(id) => action.mutate(() => startupStoryService.dismiss(id))}
      onAbandon={() => action.mutate(startupStoryService.abandon)} />;
  }

  return <main className="mx-auto w-full max-w-3xl space-y-4 p-4">
    {actionError && <p role="alert" className="rounded-2xl border-2 border-[#292542] bg-[#f7c6d9] p-3 text-sm font-bold text-[#292542]">{actionError}</p>}
    {screen}
    {review && <ReviewDialog result={review.result} boss={review.boss} onClose={() => setReview(null)} />}
  </main>;
}
