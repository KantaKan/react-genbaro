import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StampImage } from "@/components/stamp/stamp-image";

interface StampPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string | null;
  isUploading: boolean;
  onConfirm: () => void;
}

export function StampPreviewDialog({
  open,
  onOpenChange,
  previewUrl,
  isUploading,
  onConfirm,
}: StampPreviewDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!isUploading) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-handwriting text-3xl">Nice one!</DialogTitle>
          <DialogDescription>
            Here's how your stamp will look on the board. Ready to paste it?
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-2">
          {previewUrl && (
            <StampImage
              src={previewUrl}
              alt="Your stamp preview"
              rotationDeg={-4}
              size={170}
              className="rounded-sm shadow-lg drop-shadow-[0_4px_8px_rgba(0,0,0,0.18)]"
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isUploading}>
            Pick again
          </Button>
          <Button onClick={onConfirm} disabled={isUploading}>
            <Camera className="mr-2 h-4 w-4" />
            {isUploading ? "Pasting..." : "Paste it"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
