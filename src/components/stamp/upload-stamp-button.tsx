import { useRef } from "react";
import type { ChangeEvent } from "react";
import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStampUpload } from "@/hooks/use-stamp-upload";

interface UploadStampButtonProps {
  cohortNumber: number;
}

export function UploadStampButton({ cohortNumber }: UploadStampButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useStampUpload();

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    void upload(cohortNumber, file).then(() => {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    });
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
        disabled={isUploading}
        className="rounded-full px-6"
      >
        <Camera className="mr-2 h-4 w-4" />
        {isUploading ? "Stamping..." : "Add a Stamp"}
      </Button>
    </>
  );
}
