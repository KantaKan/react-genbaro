import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { careEnergyService } from "@/lib/api";
import { toast } from "sonner";

interface AwardCareEnergyButtonProps {
  userId: string;
  onCareEnergyAwarded?: () => void;
}

export function AwardCareEnergyButton({ userId, onCareEnergyAwarded }: AwardCareEnergyButtonProps) {
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
      await careEnergyService.grant(userId, { amount, note: note || undefined });
      toast.success(`Granted ${amount} Care Energy!`);
      setIsOpen(false);
      setAmount(1);
      setNote("");
      onCareEnergyAwarded?.();
    } catch (error) {
      console.error("Error granting Care Energy:", error);
      toast.error("Failed to grant Care Energy. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" /> Grant Care Energy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Grant Care Energy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="care-energy-amount">Amount</Label>
            <Input
              id="care-energy-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="care-energy-note">Note (optional)</Label>
            <Input
              id="care-energy-note"
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
            {isSubmitting ? "Granting..." : "Grant Care Energy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
