import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sprout } from "lucide-react";
import { userService } from "@/lib/api";
import {
  getAllPalettes,
  getPlantVariant,
  SPECIES,
  POT_STYLES,
  LEAF_STYLES,
  FLOWER_TYPES,
  STEM_STYLES,
} from "@/lib/plant-variants";
import { SeedlingPlant } from "@/components/streak-components";
import { toast } from "sonner";

// Preview always shows the fully-grown look (tier 9) so every part — flower,
// fruit, etc. — is visible regardless of the learner's actual streak.
const PREVIEW_TIER = 9;

// Radix Select can't represent an empty string value, so "auto" stands in for
// "no override — use the hash-derived default" and is converted to "" on submit.
const AUTO = "auto";

interface AdminPlantOverrideButtonProps {
  userId: string;
  current: {
    palette?: string;
    species?: string;
    pot?: string;
    leaf?: string;
    flower?: string;
    stem?: string;
  };
  onSaved?: () => void;
}

const FIELDS: { key: keyof AdminPlantOverrideButtonProps["current"]; label: string; options: string[] }[] = [
  { key: "palette", label: "Color", options: getAllPalettes().map((p) => p.name) },
  { key: "species", label: "Species", options: SPECIES },
  { key: "pot", label: "Pot", options: POT_STYLES },
  { key: "leaf", label: "Leaf", options: LEAF_STYLES },
  { key: "flower", label: "Flower", options: FLOWER_TYPES },
  { key: "stem", label: "Stem", options: STEM_STYLES },
];

export function AdminPlantOverrideButton({ userId, current, onSaved }: AdminPlantOverrideButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState(current);

  const handleOpenChange = (open: boolean) => {
    if (open) setValues(current);
    setIsOpen(open);
  };

  const save = async (payload: AdminPlantOverrideButtonProps["current"]) => {
    setIsSubmitting(true);
    try {
      await userService.updatePlantOverride(userId, payload);
      toast.success("Plant updated");
      setIsOpen(false);
      onSaved?.();
    } catch {
      toast.error("Couldn't update the plant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sprout className="h-4 w-4" /> Edit Plant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5" /> Edit Plant
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <SeedlingPlant
            tier={PREVIEW_TIER}
            active
            showParticles={false}
            variant={getPlantVariant(userId, values)}
            className="h-28 w-24"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {FIELDS.map(({ key, label, options }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`plant-${key}`}>{label}</Label>
              <Select
                value={values[key] || AUTO}
                onValueChange={(v) => setValues((prev) => ({ ...prev, [key]: v === AUTO ? "" : v }))}
              >
                <SelectTrigger id={`plant-${key}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUTO}>Auto (default)</SelectItem>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground"
            disabled={isSubmitting}
            onClick={() => save({})}
          >
            Reset to default
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={() => save(values)} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
