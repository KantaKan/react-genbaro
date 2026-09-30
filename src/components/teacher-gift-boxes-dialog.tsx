import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Gift, PackageOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { giftBoxService } from "@/application/services/giftBoxService";
import { cosmeticService } from "@/application/services/cosmeticService";
import { characterCosmeticService } from "@/application/services/characterCosmeticService";
import { baroCharacterService } from "@/application/services/baroCharacterService";
import { BaroCharacterArt } from "@/components/character/BaroCharacterArt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { BaroCharacter, GiftBoxOpenResult, TeacherGiftBox } from "@/domain/types";
import type { GiftBoxOdds, GiftBoxRecipient } from "@/domain/types/gift-box";

const cosmeticRarityOrder = ["Common", "Rare", "Epic", "Legendary"] as const;
const characterEggRarityOrder = ["Normal", "Meme Rare", "Legendary"] as const;

function oddsText(preview: GiftBoxOdds) {
  const order = preview.odds.Normal != null || preview.odds["Meme Rare"] != null ? characterEggRarityOrder : cosmeticRarityOrder;
  return order.filter((rarity) => preview.odds[rarity] != null)
    .map((rarity) => `${rarity} ${Math.round((preview.odds[rarity] ?? 0) * 1000) / 10}%`).join(" · ");
}

function eggTierLabel(minimumRarity: string) {
  if (minimumRarity === "Rare") return "Rare";
  if (minimumRarity === "Legendary") return "Legendary";
  return "Standard";
}

function GiftBoxJourney({ box }: { box: TeacherGiftBox }) {
  if (!box.transfer_history?.length) return null;
  return <details className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs"><summary className="cursor-pointer font-bold">เส้นทางของกล่อง · {box.transfer_history.length} ครั้ง</summary><p className="mt-2 text-muted-foreground">เริ่มจากของขวัญที่แอดมินแจก</p><ol className="mt-2 space-y-1">{box.transfer_history.map((step, index) => <li key={`${step.from_id}-${step.transferred_at}-${index}`}>{step.from_name} → {step.to_name} · {new Date(step.transferred_at).toLocaleDateString("th-TH")}</li>)}</ol></details>;
}

