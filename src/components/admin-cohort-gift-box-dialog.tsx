import { lazy, Suspense, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Gift, Users } from "lucide-react";
import { toast } from "sonner";
import { cosmeticService } from "@/application/services/cosmeticService";
import { giftBoxService, type CohortGiftBoxResult } from "@/application/services/giftBoxService";
import { SeedlingPlant } from "@/components/streak-components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CosmeticRarity } from "@/domain/types";
import { resolvePlantAppearance } from "@/lib/plant-appearance";

const GenmateField = lazy(() => import("@/components/farm/GenmateField").then((module) => ({ default: module.GenmateField })));

const rarityRank: Record<CosmeticRarity, number> = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
const disclosedOdds: Record<CosmeticRarity, string> = {
  Common: "Common 55% · Rare 30% · Epic 12% · Legendary 3%",
  Rare: "Rare 66.7% · Epic 26.7% · Legendary 6.6%",
  Epic: "Epic 80% · Legendary 20%",
  Legendary: "Legendary 100%",
};

export function AdminCohortGiftBoxDialog({ cohort, learnerCount }: { cohort: number; learnerCount: number }) {
  const [open, setOpen] = useState(false);
  const [rarity, setRarity] = useState<CosmeticRarity>("Rare");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [batchKey, setBatchKey] = useState("");
  const [result, setResult] = useState<CohortGiftBoxResult>();
  const [sending, setSending] = useState(false);
  const catalog = useQuery(["plantCosmeticCatalog"], cosmeticService.getCatalog, { enabled: open });
  const eligible = useMemo(() => (catalog.data ?? []).filter((item) =>
    !item.starter && item.reward_pools.includes("teacher-box") && rarityRank[item.rarity] >= rarityRank[rarity]
  ), [catalog.data, rarity]);
  const selected = eligible.find((item) => item.id === selectedId) ?? eligible[0];
  const cosmetics = selected ? { [selected.slot]: selected.preview_value } : {};
  const appearance = resolvePlantAppearance({ userId: "cohort-gift-preview", tier: 9, active: true, cosmetics });

  const handleOpen = (next: boolean) => {
    setOpen(next);
    if (next && !batchKey) setBatchKey(crypto.randomUUID());
    if (!next) { setBatchKey(""); setResult(undefined); }
  };

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const response = await giftBoxService.grantCohort(cohort, rarity, message.trim(), batchKey);
      setResult(response);
      if (response.failures.length === 0) toast.success(`Gift boxes ready for ${response.total} learners`);
      else toast.warning(`${response.failures.length} learners still need a retry`);
    } catch {
      toast.error("Cohort gift boxes couldn't be processed. Retry keeps successful grants safe.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild><Button disabled={cohort <= 0 || learnerCount === 0} className="gap-2"><Gift className="h-4 w-4" /> Gift cohort</Button></DialogTrigger>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader><DialogTitle>Preview a gift for Cohort {cohort}</DialogTitle></DialogHeader>
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Minimum rarity</Label><Select value={rarity} onValueChange={(value) => { setRarity(value as CosmeticRarity); setSelectedId(undefined); }}><SelectTrigger aria-label="Cohort minimum rarity"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(rarityRank).map((value) => <SelectItem key={value} value={value}>{value} or better</SelectItem>)}</SelectContent></Select></div>
              <div className="rounded-xl border p-3"><p className="flex items-center gap-2 font-medium"><Users className="h-4 w-4" /> {learnerCount} learners</p><p className="mt-1 text-xs text-muted-foreground">One durable box each</p></div>
            </div>
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{disclosedOdds[rarity]}</p>
            <div className="space-y-2"><Label htmlFor="cohort-gift-message">Message to every learner</Label><Textarea id="cohort-gift-message" maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Your cohort brought generous energy to this sprint…" /></div>
            <div><p className="mb-2 text-sm font-medium">Eligible pool</p><div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto">{eligible.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`rounded-full border px-3 py-1.5 text-sm ${selected?.id === item.id ? "border-emerald-600 bg-emerald-50" : ""}`}>{item.name} <Badge variant="outline" className="ml-1">{item.rarity}</Badge></button>)}</div></div>
            {result && <div className="rounded-xl border bg-muted/40 p-3 text-sm"><p>{result.created} created · {result.existing} already safe · {result.failures.length} failed</p>{result.failures.length > 0 && <p className="mt-1 text-destructive">Retry to process only the remaining learners.</p>}</div>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-emerald-50 p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wider">2D preview</p><div className="flex h-64 items-center justify-center"><SeedlingPlant appearance={appearance} showParticles className="h-48 w-40" /></div></div>
            <div className="rounded-2xl border bg-sky-50 p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wider">3D preview</p><Suspense fallback={<div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">Growing 3D preview…</div>}><GenmateField members={[{ id: "preview", name: selected?.name ?? "Gift preview", appearance, displayStreakDays: 100 }]} /></Suspense></div>
          </div>
        </div>
        <DialogFooter><Button onClick={send} disabled={sending || !message.trim() || eligible.length === 0}>{sending ? "Processing…" : result?.failures.length ? "Retry failed grants" : `Send ${learnerCount} gift boxes`}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
