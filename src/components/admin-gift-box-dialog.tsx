import { useState } from "react";
import { Gift } from "lucide-react";
import { toast } from "sonner";
import { giftBoxService } from "@/application/services/giftBoxService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CosmeticRarity } from "@/domain/types";

export function AdminGiftBoxDialog({ userId, learnerName }: { userId: string; learnerName: string }) {
  const [open, setOpen] = useState(false);
  const [rarity, setRarity] = useState<CosmeticRarity>("Rare");
  const [eggTier, setEggTier] = useState<"Common" | "Rare" | "Legendary">("Common");
  const [rewardPool, setRewardPool] = useState<"plant" | "style" | "egg">("plant");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const pool = rewardPool === "style" ? "character-box" : rewardPool === "egg" ? "character-egg" : undefined;
      await giftBoxService.grant(userId, rewardPool === "egg" ? eggTier : rarity, message.trim(), pool);
      toast.success(`${rewardPool === "egg" ? "Character Egg" : "Gift box"} sent to ${learnerName}`);
      setOpen(false);
      setMessage("");
    } catch {
      toast.error("Couldn't send the gift box. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="gap-2"><Gift className="h-4 w-4" /> Send Gift Box</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Send a gift box to {learnerName}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Gift collection</Label>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Gift collection">
              <button type="button" aria-pressed={rewardPool === "plant"} onClick={() => setRewardPool("plant")} className={`rounded-xl border-2 px-3 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${rewardPool === "plant" ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-border"}`}>🌱 Garden</button>
              <button type="button" aria-pressed={rewardPool === "style"} onClick={() => setRewardPool("style")} className={`rounded-xl border-2 px-3 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${rewardPool === "style" ? "border-[#292542] bg-[#eadcf7] text-[#292542]" : "border-border"}`}>✦ Baro Character Style Box</button>
              <button type="button" aria-pressed={rewardPool === "egg"} onClick={() => setRewardPool("egg")} className={`rounded-xl border-2 px-3 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${rewardPool === "egg" ? "border-orange-500 bg-orange-50 text-orange-950" : "border-border"}`}>🥚 Character Egg</button>
            </div>
            <p className="text-xs text-muted-foreground">{rewardPool === "egg" ? "The learner opens this Egg personally. Its server-owned hatch chances are shown before opening." : "The learner will receive one unowned item from this collection when they open it."}</p>
          </div>
          {rewardPool === "egg" && <div className="space-y-2">
            <Label>Character Egg tier</Label>
            <Select value={eggTier} onValueChange={(value) => setEggTier(value as typeof eggTier)}>
              <SelectTrigger aria-label="Character Egg tier"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Common">Standard · 83% Normal / 15% Meme Rare / 2% Legendary</SelectItem><SelectItem value="Rare">Rare · guaranteed Meme Rare or better</SelectItem><SelectItem value="Legendary">Legendary · guaranteed Legendary</SelectItem></SelectContent>
            </Select>
          </div>}
          {rewardPool !== "egg" && <div className="space-y-2">
            <Label>Minimum rarity</Label>
            <Select value={rarity} onValueChange={(value) => setRarity(value as CosmeticRarity)}>
              <SelectTrigger aria-label="Minimum rarity"><SelectValue /></SelectTrigger>
              <SelectContent>{["Common", "Rare", "Epic", "Legendary"].map((value) => <SelectItem key={value} value={value}>{value} or better</SelectItem>)}</SelectContent>
            </Select>
          </div>}
          <div className="space-y-2">
            <Label htmlFor="gift-box-message">Message to learner</Label>
            <Textarea id="gift-box-message" maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="You kept showing up with curiosity this week…" />
          </div>
        </div>
        <DialogFooter><Button onClick={send} disabled={sending || !message.trim()}>{sending ? "Sending…" : rewardPool === "egg" ? "Send Character Egg" : "Send gift box"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