function TransferPanel({ box, onTransferred }: { box: TeacherGiftBox; onTransferred: () => Promise<void> }) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<GiftBoxRecipient>();
  const [sending, setSending] = useState(false);
  const [transferError, setTransferError] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchTerm(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  const recipients = useQuery(["gift-box-recipients", searchTerm], () => giftBoxService.recipients(searchTerm), { enabled: visible && searchTerm.length >= 2, retry: false });
  const learnerRecipients = recipients.data?.filter((recipient) => recipient.role === "learner");

  const send = async () => {
    if (!selected) return;
    setSending(true);
    setTransferError("");
    try {
      await giftBoxService.transfer(box.id, selected.id);
      toast.success(`ส่งกล่องให้ ${selected.display_name} แล้ว`);
      await onTransferred().catch(() => undefined);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status !== 429) await onTransferred().catch(() => undefined);
      const message = status === 429 ? "พักกล่องใบนี้สักครู่นะ แล้วค่อยลองส่งให้เพื่อนอีกครั้ง" : "ยังส่งกล่องไม่ได้ กล่องอาจถูกเปิดหรือย้ายไปแล้ว ลองโหลดรายการใหม่";
      setTransferError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return <div className="mt-4 border-t border-dashed border-border pt-4">
    {!visible ? <button type="button" onClick={() => setVisible(true)} className="rounded-full border border-border bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">ส่งกล่องให้เพื่อน</button> : <div className="rounded-xl border border-border bg-muted p-3">
      <p className="font-register-heading text-sm font-bold">เขียนชื่อบนป้ายส่งต่อ</p>
      <p className="mt-1 text-xs text-muted-foreground">ส่งต่อให้นักเรียนใน Baro ได้ แม้อยู่ต่างรุ่นหรือต่างทีม</p>
      <input aria-label="ค้นหาคนรับกล่อง" value={query} onChange={(event) => { setQuery(event.target.value); setSelected(undefined); }} placeholder="ชื่อเล่น ชื่อจริง หรืออีเมล" maxLength={80} className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      {query.trim().length < 2 && <p className="mt-2 text-xs text-muted-foreground">พิมพ์อย่างน้อย 2 ตัวอักษร</p>}
      {recipients.isLoading && <p role="status" className="mt-2 text-xs">กำลังค้นหา…</p>}
      {recipients.isError && <p className="mt-2 text-xs text-destructive">ค้นหาไม่ได้ <button type="button" className="font-bold underline" onClick={() => recipients.refetch()}>ลองใหม่</button></p>}
      {learnerRecipients && learnerRecipients.length === 0 && <p className="mt-2 text-xs">ยังไม่เจอนักเรียนชื่อนี้ ลองค้นด้วยชื่ออื่น</p>}
      {learnerRecipients && learnerRecipients.length > 0 && <div className="mt-2 max-h-40 space-y-1 overflow-y-auto" aria-label="ผลการค้นหาคนรับกล่อง">
        {learnerRecipients.map((person) => <button key={person.id} type="button" aria-pressed={selected?.id === person.id} onClick={() => setSelected(person)} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected?.id === person.id ? "bg-primary/15 font-bold" : "bg-background hover:bg-secondary"}`}><span>{person.display_name}</span><span className="text-[10px] text-muted-foreground">รุ่น {person.cohort_number}{person.group ? ` · ${person.group}` : ""}</span></button>)}
      </div>}
      {transferError && <p role="alert" className="mt-2 rounded-md bg-primary/10 px-3 py-2 text-xs font-bold">{transferError}</p>}
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!selected || sending} onClick={send} className="min-h-10 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50">{sending ? "กำลังส่ง…" : selected ? `ส่งให้ ${selected.display_name}` : "เลือกคนรับก่อน"}</button><button type="button" onClick={() => { setVisible(false); setSelected(undefined); }} className="min-h-10 rounded-full px-3 text-xs font-bold">ยกเลิก</button></div>
    </div>}
  </div>;
}

const rarityChip: Record<string, string> = {
  normal: "bg-[hsl(var(--character-normal))] text-[hsl(var(--character-normal-foreground))]",
  meme_rare: "bg-[hsl(var(--character-meme))] text-[hsl(var(--character-meme-foreground))]",
  legendary: "bg-[hsl(var(--character-legendary))] text-[hsl(var(--character-legendary-foreground))]",
};

const hatchStages = ["ไข่กำลังสั่น", "เปลือกเริ่มร้าว", "เห็นเงาคู่หู", "เจอกันแล้ว!"];

export function CharacterEggReveal({ character, reducedMotion, busy, onEquip, onKeep }: { character: BaroCharacter; reducedMotion: boolean; busy: boolean; onEquip: () => void; onKeep: () => void }) {
  const [stage, setStage] = useState(reducedMotion ? 3 : 0);
  useEffect(() => {
    if (reducedMotion || stage >= 3) return;
    const timer = window.setTimeout(() => setStage((current) => current + 1), 350);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, stage]);

  return <section aria-label="การฟัก Character Egg" className="overflow-hidden rounded-2xl border border-border bg-card p-6 text-center text-card-foreground shadow-sm">
    <ol className="grid grid-cols-4 gap-1 text-[10px] font-bold" aria-label="ขั้นตอนการฟัก">
      {hatchStages.map((label, index) => <li key={label} className={`rounded-full px-2 py-1 transition-colors ${index <= stage ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{label}</li>)}
    </ol>
    {stage < 3 ? <div className="flex min-h-72 items-center justify-center" aria-live="polite">
      {stage < 2 ? <motion.div animate={stage === 0 ? { rotate: [-4, 4, -3, 3, 0] } : { scale: [1, 1.08, 1] }} transition={{ duration: 0.55 }} className="relative text-[9rem] leading-none">🥚{stage === 1 && <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl">⚡</span>}</motion.div> : <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.32 }} className="h-64 w-48 grayscale"><BaroCharacterArt dna={character.dna} id={`${character.id}-silhouette`} /></motion.div>}
      <span className="sr-only">{hatchStages[stage]}</span>
    </div> : <motion.div initial={reducedMotion ? false : { opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }} className="pt-5">
      <div className="mx-auto h-64 w-52"><BaroCharacterArt dna={character.dna} id={`${character.id}-egg-reveal`} /></div>
      <p className={`mx-auto mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[.16em] ${rarityChip[character.dna.rarity] ?? rarityChip.normal}`}>{character.dna.rarity.replace("_", " ")}</p>
      <h3 className="mt-2 font-register-mono text-lg font-bold">{character.serial}</h3>
      <p className="mt-2 text-sm text-muted-foreground">คู่หูตัวนี้อยู่ในสมุดสะสมของคุณถาวรแล้ว</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2"><Button onClick={onEquip} disabled={busy} className="rounded-full">ใช้ตัวละครนี้</Button><Button variant="outline" onClick={onKeep} disabled={busy} className="rounded-full">เก็บไว้ในสมุด</Button></div>
    </motion.div>}
  </section>;
}

function UnopenedBox({ box, openingId, onOpen, onTransferred }: { box: TeacherGiftBox; openingId?: string; onOpen: (id: string) => void; onTransferred: () => Promise<void> }) {
  const character = box.reward_pool === "character-box";
  const egg = box.reward_pool === "character-egg";
  const preview = useQuery(["gift-box-odds", box.id], () => giftBoxService.odds(box.id), { retry: false });
  return <article className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
    <div className={`absolute inset-y-0 left-0 w-1.5 ${egg ? "bg-primary" : character ? "bg-[hsl(var(--character-legendary-foreground))]" : "bg-[hsl(var(--character-normal-foreground))]"}`} />
    <div className="pl-3">
      <div className="flex items-center justify-between gap-3"><Badge variant="outline">{egg ? `${eggTierLabel(box.minimum_rarity)} Egg` : `${box.minimum_rarity} or better`}</Badge><Gift className="h-5 w-5 text-primary" /></div>
      {character && <p className="mt-4 text-xs font-bold uppercase tracking-[.16em]">✦ BARO CHARACTER STYLE BOX</p>}
      {egg && <p className="mt-4 font-register-heading text-lg font-bold">🥚 {eggTierLabel(box.minimum_rarity)} Character Egg</p>}
      <p className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-primary">
        {box.source === "reflection-milestone" ? "Reflection milestone" : box.source === "achievement" ? "Achievement unlocked" : "From your teacher"}
      </p>
      <blockquote className="mt-2 font-register-heading text-lg leading-relaxed">“{box.message}”</blockquote>
      {preview.isLoading && <p className="mt-3 text-xs text-muted-foreground">Checking what is still in your draw…</p>}
      {preview.isError && <p className="mt-3 text-xs text-destructive">Could not check the draw. <button type="button" className="font-bold underline" onClick={() => preview.refetch()}>Try again</button></p>}
      {preview.data && !preview.data.complete && <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">{egg ? "Hatch chances" : "Your current chances"} · {oddsText(preview.data)}{!egg && ` · ${preview.data.eligible_count} unowned items`}</p>}
      {preview.data?.complete && <p className="mt-3 text-sm font-bold text-primary">You already have every eligible item. This box stays unopened and safe to keep.</p>}
      <GiftBoxJourney box={box} />
      {egg ? <Button className="mt-5 w-full gap-2 rounded-full" onClick={() => onOpen(box.id)} disabled={!!openingId || !preview.data}>{openingId === box.id ? "กำลังฟัก…" : "ฟัก Character Egg"}</Button> : <Button className="mt-5 w-full gap-2 rounded-full" onClick={() => onOpen(box.id)} disabled={!!openingId || !preview.data || preview.data.complete}>
        <PackageOpen className="h-4 w-4" /> {openingId === box.id ? "Opening…" : "Open this gift"}
      </Button>}
      <TransferPanel box={box} onTransferred={onTransferred} />
    </div>
  </article>;
}

interface TeacherGiftBoxesDialogProps {
  onReward?: () => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onViewCollection?: () => void;
  onViewCharacterCollection?: () => void;
}

export function TeacherGiftBoxesDialog({ onReward, open: controlledOpen, onOpenChange, onViewCollection, onViewCharacterCollection }: TeacherGiftBoxesDialogProps) {
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const [openingId, setOpeningId] = useState<string>();
  const [equipping, setEquipping] = useState(false);
  const [reveal, setReveal] = useState<GiftBoxOpenResult>();
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };
  const closeDialog = () => {
    setReveal(undefined);
    setOpen(false);
  };
  const reducedMotion = useReducedMotion();
  const boxes = useQuery(["teacherGiftBoxes"], giftBoxService.list, { enabled: open });
  const unopened = boxes.data?.filter((box) => box.status === "unopened") ?? [];
  const openedWithJourney = boxes.data?.filter((box) => box.status === "opened" && box.reward_pool !== "character-egg" && box.transfer_history?.length) ?? [];
  const openedEggs = boxes.data?.filter((box) => box.status === "opened" && box.reward_pool === "character-egg" && box.character) ?? [];

  const openBox = async (boxId: string) => {
    setOpeningId(boxId);
    try {
      const result = await giftBoxService.open(boxId);
      setReveal(result);
      await boxes.refetch();
      queryClient.invalidateQueries(["gift-box-odds"]);
      queryClient.invalidateQueries(["character-cosmetic-collection"]);
      queryClient.invalidateQueries(["baro-character-collection"]);
      await onReward?.();
    } catch {
      await queryClient.invalidateQueries(["gift-box-odds", boxId]);
      toast.error("This box did not open. Your collection may have changed; check the updated chances.");
    } finally {
      setOpeningId(undefined);
    }
  };

  const onTransferred = async () => {
    await boxes.refetch();
    queryClient.invalidateQueries(["gift-box-odds"]);
  };

  const equipReward = async () => {
    if (!reveal || reveal.kind !== "cosmetic") return;
    setEquipping(true);
    try {
      if (reveal.item.slot === "card_background" || reveal.item.slot === "character_prop") {
        await characterCosmeticService.equip(reveal.item.slot, reveal.item.id);
        queryClient.invalidateQueries(["character-cosmetic-collection"]);
      } else {
        await cosmeticService.equip(reveal.item.slot, reveal.item.id);
      }
      await onReward?.();
      toast.success(`${reveal.item.name} is equipped.`);
      closeDialog();
    } catch {
      toast.error("Couldn't equip this collectible yet. It is safe in your collection.");
    } finally {
      setEquipping(false);
    }
  };

  const viewCollection = () => {
    if (!reveal || reveal.kind !== "cosmetic") return;
    const character = reveal?.item.slot === "card_background" || reveal?.item.slot === "character_prop";
    closeDialog();
    if (character) onViewCharacterCollection?.();
    else onViewCollection?.();
  };

  const equipCharacter = async () => {
    if (!reveal || reveal.kind !== "character") return;
    setEquipping(true);
    try {
      await baroCharacterService.equip(reveal.character.id);
      queryClient.invalidateQueries(["baro-character-selection"]);
      queryClient.invalidateQueries(["baro-character-collection"]);
      toast.success("ใช้คู่หูตัวใหม่แล้ว");
      closeDialog();
    } catch {
      toast.error("ยังเปลี่ยนคู่หูไม่ได้ ตัวละครยังปลอดภัยอยู่ในสมุดสะสม");
    } finally {
      setEquipping(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setReveal(undefined); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
          <Gift className="h-4 w-4" /> Gift boxes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto font-register-body sm:max-w-xl">
        <DialogHeader><DialogTitle className="font-register-heading text-2xl">A little gift for you</DialogTitle></DialogHeader>
        {reveal?.kind === "character" ? <CharacterEggReveal character={reveal.character} reducedMotion={Boolean(reducedMotion)} busy={equipping} onEquip={equipCharacter} onKeep={closeDialog} /> : reveal ? (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.82, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-center text-card-foreground shadow-sm"
          >
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-primary">New permanent collectible</p>
            <h3 className="mt-2 font-register-heading text-3xl">{reveal.item.name}</h3>
            <Badge className="mt-3">{reveal.item.rarity}</Badge>
            <p className="mt-3 text-sm capitalize text-muted-foreground">{reveal.item.slot}</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <Button onClick={equipReward} disabled={equipping}>{equipping ? "Equipping…" : "Equip now"}</Button>
              <Button variant="outline" onClick={viewCollection}>View collection</Button>
              <Button variant="ghost" onClick={closeDialog}>Later</Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {boxes.isLoading && <p className="py-12 text-center text-sm text-muted-foreground">Looking under the garden shelf…</p>}
            {!boxes.isLoading && unopened.length === 0 && openedWithJourney.length === 0 && openedEggs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-card-foreground">
                <PackageOpen className="mx-auto h-9 w-9 text-primary" />
                <p className="mt-3 font-register-heading text-lg">Your gift shelf is clear</p>
                <p className="mt-1 text-sm text-muted-foreground">New gifts from your reflections, achievements, and teachers will wait safely here.</p>
              </div>
            )}
            {unopened.map((box) => <UnopenedBox key={box.id} box={box} openingId={openingId} onOpen={openBox} onTransferred={onTransferred} />)}
            {openedEggs.map((box) => <article key={box.id} className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm"><p className="text-sm font-bold">🥚 Character Egg ที่ฟักแล้ว</p><p className="mt-1 font-register-mono text-xs text-muted-foreground">{box.character?.serial}</p><GiftBoxJourney box={box} /><Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => box.character && setReveal({ kind: "character", character: box.character })}>ดูตัวละครอีกครั้ง</Button></article>)}
            {openedWithJourney.length > 0 && <section aria-label="ประวัติกล่องที่เปิดแล้ว" className="border-t border-border pt-4"><h3 className="font-register-heading text-base">สมุดเดินทางของกล่องที่เปิดแล้ว</h3><div className="mt-3 space-y-3">{openedWithJourney.map((box) => <article key={box.id} className="rounded-2xl border border-border bg-card p-4 text-card-foreground"><p className="text-sm font-bold">{box.reward?.name ?? "กล่องรางวัลที่เปิดแล้ว"}</p><GiftBoxJourney box={box} /></article>)}</div></section>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
