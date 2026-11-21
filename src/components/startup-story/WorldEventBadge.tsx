import type { StartupRun } from "@/application/services/startupStoryService";
import { ui, worldEvents } from "./startupStoryCatalog";

export function WorldEventBadge({ run }: { run: StartupRun }) {
  const event = run.world_event ? worldEvents[run.world_event] : undefined;
  if (!event) return null;
  return <span className={`${ui.chip} bg-[#cab2f1]`} title={event.desc}>{event.name}</span>;
}
