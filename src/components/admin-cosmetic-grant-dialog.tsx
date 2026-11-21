import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Gift, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cosmeticService } from "@/application/services/cosmeticService";
import { SeedlingPlant } from "@/components/streak-components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CosmeticCollectionItem, CosmeticSlot } from "@/domain/types";
import { resolvePlantAppearance, type PlantCosmeticSelection } from "@/lib/plant-appearance";

interface AdminCosmeticGrantDialogProps {
  userId: string;
  learnerName: string;
}

const rarityStyle: Record<CosmeticCollectionItem["rarity"], string> = {
  Common: "border-stone-200 bg-stone-50 text-stone-700",
  Rare: "border-sky-200 bg-sky-50 text-sky-700",
  Epic: "border-violet-200 bg-violet-50 text-violet-700",
  Legendary: "border-amber-200 bg-amber-50 text-amber-800",
};

const emptyItems: CosmeticCollectionItem[] = [];

function previewCosmetics(item: CosmeticCollectionItem | undefined): PlantCosmeticSelection {
  if (!item) return {};
  return { [item.slot as CosmeticSlot]: item.preview_value };
}

export function AdminCosmeticGrantDialog({ userId, learnerName }: AdminCosmeticGrantDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const collection = useQuery(
    ["adminCosmeticCollection", userId],
    () => cosmeticService.getAdminCollection(userId),
    { enabled: open },
  );
  const items = collection.data?.items ?? emptyItems;
  const selected = items.find((item) => item.id === selectedId);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.name, item.slot, item.rarity, item.source_hint].some((value) => value.toLowerCase().includes(term)),
    );
  }, [items, query]);
  const appearance = resolvePlantAppearance({
    userId,
    tier: 9,
    active: true,
    cosmetics: previewCosmetics(selected),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setSelectedId(undefined);
      setMessage("");
    }
  };

  const grant = async () => {
    if (!selected || selected.owned || selected.starter) return;
    if (!message.trim()) {
      toast.error("Add a short message for the learner.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await cosmeticService.grantExact(userId, selected.id, message.trim());
      toast.success(result.granted ? `${selected.name} added to the collection` : `${selected.name} is already owned`);
      setMessage("");
      await collection.refetch();
    } catch {
      toast.error("Couldn't grant this collectible. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const revoke = async () => {
    if (!selected || !selected.owned || selected.starter) return;
    setSubmitting(true);
    try {
      const result = await cosmeticService.revoke(userId, selected.id);
      toast.success(result.revoked ? `${selected.name} removed from the collection` : `${selected.name} was not owned`);
      await collection.refetch();
    } catch {
      toast.error("Couldn't revoke this collectible. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Gift className="h-4 w-4" /> Garden Gift
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" /> Choose a collectible for {learnerName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search collectibles"
                placeholder="Search by name, slot, rarity, or source"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid max-h-[390px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {collection.isLoading && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">Loading the garden shelf…</p>}
              {collection.isError && <p className="col-span-full py-10 text-center text-sm text-destructive">Could not load the collection.</p>}
              {!collection.isLoading && filtered.length === 0 && (
                <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No collectibles match that search.</p>
              )}
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selectedId === item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    selectedId === item.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="outline" className={rarityStyle[item.rarity]}>{item.rarity}</Badge>
                  </div>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{item.slot} · {item.source_hint}</p>
                  <p className="mt-2 text-xs font-medium text-primary">
                    {item.starter ? "Starter item" : item.owned ? "Owned" : "Available to grant"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-amber-50 p-4">
            <div className="flex min-h-36 items-center justify-center rounded-xl bg-white/70">
              <SeedlingPlant appearance={appearance} showParticles className="h-32 w-28" />
            </div>
            {selected ? (
              <div>
                <p className="font-semibold">{selected.name}</p>
                <p className="text-sm text-muted-foreground">{selected.source_hint}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Choose an item to preview it on the plant.</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="cosmetic-grant-message">Message to learner</Label>
              <Textarea
                id="cosmetic-grant-message"
                maxLength={500}
                placeholder="You earned this for trying a thoughtful new approach…"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={!selected || selected.owned || selected.starter}
              />
              <p className="text-right text-xs text-muted-foreground">{message.length}/500</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={revoke}
            disabled={submitting || !selected?.owned || selected?.starter}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Revoke owned item
          </Button>
          <Button
            type="button"
            onClick={grant}
            disabled={submitting || !selected || selected.owned || selected.starter || !message.trim()}
          >
            {submitting ? "Saving…" : "Grant collectible"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
