import { lazy, Suspense, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Gift, Users } from "lucide-react";
import { toast } from "sonner";
import { characterCosmeticService } from "@/application/services/characterCosmeticService";
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
type Pool = "" | "character-box" | "character-egg";

interface Props {
  cohort: number;
  learnerCount: number;
  teams?: string[];
}

export function AdminCohortGiftBoxDialog({ cohort, learnerCount, teams = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [team, setTeam] = useState("");
  const [pool, setPool] = useState<Pool>("character-box");
  const [rarity, setRarity] = useState<CosmeticRarity>("Rare");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [batchKey, setBatchKey] = useState("");
  const [result, setResult] = useState<CohortGiftBoxResult>();
  const [sending, setSending] = useState(false);
  const [locked, setLocked] = useState(false);
  const audience = useQuery(["giftBoxAudience", cohort, team], () => giftBoxService.previewAudience(cohort, team), { enabled: open && cohort > 0, retry: false, staleTime: 0 });
  const plants = useQuery(["plantCosmeticCatalog"], cosmeticService.getCatalog, { enabled: open && pool === "" });
  const characters = useQuery(["characterCosmeticCatalog"], characterCosmeticService.catalog, { enabled: open && pool === "character-box" });
  const catalog = pool === "" ? plants : characters;
  const eligible = useMemo(() => (catalog.data ?? []).filter((item) =>
    !item.starter && item.reward_pools.includes(pool || "teacher-box") && rarityRank[item.rarity] >= rarityRank[rarity]
  ), [catalog.data, pool, rarity]);
  const selected = eligible.find((item) => item.id === selectedId) ?? eligible[0];
  const cosmetics = selected && pool === "" ? { [selected.slot]: selected.preview_value } : {};
  const appearance = resolvePlantAppearance({ userId: "cohort-gift-preview", tier: 9, active: true, cosmetics });
  const count = audience.data?.total ?? 0;
  const scope = team ? `${team} · Cohort ${cohort}` : `Cohort ${cohort}`;

  const handleOpen = (next: boolean) => {
    setOpen(next);
    if (next && !batchKey) setBatchKey(crypto.randomUUID());
    if (!next) { setBatchKey(""); setResult(undefined); setLocked(false); }
  };

  const send = async () => {
    if (!message.trim() || count === 0 || audience.isFetching) return;
    setSending(true);
    setLocked(true);
    try {
      const response = await giftBoxService.grantAudience(cohort, team, rarity, message.trim(), batchKey, pool);
      setResult(response);
      if (response.failures.length === 0) toast.success(`Gift boxes processed for ${scope}`);
      else toast.warning(`${response.failures.length} learners still need a retry`);
    } catch {
      toast.error("Gift boxes couldn't be processed. Retry keeps successful grants safe.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild><Button disabled={cohort <= 0 || learnerCount === 0} className="gap-2"><Gift className="h-4 w-4" /> Gift boxes</Button></DialogTrigger>
      <DialogContent className="max-h-[94vh] overflow-y-auto border-2 border-stone-800 bg-[#fffaf1] text-stone-900 sm:max-w-5xl">
        <DialogHeader><DialogTitle className="font-['Trebuchet_MS'] text-2xl">Send a little surprise</DialogTitle></DialogHeader>
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-stone-800 bg-[#f9ddaf] p-4 shadow-[4px_4px_0_#292524]">
              <p className="text-xs font-black uppercase tracking-[0.15em]">Delivery list · Cohort {cohort}</p>
              <div className="mt-3 space-y-2"><Label>Recipients</Label><Select value={team || "all"} disabled={locked} onValueChange={(value) => setTeam(value === "all" ? "" : value)}><SelectTrigger aria-label="Gift box recipients" className="border-stone-800 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Everyone in Cohort {cohort}</SelectItem>{teams.map((name) => <SelectItem key={name} value={name}>Team {name}</SelectItem>)}</SelectContent></Select></div>
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" /> {audience.isLoading || audience.isFetching ? "Checking recipients…" : audience.isError ? "Could not check recipients" : `${count} active learners in ${scope}`}</p>
              <p className="mt-1 text-xs">Checked against current accounts. Each recipient gets one unopened box.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Reward collection</Label><Select value={pool || "plant"} disabled={locked} onValueChange={(value) => { setPool(value === "plant" ? "" : value as Pool); if (value === "character-egg") setRarity("Common"); setSelectedId(undefined); }}><SelectTrigger aria-label="Gift box collection"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="character-egg">Character Egg</SelectItem><SelectItem value="character-box">Character Style Box</SelectItem><SelectItem value="plant">Garden</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>{pool === "character-egg" ? "Egg tier" : "Minimum rarity"}</Label><Select value={rarity} disabled={locked} onValueChange={(value) => { setRarity(value as CosmeticRarity); setSelectedId(undefined); }}><SelectTrigger aria-label={pool === "character-egg" ? "Cohort Egg tier" : "Cohort minimum rarity"}><SelectValue /></SelectTrigger><SelectContent>{(pool === "character-egg" ? ["Common", "Rare", "Legendary"] : Object.keys(rarityRank)).map((value) => <SelectItem key={value} value={value}>{pool === "character-egg" ? value === "Common" ? "Standard" : value : `${value} or better`}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{pool === "character-egg" ? rarity === "Common" ? "Standard Egg · 83% Normal · 15% Meme Rare · 2% Legendary." : rarity === "Rare" ? "Rare Egg · always Meme Rare or Legendary." : "Legendary Egg · always Legendary." : "The box draws an unowned item when opened. Odds depend on each person's collection and are shown before opening."}</p>
            <div className="space-y-2"><Label htmlFor="cohort-gift-message">Message to every learner</Label><Textarea id="cohort-gift-message" maxLength={500} disabled={locked} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Your team brought generous energy to this sprint…" /></div>
            {pool !== "character-egg" && <div><p className="mb-2 text-sm font-medium">Possible rewards</p><div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">{eligible.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`rounded-full border px-3 py-1.5 text-sm ${selected?.id === item.id ? "border-emerald-600 bg-emerald-50" : ""}`}>{item.name} <Badge variant="outline" className="ml-1">{item.rarity}</Badge></button>)}</div>{!catalog.isLoading && eligible.length === 0 && <p className="text-sm text-amber-800">No rewards are available at this minimum rarity.</p>}</div>}
            {result && <div className="rounded-xl border bg-muted/40 p-3 text-sm"><p>{result.created} created · {result.existing} already safe · {result.failures.length} failed</p>{result.failures.length > 0 && <><p className="mt-1 text-destructive">Retry to process only the remaining learners.</p><ul className="mt-2 max-h-20 overflow-y-auto text-xs text-destructive">{result.failures.map((failure) => <li key={failure.user_id}>{failure.user_id}: {failure.error}</li>)}</ul></>}</div>}
          </div>
          <div className="rounded-2xl border-2 border-stone-800 bg-[#f0e9ff] p-4 shadow-[4px_4px_0_#292524]">
            {pool === "" ? <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-white/70 p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wider">2D preview</p><div className="flex h-64 items-center justify-center"><SeedlingPlant appearance={appearance} showParticles className="h-48 w-40" /></div></div><div className="rounded-xl bg-white/70 p-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wider">3D preview</p><Suspense fallback={<div className="flex aspect-[4/3] items-center justify-center text-sm">Growing 3D preview…</div>}><GenmateField members={[{ id: "preview", name: selected?.name ?? "Gift preview", appearance, displayStreakDays: 100 }]} /></Suspense></div></div> : <div className="flex min-h-72 flex-col items-center justify-center text-center"><div className="mb-5 flex h-36 w-28 rotate-[-5deg] items-center justify-center rounded-2xl border-4 border-stone-800 bg-gradient-to-br from-amber-200 via-pink-200 to-violet-300 text-6xl shadow-[8px_8px_0_#292524]">{pool === "character-egg" ? "🥚" : "?"}</div><p className="text-xl font-black">A mystery for every Baro</p><p className="mt-2 max-w-xs text-sm">{pool === "character-egg" ? "Each learner receives one unopened Egg and chooses when to meet their permanent new friend." : "Each learner opens their own box to reveal a collectible character detail. This preview cannot predict their draw."}</p></div>}
          </div>
        </div>
        <DialogFooter><Button onClick={send} disabled={sending || audience.isFetching || audience.isError || count === 0 || !message.trim() || (pool !== "character-egg" && eligible.length === 0)}>{sending ? "Processing…" : result?.failures.length ? "Retry failed grants" : `Send ${count} ${pool === "character-egg" ? "Eggs" : "gift boxes"}`}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
