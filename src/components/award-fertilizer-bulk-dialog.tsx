"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sprout, Users } from "lucide-react";
import { fertilizerService } from "@/lib/api";
import { toast } from "sonner";

interface AwardFertilizerBulkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userIds: string[];
  onSuccess?: () => void;
}

export function AwardFertilizerBulkDialog({ isOpen, onClose, userIds, onSuccess }: AwardFertilizerBulkDialogProps) {
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (amount <= 0) {
      toast.error("Amount must be at least 1.");
      return;
    }

    setIsSubmitting(true);
    try {
      await fertilizerService.bulkGrant(userIds, { amount, note: note || undefined });
      toast.success(`Granted fertilizer to ${userIds.length} learner${userIds.length !== 1 ? "s" : ""}`);
    } catch (error) {
      console.error("Bulk fertilizer grant failed:", error);
      toast.error("Failed to grant fertilizer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }

    onSuccess?.();
    onClose();
    setAmount(1);
    setNote("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5" />
            Bulk Grant Fertilizer
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Granting to <span className="font-semibold text-foreground">{userIds.length}</span> learner{userIds.length !== 1 ? "s" : ""}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-fertilizer-amount">Amount (each)</Label>
            <Input
              id="bulk-fertilizer-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bulk-fertilizer-note">Note (optional)</Label>
            <Input
              id="bulk-fertilizer-note"
              placeholder="e.g., End of sprint bonus"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || userIds.length === 0}>
            {isSubmitting ? "Granting..." : `Grant to ${userIds.length} Learner${userIds.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
