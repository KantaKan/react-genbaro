import { useState } from "react";
import { useQuery } from "react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Gift, PackageOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { giftBoxService } from "@/application/services/giftBoxService";
import { cosmeticService } from "@/application/services/cosmeticService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { RewardDrawResult } from "@/domain/types";

const oddsByFloor = {
  Common: "Common 55% · Rare 30% · Epic 12% · Legendary 3%",
  Rare: "Rare 66.7% · Epic 26.7% · Legendary 6.6%",
  Epic: "Epic 80% · Legendary 20%",
  Legendary: "Legendary 100%",
};

interface TeacherGiftBoxesDialogProps {
  onReward?: () => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onViewCollection?: () => void;
}

export function TeacherGiftBoxesDialog({ onReward, open: controlledOpen, onOpenChange, onViewCollection }: TeacherGiftBoxesDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [openingId, setOpeningId] = useState<string>();
  const [equipping, setEquipping] = useState(false);
  const [reveal, setReveal] = useState<RewardDrawResult>();
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

  const openBox = async (boxId: string) => {
    setOpeningId(boxId);
    try {
      const result = await giftBoxService.open(boxId);
      setReveal(result);
      await boxes.refetch();
      await onReward?.();
    } catch {
      toast.error("This gift couldn't open yet. Check your connection and try again.");
    } finally {
      setOpeningId(undefined);
    }
  };

  const equipReward = async () => {
    if (!reveal) return;
    setEquipping(true);
    try {
      await cosmeticService.equip(reveal.item.slot, reveal.item.id);
      await onReward?.();
      toast.success(`${reveal.item.name} is now part of your plant.`);
      closeDialog();
    } catch {
      toast.error("Couldn't equip this collectible yet. It is safe in your collection.");
    } finally {
      setEquipping(false);
    }
  };

  const viewCollection = () => {
    closeDialog();
    onViewCollection?.();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setReveal(undefined); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-full border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100">
          <Gift className="h-4 w-4" /> Gift boxes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-amber-200 bg-[#fffaf0] sm:max-w-xl">
        <DialogHeader><DialogTitle className="font-serif text-2xl text-emerald-950">A little garden gift</DialogTitle></DialogHeader>
        {reveal ? (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.82, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="relative overflow-hidden rounded-[2rem] border border-amber-300 bg-gradient-to-b from-amber-100 via-white to-emerald-50 p-8 text-center shadow-[0_24px_70px_-35px_rgba(146,100,20,0.65)]"
          >
            <Sparkles className="mx-auto h-8 w-8 text-amber-500" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">New permanent collectible</p>
            <h3 className="mt-2 font-serif text-3xl text-emerald-950">{reveal.item.name}</h3>
            <Badge className="mt-3 bg-emerald-700 text-white">{reveal.item.rarity}</Badge>
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
            {!boxes.isLoading && unopened.length === 0 && (
              <div className="rounded-3xl border border-dashed border-emerald-300 bg-white/70 px-6 py-12 text-center">
                <PackageOpen className="mx-auto h-9 w-9 text-emerald-600" />
                <p className="mt-3 font-medium text-emerald-950">Your gift shelf is clear</p>
                <p className="mt-1 text-sm text-muted-foreground">New boxes from your teachers will wait safely here.</p>
              </div>
            )}
            {unopened.map((box) => (
              <article key={box.id} className="relative overflow-hidden rounded-3xl border border-amber-300 bg-white p-5 shadow-sm">
                <div className="absolute inset-y-0 left-0 w-2 bg-[repeating-linear-gradient(45deg,#d97706_0_6px,#fef3c7_6px_12px,#059669_12px_18px,#d1fae5_18px_24px)]" />
                <div className="pl-3">
                  <div className="flex items-center justify-between gap-3"><Badge variant="outline">{box.minimum_rarity} or better</Badge><Gift className="h-5 w-5 text-rose-500" /></div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{box.source === "reflection-milestone" ? "Reflection milestone" : "From your teacher"}</p>
                  <blockquote className="mt-2 font-serif text-lg leading-relaxed text-emerald-950">“{box.message}”</blockquote>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{oddsByFloor[box.minimum_rarity]}</p>
                  <Button className="mt-5 w-full gap-2" onClick={() => openBox(box.id)} disabled={!!openingId}>
                    <PackageOpen className="h-4 w-4" /> {openingId === box.id ? "Opening…" : "Open this gift"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
