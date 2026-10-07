import { PixelIcon } from "@/components/startup-story/office/PixelIcon";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { startupStoryService, STARTUP_STORY_QUERY_KEY, type StartupItem, type StartupOverview, type StartupResult, type StartupRun } from "@/application/services/startupStoryService";
import { useAuth } from "@/application/contexts/AuthContext";
import { fireConfetti } from "@/lib/confetti";
import { bossInfo, passMarkFor, ui } from "@/components/startup-story/startupStoryCatalog";
import { IpoChoice } from "@/components/startup-story/IpoChoice";
import { PerkPick } from "@/components/startup-story/PerkPick";
import { EventCard } from "@/components/startup-story/EventCard";
import { DevPhase } from "@/components/startup-story/DevPhase";
import { FounderPick } from "@/components/startup-story/FounderPick";
import { Hub } from "@/components/startup-story/Hub";
import { ItemDraft } from "@/components/startup-story/ItemDraft";
import { ReviewDialog, type BossOutcome } from "@/components/startup-story/ReviewDialog";
import { RunEnd } from "@/components/startup-story/RunEnd";
import { Hud } from "@/components/startup-story/Hud";
import { PixelOffice, type OfficeReaction } from "@/components/startup-story/PixelOffice";
import { Lobby } from "@/components/startup-story/StartupStoryLobby";

const KEY = STARTUP_STORY_QUERY_KEY;
type OverviewData = StartupOverview & { clockOffset: number };

