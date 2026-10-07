import { PixelIcon } from "./office/PixelIcon";
import type { StartupRun } from "@/application/services/startupStoryService";
import { choiceEvents, ui } from "./startupStoryCatalog";

export function EventCard({ run, pending, onPick }: { run: StartupRun; pending: boolean; onPick: (index: number) => void }) {
  const pendingEvent = run.pending_event;
  if (!pendingEvent) return null;
  const info = choiceEvents[pendingEvent.id];
  return <section className="space-y-4">
    <div className={`${ui.card} flex flex-col items-center space-y-1 p-5 text-center`}>
      <PixelIcon name="dice" size={4} />
      <h2 className="text-2xl font-black">{pendingEvent.title ?? info?.title ?? pendingEvent.id}</h2>
      <p className="text-sm font-bold">Something came up mid-project. Pick one.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {pendingEvent.options.map((label, i) => <button key={label} className={`${ui.cardBase} space-y-2 bg-[#fbe39a] p-4 text-left transition hover:-translate-y-1 disabled:opacity-50`} disabled={pending} onClick={() => onPick(i)}>
        <p className="text-lg font-black">{label}</p>
      </button>)}
    </div>
  </section>;
}
