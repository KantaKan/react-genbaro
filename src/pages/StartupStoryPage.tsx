import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { startupStoryService, type StartupOverview, type StartupResult, type StartupRun } from "@/application/services/startupStoryService";
import { fireConfetti } from "@/lib/confetti";
import { DevPhase, FounderPick, Hub, Lobby, ReviewDialog, RunEnd } from "@/components/startup-story/StartupStoryScreens";

const KEY = "startup-story";

function errorMessage(error: unknown) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Something went wrong, please try again.";
}

export default function StartupStoryPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(KEY, async () => {
    const overview = await startupStoryService.overview();
    return { ...overview, clockOffset: Date.parse(overview.server_time) - Date.now() };
  });
  const [result, setResult] = useState<StartupResult | null>(null);
  const [endedRun, setEndedRun] = useState<StartupRun | null>(null);
  const [actionError, setActionError] = useState("");

  const action = useMutation((call: () => Promise<StartupRun>) => call(), {
    onMutate: () => setActionError(""),
    onSuccess: (run) => {
      queryClient.setQueryData<(StartupOverview & { clockOffset: number }) | undefined>(KEY, (old) => old && { ...old, run: run.status === "active" ? run : null });
    },
    onError: (err: { response?: { status?: number } }) => {
      setActionError(errorMessage(err));
      if (err?.response?.status === 409) void refetch();
    },
  });

  const ship = () => action.mutate(startupStoryService.ship, {
    onSuccess: (run) => {
      if (run.last_result) {
        setResult(run.last_result);
        if (run.last_result.total >= 32) fireConfetti();
      }
      if (run.status === "ended") setEndedRun(run);
    },
  });

  if (isLoading) return <p className="p-6 font-bold">Loading your startup...</p>;
  if (error || !data) return <p className="p-6 font-bold">{errorMessage(error)}</p>;

  const run = data.run;
  const pending = action.isLoading;

  let screen;
  if (endedRun && !result) screen = <RunEnd run={endedRun} onDone={() => setEndedRun(null)} />;
  else if (!run) screen = <Lobby fame={data.studio.fame} pending={pending} onStart={() => action.mutate(() => startupStoryService.startRun("free"))} />;
  else if (run.stage === "founder") screen = <FounderPick offer={run.founder_offer ?? []} pending={pending} onPick={(i) => action.mutate(() => startupStoryService.pickFounder(i))} />;
  else if (run.stage === "developing") screen = <DevPhase key={run.project?.started_at} run={run} clockOffset={data.clockOffset} pending={pending} onShip={ship} />;
  else screen = <Hub key={run.project_index} run={run} types={data.types} themes={data.themes} pending={pending} onStart={(type, theme) => action.mutate(() => startupStoryService.startProject(type, theme, []))} />;

  return <main className="mx-auto w-full max-w-3xl space-y-4 p-4">
    {actionError && <p role="alert" className="rounded-2xl border-2 border-[#292542] bg-[#f7c6d9] p-3 text-sm font-bold text-[#292542]">{actionError}</p>}
    {screen}
    {result && <ReviewDialog result={result} onClose={() => setResult(null)} />}
  </main>;
}