function newLogLines(log: string[], lastSeen?: string) {
  return lastSeen === undefined ? log : log.slice(log.lastIndexOf(lastSeen) + 1);
}

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
  const [gotItem, setGotItem] = useState<{ item: StartupItem; key: number } | null>(null);
  useEffect(() => {
    if (!gotItem) return;
    const id = window.setTimeout(() => setGotItem(null), 3500);
    return () => window.clearTimeout(id);
  }, [gotItem]);
  const [review, setReview] = useState<{ result: StartupResult; boss?: BossOutcome; news: string[] } | null>(null);
  const [ended, setEnded] = useState<{ run: StartupRun; fameBefore: number } | null>(null);
  const [actionError, setActionError] = useState("");
  const [reaction, setReaction] = useState<OfficeReaction>();

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
    const passMark = passMarkFor(run);
    const lastLine = run.log?.[run.log.length - 1];
    action.mutate(startupStoryService.ship, {
      onSuccess: (next) => {
        if (next.status === "active") void queryClient.invalidateQueries(KEY);
        if (!next.last_result) return;
        const boss = bossId ? { name: bossInfo(bossId, run.oss)?.name ?? bossId, passed: next.bosses_passed > before, threshold: passMark } : undefined;
        setReview({ result: next.last_result, boss, news: newLogLines(next.log ?? [], lastLine) });
        const bad = (boss && !boss.passed) || next.last_result.total < 16 || next.last_result.bugs >= 6;
        setReaction({ kind: bad ? "panic" : "party", key: Date.now() });
        if (next.last_result.total >= 32 || next.outcome === "ipo") fireConfetti();
      },
    });
  };

  const actions = {
    hire: (id: string) => action.mutate(() => startupStoryService.hire(id)),
    buyDesk: () => action.mutate(startupStoryService.buyDesk),
    upgradeDesk: (index: number) => action.mutate(() => startupStoryService.upgradeDesk(index)),
    infra: (kind: string, index?: number, id?: string) => action.mutate(() => startupStoryService.infra(kind, index, id)),
    dismiss: (id: string) => action.mutate(() => startupStoryService.dismiss(id)),
    abandon: () => action.mutate(startupStoryService.abandon),
  };

  const screenFor = (run: StartupRun) => {
    switch (run.stage) {
      case "founder": return <FounderPick offer={run.founder_offer ?? []} roles={data.roles} pending={pending} onPick={(i) => action.mutate(() => startupStoryService.pickFounder(i))} />;
      case "developing": return <DevPhase key={run.project?.started_at} run={run} items={data.items} skin={skin} clockOffset={data.clockOffset} pending={pending} onShip={ship} />;
      case "perk": return <PerkPick run={run} perks={data.perks ?? []} pending={pending} onPick={(i) => action.mutate(() => startupStoryService.pickPerk(i))} />;
      case "event": return <EventCard run={run} pending={pending} onPick={(i) => action.mutate(() => startupStoryService.pickEvent(i))} />;
      case "ipo_choice": return <IpoChoice run={run} pending={pending} onChoose={(keepGoing) => action.mutate(() => startupStoryService.ipoChoice(keepGoing))} />;
      case "item": return <ItemDraft run={run} items={data.items} pending={pending} onPick={(i) => {
        const picked = data.items.find((it) => it.id === run.item_offer?.[i]);
        action.mutate(() => startupStoryService.pickItem(i), { onSuccess: () => { if (picked) setGotItem({ item: picked, key: Date.now() }); } });
      }} />;
      default: return <Hub key={run.project_index} run={run} types={data.types} themes={data.themes} items={data.items} roles={data.roles} perks={data.perks} ratings={data.combo_ratings} discovered={data.studio.discovered_combos ?? []} skin={skin} pending={pending}
        onStart={(type, theme, staffIds) => action.mutate(() => startupStoryService.startProject(type, theme, staffIds))}
        onStartPitch={(pitchIndex, staffIds) => action.mutate(() => startupStoryService.startProjectPitch(pitchIndex, staffIds))}
        onHire={actions.hire} onDismiss={actions.dismiss} onAbandon={actions.abandon}
        deskPrices={data.desk_prices} onBuyDesk={actions.buyDesk} onUpgradeDesk={actions.upgradeDesk}
        infraCatalog={data.infra} onInfra={actions.infra} />;
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

  const inRun = run && !(ended && !review) && run.staff.length > 0;
  const officeStaff = run?.stage === "developing" && run.project ? run.staff.filter((s) => run.project!.staff_ids.includes(s.id)) : run?.staff ?? [];

  return <main className={`ss-game mx-auto w-full space-y-4 p-4 ${inRun ? "max-w-4xl" : "max-w-3xl"}`}>
    {actionError && <p role="alert" className="rounded-2xl border-2 border-[#292542] bg-[#f7c6d9] p-3 text-sm font-bold text-[#292542]">{actionError}</p>}
    {inRun && run
      ? <div className="space-y-4">
          <div className="space-y-3">
            <Hud run={run} items={data.items} />
            <PixelOffice staff={officeStaff} infra={run.infra} items={(run.items ?? []).map((id) => data.items.find((it) => it.id === id)).filter((it): it is StartupItem => Boolean(it))}
              bossVisiting={run.boss_visiting} bossVisits={run.boss_visits} desks={run.desks}
              deskActions={run.stage === "hub" && data.desk_prices ? { money: run.money, act: run.act, prices: data.desk_prices, pending, onUpgrade: actions.upgradeDesk, onBuy: actions.buyDesk } : undefined} deskLimit={run.stage === "hub" ? run.desk_limit : 0} busy={run.stage === "developing"} skin={skin} reaction={reaction} />
          </div>
          <div className="min-w-0">{screen}</div>
        </div>
      : screen}
    {gotItem && <div key={gotItem.key} role="status" className={`ss-sheet fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 p-3 ${ui.card}`}>
      <PixelIcon name={gotItem.item.icon} size={3} />
      <div className="min-w-0">
        <p className="ss-pixel text-xs uppercase tracking-widest">Got it! It's on a desk now</p>
        <p className="font-black">{gotItem.item.name}</p>
        <p className="text-xs font-bold">{gotItem.item.desc}</p>
      </div>
    </div>}
    {review && <ReviewDialog result={review.result} boss={review.boss} news={review.news} oss={run?.oss} onClose={() => setReview(null)} />}
  </main>;
}
