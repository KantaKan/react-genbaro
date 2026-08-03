import { useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { uploadPoster } from "@/lib/api";
import { buildPosterSvg } from "@/lib/stamp-poster";
import type { Stamp } from "@/lib/stamp";

interface PosterExportProps {
  cohortNumber: number;
  stamps: Stamp[];
}

const PLACEHOLDER_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQ2sAAAAASUVORK5CYII=";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Poster image failed to load"));
    image.src = url;
  });
}

function imageToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchStampImage(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }
    return await imageToDataUrl(await response.blob());
  } catch {
    return PLACEHOLDER_DATA_URL;
  }
}

async function exportPoster(stamps: Stamp[]): Promise<Blob> {
  const images = await Promise.all(stamps.map((stamp) => fetchStampImage(stamp.imageUrl)));
  const prepared = stamps.map((stamp, index) => ({ ...stamp, imageUrl: images[index] }));
  const svg = buildPosterSvg(prepared);
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.width * 2;
    canvas.height = image.height * 2;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is not supported");
    }
    context.scale(2, 2);
    context.drawImage(image, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      throw new Error("Poster encoding failed");
    }
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function PosterExport({ cohortNumber, stamps }: PosterExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleExport = async () => {
    if (stamps.length === 0) {
      toast.error("There are no stamps to export yet.");
      return;
    }
    setIsExporting(true);
    try {
      const blob = await exportPoster(stamps);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cohort-${cohortNumber}-poster.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Poster exported!");
    } catch {
      toast.error("Couldn't export the poster.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpload = async () => {
    if (stamps.length === 0) {
      toast.error("There are no stamps to save yet.");
      return;
    }
    setIsUploading(true);
    try {
      const blob = await exportPoster(stamps);
      await uploadPoster(cohortNumber, blob);
      toast.success("Poster saved to the board.");
    } catch {
      toast.error("Couldn't save the poster.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleExport()}
        disabled={isExporting || isUploading}
      >
        {isExporting ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-1.5 h-4 w-4" />
        )}
        {isExporting ? "Exporting..." : "Export Poster"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleUpload()}
        disabled={isExporting || isUploading}
      >
        {isUploading ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-1.5 h-4 w-4" />
        )}
        {isUploading ? "Saving..." : "Save Poster"}
      </Button>
    </div>
  );
}
