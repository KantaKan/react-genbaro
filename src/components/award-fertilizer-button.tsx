import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sprout } from "lucide-react";
import { fertilizerService } from "@/lib/api";
import { toast } from "sonner";

interface AwardFertilizerButtonProps {
  userId: string;
  onFertilizerAwarded?: () => void;
}

export function AwardFertilizerButton({ userId, onFertilizerAwarded }: AwardFertilizerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState("");

  const handleAward = async () => {
    if (amount <= 0) {
      toast.error("Amount must be at least 1.");
      return;
    }

    setIsSubmitting(true);
    try {
      await fertilizerService.grant(userId, { amount, note: note || undefined });
      toast.success(`Granted ${amount} fertilizer${amount !== 1 ? "s" : ""}!`);
      setIsOpen(false);
      setAmount(1);
      setNote("");
      onFertilizerAwarded?.();
    } catch (error) {
      console.error("Error granting fertilizer:", error);
      toast.error("Failed to grant fertilizer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sprout className="h-4 w-4" /> Grant Fertilizer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5" /> Grant Fertilizer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fertilizer-amount">Amount</Label>
            <Input
              id="fertilizer-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fertilizer-note">Note (optional)</Label>
            <Input
              id="fertilizer-note"
              placeholder="e.g., Great job this week!"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAward} disabled={isSubmitting}>
            {isSubmitting ? "Granting..." : "Grant Fertilizer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
