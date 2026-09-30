import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { startupStoryService, STARTUP_STORY_QUERY_KEY, type StartupOverview, type StartupResult, type StartupRun } from "@/application/services/startupStoryService";
import { useAuth } from "@/application/contexts/AuthContext";
import { fireConfetti } from "@/lib/confetti";
import { bosses, bossThreshold } from "@/components/startup-story/startupStoryCatalog";
import { DevPhase } from "@/components/startup-story/DevPhase";
import { FounderPick } from "@/components/startup-story/FounderPick";
import { Hub } from "@/components/startup-story/Hub";
import { ItemDraft } from "@/components/startup-story/ItemDraft";
import { ReviewDialog, type BossOutcome } from "@/components/startup-story/ReviewDialog";
import { RunEnd } from "@/components/startup-story/RunEnd";
import { Lobby } from "@/components/startup-story/StartupStoryLobby";

const KEY = STARTUP_STORY_QUERY_KEY;
type OverviewData = StartupOverview & { clockOffset: number };

function errorMessage(error: unknown) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Something went wrong, please try again.";
}

export default function StartupStoryPage() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
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

  const actions = {
    hire: (id: string) => action.mutate(() => startupStoryService.hire(id)),
    dismiss: (id: string) => action.mutate(() => startupStoryService.dismiss(id)),
    abandon: () => action.mutate(startupStoryService.abandon),
  };

  const screenFor = (run: StartupRun) => {
    switch (run.stage) {
      case "founder": return <FounderPick offer={run.founder_offer ?? []} roles={data.roles} pending={pending} onPick={(i) => action.mutate(() => startupStoryService.pickFounder(i))} />;
      case "developing": return <DevPhase key={run.project?.started_at} run={run} items={data.items} skin={skin} clockOffset={data.clockOffset} pending={pending} onShip={ship} />;
      case "item": return <ItemDraft run={run} items={data.items} pending={pending} onPick={(i) => action.mutate(() => startupStoryService.pickItem(i))} />;
      default: return <Hub key={run.project_index} run={run} types={data.types} themes={data.themes} items={data.items} roles={data.roles} discovered={data.studio.discovered_combos ?? []} skin={skin} pending={pending}
        onStart={(type, theme, staffIds) => action.mutate(() => startupStoryService.startProject(type, theme, staffIds))}
        onHire={actions.hire} onDismiss={actions.dismiss} onAbandon={actions.abandon} />;
    }
  };

  let screen;
  if (ended && !review) {
    const gain = data.studio.fame - ended.fameBefore;
    const unlocked = data.unlocks.filter((u) => u.fame > ended.fameBefore && u.fame <= data.studio.fame).map((u) => u.name);
    screen = <RunEnd run={ended.run} fameGain={gain > 0 ? gain : null} newUnlocks={unlocked} onDone={() => setEnded(null)} />;
  } else if (!run) {
    screen = <Lobby overview={data} userId={userId} pending={pending} onStart={(mode) => action.mutate(() => startupStoryService.startRun(mode))} />;
  } else {
    screen = screenFor(run);
  }

  return <main className="mx-auto w-full max-w-3xl space-y-4 p-4">
    {actionError && <p role="alert" className="rounded-2xl border-2 border-[#292542] bg-[#f7c6d9] p-3 text-sm font-bold text-[#292542]">{actionError}</p>}
    {screen}
    {review && <ReviewDialog result={review.result} boss={review.boss} onClose={() => setReview(null)} />}
  </main>;
}
