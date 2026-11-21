import { PixelIcon } from "./office/PixelIcon";
import type { StartupItem, StartupRun } from "@/application/services/startupStoryService";
import { rarityStyle, ui } from "./startupStoryCatalog";

export function ItemDraft({ run, items, onPick, pending }: { run: StartupRun; items: StartupItem[]; onPick: (index: number) => void; pending: boolean }) {
  const offer = (run.item_offer ?? []).map((id) => items.find((it) => it.id === id));
  return <section className="space-y-4">
    <h2 className="text-2xl font-black text-foreground">Pick an item</h2>
    <p className="text-sm font-bold text-foreground opacity-80">Items stack for the rest of this run. Cursed ones hit hard both ways.</p>
    <button className={`${ui.button} w-full bg-[#bfe3f7]`} disabled={pending} onClick={() => onPick(-1)}>Skip the item: team retreat to Hua Hin (everyone −25 burnout)</button>
    <div className="grid gap-4 sm:grid-cols-3">
      {offer.map((it, i) => <button key={`${run.item_offer?.[i]}-${i}`} className={`${ui.cardBase} ${it ? rarityStyle[it.rarity] : "bg-white"} space-y-2 p-4 text-left transition hover:-translate-y-1 disabled:opacity-50`} disabled={pending} onClick={() => onPick(i)}>
        <PixelIcon name={it?.icon ?? "gift"} size={4} />
        <p className="text-lg font-black">{it?.name ?? run.item_offer?.[i]}</p>
        {it && <p className="text-xs font-black uppercase tracking-widest">{it.rarity === "cursed" ? "cursed" : it.rarity}</p>}
        {it && <p className="text-sm font-bold">{it.desc}</p>}
      </button>)}
    </div>
  </section>;
}
