import { useState } from "react";
import { useQuery } from "react-query";
import { Check, Gift, Leaf, Lock, PackageOpen, Sparkles } from "lucide-react";
import { cosmeticService } from "@/application/services/cosmeticService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CosmeticCollectionItem, CosmeticRarity, CosmeticSlot } from "@/domain/types";
import { toast } from "sonner";

const SLOTS: Array<{ value: CosmeticSlot | "all"; label: string; symbol: string }> = [
  { value: "all", label: "All", symbol: "🌿" },
  { value: "palette", label: "Colors", symbol: "🎨" },
  { value: "pot", label: "Pots", symbol: "🪴" },
  { value: "aura", label: "Auras", symbol: "✨" },
  { value: "particle", label: "Particles", symbol: "🌟" },
  { value: "accessory", label: "Friends", symbol: "🐞" },
  { value: "mutation", label: "Variants", symbol: "🍃" },
];

const RARITY_STYLES: Record<CosmeticRarity, string> = {
  Common: "border-stone-300 bg-stone-50 text-stone-700 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-200",
  Rare: "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200",
  Epic: "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200",
  Legendary: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100",
};

function CollectionCard({ item, busy, onToggle }: { item: CosmeticCollectionItem; busy: boolean; onToggle: (item: CosmeticCollectionItem) => void }) {
  const slot = SLOTS.find((entry) => entry.value === item.slot);
  return (
    <article
      className={`relative min-h-44 overflow-hidden rounded-[1.4rem] border p-4 transition-transform ${RARITY_STYLES[item.rarity]} ${item.locked ? "grayscale opacity-65" : "hover:-translate-y-1"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl" aria-hidden="true">{slot?.symbol}</span>
        <div className="flex flex-wrap justify-end gap-1">
          {item.new && <Badge className="bg-rose-500 text-white">New</Badge>}
          {item.equipped && <Badge className="gap-1 bg-emerald-600 text-white"><Check className="h-3 w-3" /> Equipped</Badge>}
          {item.locked && <Lock className="h-4 w-4" aria-label="Locked" />}
        </div>
      </div>
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{item.rarity}</p>
        <h3 className="mt-1 font-semibold leading-tight">{item.name}</h3>
        <p className="mt-2 text-xs leading-relaxed opacity-80">{item.source_hint}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {item.reward_pools.map((pool) => (
          <span key={pool} className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] opacity-75">{pool}</span>
        ))}
      </div>
      {item.owned && (
        <Button type="button" size="sm" variant={item.equipped ? "outline" : "default"} className="mt-4 w-full" disabled={busy} onClick={() => onToggle(item)}>
          {item.equipped ? "Unequip" : "Equip"}
        </Button>
      )}
    </article>
  );
}

interface PlantCollectionDialogProps {
  onLoadoutChanged?: () => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PlantCollectionDialog({ onLoadoutChanged, open: controlledOpen, onOpenChange }: PlantCollectionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };
  const [slot, setSlot] = useState<CosmeticSlot | "all">("all");
  const [busyId, setBusyId] = useState<string>();
  const collection = useQuery(["plantCosmeticCollection"], () => cosmeticService.getCollection(), { enabled: open });
  const items = collection.data?.items.filter((item) => slot === "all" || item.slot === slot) ?? [];
  const owned = collection.data?.items.filter((item) => item.owned).length ?? 0;
  const total = collection.data?.items.length ?? 0;

  const toggleEquipped = async (item: CosmeticCollectionItem) => {
    setBusyId(item.id);
    try {
      if (item.equipped) {
        await cosmeticService.unequip(item.slot);
      } else {
        await cosmeticService.equip(item.slot, item.id);
      }
      await collection.refetch();
      await onLoadoutChanged?.();
      toast.success(item.equipped ? `${item.name} put back on the shelf` : `${item.name} equipped`);
    } catch {
      toast.error("Couldn't update your plant. Please try again.");
    } finally {
      setBusyId(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
          <PackageOpen className="h-4 w-4" /> Collection
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden border-emerald-200 bg-gradient-to-b from-emerald-50 via-background to-background p-0 dark:border-emerald-900 dark:from-emerald-950/40">
        <DialogHeader className="border-b border-emerald-200/70 px-5 pb-4 pt-6 text-left dark:border-emerald-900">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                <Leaf className="h-3.5 w-3.5" /> Garden shelf
              </p>
              <DialogTitle className="mt-1 text-2xl">Your plant collection</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">Every find stays with you. Equip one favorite in each slot.</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-center shadow-sm dark:border-emerald-800 dark:bg-black/20">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{owned}/{total}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">collected</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 pt-4">
          <Tabs value={slot} onValueChange={(value) => setSlot(value as CosmeticSlot | "all")}>
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-emerald-100/70 p-1 dark:bg-emerald-950/60">
              {SLOTS.map((entry) => <TabsTrigger key={entry.value} value={entry.value} className="gap-1 whitespace-nowrap">{entry.symbol} {entry.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        </div>

        <div className="max-h-[58vh] overflow-y-auto px-5 pb-6 pt-4">
          {collection.isLoading && <div className="flex min-h-52 items-center justify-center text-sm text-muted-foreground"><Sparkles className="mr-2 h-4 w-4 animate-pulse" /> Opening your garden shelf…</div>}
          {collection.isError && <div className="flex min-h-52 flex-col items-center justify-center text-center"><Gift className="mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">The shelf could not open.</p><p className="text-sm text-muted-foreground">Try again when your connection is ready.</p></div>}
          {!collection.isLoading && !collection.isError && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <CollectionCard key={item.id} item={item} busy={busyId === item.id} onToggle={toggleEquipped} />)}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
