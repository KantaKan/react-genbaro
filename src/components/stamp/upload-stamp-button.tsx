import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Camera, Check } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { StampPreviewDialog } from "@/components/stamp/stamp-preview-dialog";
import { useStampUpload } from "@/hooks/use-stamp-upload";
import { prepareStampFile } from "@/lib/stamp-upload";

interface UploadStampButtonProps {
  cohortNumber: number;
  hasStampedToday?: boolean;
}

interface PendingStamp {
  file: File;
  previewUrl: string;
}

export function UploadStampButton({ cohortNumber, hasStampedToday = false }: UploadStampButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingStamp | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const { upload, isUploading } = useStampUpload();

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (!file) {
      return;
    }
    setIsPreparing(true);
    try {
      const prepared = await prepareStampFile(file);
      setPending({ file: prepared, previewUrl: URL.createObjectURL(prepared) });
    } catch {
      toast.error("That photo couldn't be read. Try a different image.");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleConfirm = () => {
    if (!pending) {
      return;
    }
    void upload(cohortNumber, pending.file, { prepared: true }).then((success) => {
      if (success && pending) {
        URL.revokeObjectURL(pending.previewUrl);
        setPending(null);
      }
    });
  };

  const handleClosePreview = (open: boolean) => {
    if (!open && pending) {
      URL.revokeObjectURL(pending.previewUrl);
      setPending(null);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={isUploading || isPreparing || hasStampedToday}
        className="rounded-full px-6"
        aria-disabled={hasStampedToday}
      >
        {hasStampedToday ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            See you tomorrow!
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            {isUploading ? "Stamping..." : isPreparing ? "Preparing..." : "Add a Stamp"}
          </>
        )}
      </Button>
      <StampPreviewDialog
        open={Boolean(pending)}
        onOpenChange={handleClosePreview}
        previewUrl={pending?.previewUrl ?? null}
        isUploading={isUploading}
        onConfirm={handleConfirm}
      />
    </>
  );
}
