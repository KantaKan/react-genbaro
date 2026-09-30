import type { ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { LAWN_ACTIONS, LAWN_ZONES, type LawnActivity, type LawnPlan, type LawnZone } from "@/lib/lawn-planner";
import { LawnCharacter, type LawnCardActions } from "./LawnCharacter";

const zoneLabels: Record<LawnZone, string> = { picnic: "โต๊ะปิกนิก", bench: "ม้านั่งอุ่น ๆ", play: "ลานเล่น" };
const variantEmoji: Record<string, string> = { handhold: "🤝", pillow: "☁️", "paper-sword": "📜", chase: "💨" };

function ZoneScenery({ zone }: { zone: LawnZone }) {
  if (zone === "picnic") return <svg aria-hidden="true" viewBox="0 0 160 60" className="mx-auto h-12 w-40 text-card-foreground"><rect x="14" y="16" width="132" height="14" rx="4" fill="#f4bd80" stroke="currentColor" strokeWidth="3" /><path d="M20 23 H140" stroke="#fffaf0" strokeWidth="4" strokeDasharray="10 10" /><path d="M32 30 L24 56 M128 30 L136 56" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>;
  if (zone === "bench") return <svg aria-hidden="true" viewBox="0 0 160 60" className="mx-auto h-12 w-40 text-card-foreground"><rect x="12" y="14" width="136" height="8" rx="3" fill="#b98b67" stroke="currentColor" strokeWidth="3" /><rect x="12" y="28" width="136" height="9" rx="3" fill="#caa07b" stroke="currentColor" strokeWidth="3" /><path d="M26 37 V56 M134 37 V56" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 160 60" className="mx-auto h-12 w-40 text-card-foreground"><ellipse cx="80" cy="40" rx="70" ry="15" fill="#f1dfb3" stroke="currentColor" strokeWidth="3" /><circle cx="118" cy="30" r="9" fill="#f48670" stroke="currentColor" strokeWidth="3" /><path d="M36 38 q8 -12 16 0" fill="none" stroke="#57866c" strokeWidth="3" /></svg>;
}

function activityLabel(activity: LawnActivity) {
  return `${activity.members.map((member) => member.name).join(" กับ ")} · ${LAWN_ACTIONS[activity.action].label}`;
}

export function LawnScene({ plan, userId, cardActions }: { plan: LawnPlan; userId?: string | null; cardActions: (entry: ShowcaseEntry) => LawnCardActions }) {
  return <div aria-label="เพื่อนบนลานตอนนี้" role="group" className="grid gap-4 pt-2 lg:grid-cols-3">
    {LAWN_ZONES.map((zone) => {
      const activities = plan.activities.filter((activity) => activity.zone === zone);
      return <section key={zone} aria-label={zoneLabels[zone]} data-zone={zone} className="rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-[1px]">
        <h3 className="text-center font-register-heading text-base text-card-foreground">{zoneLabels[zone]}</h3>
        <ZoneScenery zone={zone} />
        <ul className="mt-2 flex min-h-36 flex-wrap items-end justify-center gap-x-1 gap-y-3">
          {activities.map((activity) => {
            const emoji = (activity.variant && variantEmoji[activity.variant]) || LAWN_ACTIONS[activity.action].emoji;
            return <li key={activity.id} aria-label={activityLabel(activity)} data-activity={activity.action} className="relative flex items-end">
              {activity.members.map((entry) => {
                const placement = plan.placements.find((item) => item.entry.owner_id === entry.owner_id);
                return <LawnCharacter key={entry.owner_id} entry={entry} action={activity.action} variant={activity.variant} facing={placement?.facing} mine={entry.owner_id === userId} {...cardActions(entry)} />;
              })}
              {emoji && <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 text-lg">{emoji}</span>}
            </li>;
          })}
        </ul>
      </section>;
    })}
  </div>;
}
