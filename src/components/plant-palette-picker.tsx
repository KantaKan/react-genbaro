import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAllPalettes } from "@/lib/plant-variants";
import { updateUserPersonalDetails } from "@/application/services/userService";
import { toast } from "sonner";
import { Palette, Check } from "lucide-react";

interface PlantPalettePickerProps {
  userId: string;
  selected?: string;
  onSaved?: () => void;
}

export function PlantPalettePicker({ userId, selected, onSaved }: PlantPalettePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const palettes = getAllPalettes();

  const handlePick = async (name: string) => {
    setIsSaving(true);
    try {
      await updateUserPersonalDetails(userId, { selected_palette: name === selected ? "" : name });
      toast.success(name === selected ? "Back to your default color ✨" : `Your plant is now ${name} 🎨`);
      setIsOpen(false);
      onSaved?.();
    } catch {
      toast.error("Couldn't save your plant's color. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
          <Palette className="h-4 w-4" />
          Plant color
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Choose your plant's color</p>
          <div className="grid grid-cols-5 gap-2">
            {palettes.map((palette) => {
              const isSelected = selected === palette.name;
              return (
                <button
                  key={palette.name}
                  type="button"
                  disabled={isSaving}
                  onClick={() => handlePick(palette.name)}
                  title={palette.name}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border transition-transform enabled:hover:scale-110 disabled:opacity-30"
                  style={{ backgroundColor: palette.leaf }}
                >
                  {isSelected && <Check className="h-4 w-4 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
