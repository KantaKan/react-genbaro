import { STAMP_W, STAMP_H } from "@/lib/stamp-mask";

const MAX_DIMENSION = 600;
const IMAGE_QUALITY = 0.78;

export async function prepareStampFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const targetRatio = STAMP_W / STAMP_H;

  let cropWidth = bitmap.width;
  let cropHeight = bitmap.height;
  if (bitmap.width / bitmap.height > targetRatio) {
    cropWidth = Math.round(bitmap.height * targetRatio);
  } else {
    cropHeight = Math.round(bitmap.width / targetRatio);
  }
  const sx = (bitmap.width - cropWidth) / 2;
  const sy = (bitmap.height - cropHeight) / 2;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(cropWidth, cropHeight));
  const outputWidth = Math.max(1, Math.round(cropWidth * scale));
  const outputHeight = Math.max(1, Math.round(cropHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported");
  }

  context.drawImage(bitmap, sx, sy, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", IMAGE_QUALITY)
  );
  if (!blob) {
    throw new Error("Image encoding failed");
  }

  const baseName = file.name.replace(/\.[^/.]+$/, "") || "stamp";
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}
