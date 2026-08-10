import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fertilizerService } from "@/lib/api";
import { toast } from "sonner";
import { Shield, Sparkles } from "lucide-react";

interface FertilizerInventoryButtonProps {
  userId: string;
  balance: number;
  eligibleProtectDate: string | null;
  onUsed?: () => void;
}

export function FertilizerInventoryButton({ userId, balance, eligibleProtectDate, onUsed }: FertilizerInventoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedAmount, setFeedAmount] = useState(1);

  if (balance <= 0) return null;

  const handleProtect = async () => {
    if (!eligibleProtectDate) return;
    setIsSubmitting(true);
    try {
      await fertilizerService.protect(userId, eligibleProtectDate);
      toast.success(`Protected ${eligibleProtectDate} — your streak is safe!`);
      setIsOpen(false);
      onUsed?.();
    } catch {
      toast.error("Couldn't protect that day. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeed = async (quantity: number) => {
    if (quantity < 1) return;
    setIsSubmitting(true);
    try {
      await fertilizerService.feed(userId, quantity);
      toast.success(`Your plant feels nourished! +${quantity * 10} growth ✨`);
      setIsOpen(false);
      setFeedAmount(1);
      onUsed?.();
    } catch {
      toast.error("Couldn't feed your plant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
          🧪 {balance}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Use a fertilizer</p>
          <Button
            variant="outline"
            className="justify-start gap-2"
            disabled={!eligibleProtectDate || isSubmitting}
            onClick={handleProtect}
          >
            <Shield className="h-4 w-4" />
            {eligibleProtectDate ? `Protect ${eligibleProtectDate}` : "No missed day to protect"}
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={balance}
              value={feedAmount}
              disabled={isSubmitting}
              onChange={(e) => {
                const n = Math.floor(Number(e.target.value));
                setFeedAmount(Number.isFinite(n) ? Math.min(Math.max(n, 1), balance) : 1);
              }}
              className="w-16"
            />
            <Button
              variant="outline"
              className="flex-1 justify-start gap-2"
              disabled={isSubmitting}
              onClick={() => handleFeed(feedAmount)}
            >
              <Sparkles className="h-4 w-4" />
              Feed (+{feedAmount * 10} growth)
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 text-muted-foreground"
            disabled={isSubmitting}
            onClick={() => handleFeed(balance)}
          >
            <Sparkles className="h-4 w-4" />
            Feed all ({balance} fertilizer → +{balance * 10} growth)
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
