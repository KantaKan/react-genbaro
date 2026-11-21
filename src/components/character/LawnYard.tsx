import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import type { ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { supportsCssAnimation } from "@/hooks/use-lawn-device";
import { sceneScale, YARD_SCENE_IDS, YARD_SCENES, type YardPose, type YardScene, type YardSceneId } from "@/lib/lawn-scenes";
import { activeVisit, type CatPlacement, type LawnPlan, type YardPlacement } from "@/lib/lawn-planner";
import { BaroCharacterArt } from "./BaroCharacterArt";
import { LawnCardSurface, type LawnCardActions } from "./LawnCharacter";
import { CatArt, Fireflies, HeldItem, YardBackdrop, YardFronts, YardTint } from "./LawnYardArt";

const puppetAction: Record<YardPose, { action: string; variant?: string }> = {
  sit: { action: "bench-sit" }, eat: { action: "meal" }, read: { action: "idle" }, doze: { action: "rest" }, walk: { action: "walk" },
  wave: { action: "wave" }, smile: { action: "smile" }, handhold: { action: "high-five", variant: "handhold" }, rps: { action: "rps" },
  pillow: { action: "play", variant: "pillow" }, chase: { action: "play", variant: "chase" }, kick: { action: "play", variant: "chase" },
};
const gesturePoses = new Set<YardPose>(["eat", "wave", "rps", "pillow", "kick", "handhold"]);
const emoteAction: Record<string, { action: string; variant?: string; emoji: string }> = {
  wave: { action: "wave", emoji: "👋" }, dance: { action: "dance", emoji: "💃" }, jump: { action: "jump", emoji: "🦘" },
  heart: { action: "smile", emoji: "💗" }, nap: { action: "rest", emoji: "😴" }, visit: { action: "high-five", variant: "high-five", emoji: "🙌" },
};
const itemPosition: Record<string, string> = {
  ball: "bottom-[-2%] left-[62%] w-[34%]",
  book: "left-[22%] top-[56%] w-[56%]",
  pillow: "left-[68%] top-[40%] w-[42%]",
  onigiri: "left-[68%] top-[48%] w-[26%]",
  milk: "left-[68%] top-[48%] w-[26%]",
};

function percent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function YardCharacter({ placement, scene, mine, greeted, motion, windowIndex, actions, onFocusScroll }: { placement: YardPlacement; greeted: boolean; scene: YardScene; mine: boolean; motion: boolean; windowIndex: number; actions: LawnCardActions; onFocusScroll: (element: HTMLElement) => void }) {
  const { entry, spot, pose, item, facing, activity } = placement;
  const height = 120 * sceneScale(scene, spot.y);
  const width = height * (220 / 280);
  const emote = (entry.emote && entry.emote_until && Date.parse(entry.emote_until) > Date.now() ? emoteAction[entry.emote] : undefined) ?? (greeted ? emoteAction.visit : undefined);
  const highFive = emote?.action === "high-five";
  const lying = !highFive && pose === "doze" && spot.kind !== "bench";
  const seated = !highFive && !lying && (spot.kind === "table" || spot.kind === "bench" || spot.kind === "blanket" || (spot.kind === "tree" && pose === "read"));
  const drop = seated ? height * 0.12 : 0;
  const { action, variant } = emote ?? puppetAction[pose];
  return <LawnCardSurface
    entry={entry}
    actions={actions}
    anchorClassName={`yard-settle group absolute -translate-x-1/2 -translate-y-full ${entry.hidden ? "opacity-50" : ""}`}
    anchorStyle={{ left: percent(spot.x, scene.width), top: percent(spot.y + drop, scene.height), width: percent(width, scene.width), zIndex: Math.round(spot.y) }}
    anchorData={{ "data-mine": String(mine), "data-spot": spot.id, "data-window": String(windowIndex) }}
    renderTrigger={(open) => <>
      <button type="button" aria-label={`${entry.name} · ${activity}`} onClick={actions.onPick ?? open} onFocus={(event) => onFocusScroll(event.currentTarget)} data-action={action} data-variant={variant} data-pose={pose} data-motion={motion ? "full" : "reduced"}
        className="baro-puppet relative block w-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className={`baro-art block ${lying ? "yard-lie" : ""} ${seated ? "yard-seated" : ""}`} style={{ aspectRatio: "220 / 280" }}>
          <span className={`block h-full w-full ${facing === "left" ? "-scale-x-100" : ""}`}><BaroCharacterArt dna={entry.character.dna} id={`yard-${scene.id}-${spot.id}-${entry.character.id}`} prop={entry.prop} armsFront={Boolean(emote) || gesturePoses.has(pose)} /></span>
        </span>
        {item && !highFive && <span className={`pointer-events-none absolute block ${itemPosition[item]} ${facing === "left" && (item === "onigiri" || item === "milk" || item === "pillow") ? "!left-[4%]" : ""}`}><HeldItem item={item} /></span>}
        {emote && <span aria-hidden="true" className={`yard-emote pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 rounded-full border-2 border-[#292542] bg-[#fffaf0] px-1.5 text-base leading-7 shadow-[2px_2px_0_#292542] ${entry.emote === "heart" ? "yard-emote-float" : ""}`}>{emote.emoji}</span>}
        {(pose === "doze" || entry.emote === "nap") && <span aria-hidden="true" className="yard-zz pointer-events-none absolute -top-2 right-0 text-sm font-black text-card-foreground">z<sup>z</sup></span>}
      </button>
      <span aria-hidden="true" className={`pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold shadow-sm transition-opacity ${mine ? "border-primary bg-primary text-primary-foreground opacity-100" : "border-border bg-card text-card-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"}`}>{mine ? `คุณ · ${entry.name}` : entry.name}</span>
    </>}
  />;
}

function YardCat({ placement, scene, motion, onFocusScroll }: { placement: CatPlacement; scene: YardScene; motion: boolean; onFocusScroll: (element: HTMLElement) => void }) {
  const [petted, setPetted] = useState(0);
  const scale = sceneScale(scene, placement.y);
  const curled = placement.pose === "loaf" || placement.pose === "lap";
  const width = (curled ? 78 : 58) * scale;
  const y = placement.pose === "lap" ? placement.y + 26 * scale : placement.y;
  useEffect(() => {
    if (!petted) return;
    const timer = window.setTimeout(() => setPetted(0), 1600);
    return () => window.clearTimeout(timer);
  }, [petted]);
  return <button type="button" aria-label={`ลูบแมว ${placement.cat.name}`} onClick={() => setPetted(Date.now())} onFocus={(event) => onFocusScroll(event.currentTarget)} data-motion={motion ? "full" : "reduced"} data-cat-pose={placement.pose}
    className="yard-cat yard-settle absolute -translate-x-1/2 -translate-y-full rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    style={{ left: percent(placement.x, scene.width), top: percent(y, scene.height), width: percent(width, scene.width), zIndex: Math.round(y) + (placement.pose === "lap" ? 2 : 0) }}>
    <CatArt pose={placement.pose} coat={placement.cat.coat} />
    {petted > 0 && <span role="status" className="yard-heart pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card px-2 py-0.5 text-[11px] font-bold text-card-foreground shadow-sm">💗 เหมียว~</span>}
  </button>;
}

export function YardScenePicker({ value, onChange }: { value: YardSceneId; onChange: (scene: YardSceneId) => void }) {
  return <div role="group" aria-label="เลือกฉากลาน" className="flex flex-wrap gap-1 rounded-full border border-input bg-background p-1">
    {YARD_SCENE_IDS.map((id) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)} className={`min-h-8 rounded-full px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${value === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>{YARD_SCENES[id].name}</button>)}
  </div>;
}

export function LawnYard({ plan, scene, userId, lite, cardActions }: { plan: LawnPlan; scene: YardScene; userId?: string | null; lite: boolean; cardActions: (entry: ShowcaseEntry) => LawnCardActions }) {
  const reducedMotion = useReducedMotion();
  const motion = !reducedMotion && supportsCssAnimation();
  const scroller = useRef<HTMLDivElement>(null);
  const focusScroll = (element: HTMLElement) => element.scrollIntoView?.({ block: "nearest", inline: "center", behavior: motion ? "smooth" : "auto" });
  const greeted = new Set(plan.placements.filter((placement) => placement.partnerId && activeVisit(placement.entry, Date.now()) === placement.partnerId).map((placement) => placement.partnerId!));
  const items = [
    ...plan.placements.map((placement) => ({ x: placement.spot.x, key: `c:${placement.entry.owner_id}:${placement.spot.id}:${plan.windowIndex}`, node: <YardCharacter placement={placement} scene={scene} greeted={greeted.has(placement.entry.owner_id)} mine={placement.entry.owner_id === userId} motion={motion} windowIndex={plan.windowIndex} actions={cardActions(placement.entry)} onFocusScroll={focusScroll} /> })),
    ...plan.cats.map((placement) => ({ x: placement.x + 1, key: `k:${placement.cat.id}:${placement.pose}:${placement.x}:${plan.windowIndex}`, node: <YardCat placement={placement} scene={scene} motion={motion} onFocusScroll={focusScroll} /> })),
  ].sort((a, b) => a.x - b.x);
  useEffect(() => {
    const box = scroller.current;
    const mine = box?.querySelector<HTMLElement>("[data-mine='true']");
    if (box && box.scrollWidth > box.clientWidth) box.scrollLeft = mine ? Math.max(0, mine.offsetLeft - box.clientWidth / 2) : (box.scrollWidth - box.clientWidth) / 2;
  }, [scene.id, plan.windowIndex]);
  return <div ref={scroller} role="group" aria-label={`เพื่อนบนลานตอนนี้ · ${scene.name}`} data-scene={scene.id} data-phase={plan.phase} className="h-full w-full overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] md:flex md:items-center md:justify-center [&::-webkit-scrollbar]:hidden">
    <div className="relative h-full overflow-hidden md:h-auto md:w-[min(100%,calc((100dvh-4rem)*var(--yard-ratio)))]" style={{ aspectRatio: `${scene.width} / ${scene.height}`, "--yard-ratio": scene.width / scene.height } as CSSProperties}>
      <YardBackdrop sceneId={scene.id} phase={plan.phase} width={scene.width} height={scene.height} motion={motion && !lite} />
      <YardFronts sceneId={scene.id} phase={plan.phase} width={scene.width} height={scene.height} />
      {items.map((item) => <span key={item.key}>{item.node}</span>)}
      {plan.phase !== "morning" && !lite && <svg viewBox={`0 0 ${scene.width} ${scene.height}`} className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 900 }} aria-hidden="true"><Fireflies w={scene.width} h={scene.height} n={plan.phase === "night" ? 18 : 10} /></svg>}
      <YardTint phase={plan.phase} />
    </div>
  </div>;
}
