import type { CSSProperties } from "react";
import { STAMP_W, STAMP_H } from "@/lib/stamp-mask";

interface StampImageProps {
  src: string;
  alt?: string;
  rotationDeg?: number;
  size?: number;
  className?: string;
}

const STAMP_RATIO = STAMP_H / STAMP_W;

export function StampImage({
  src,
  alt = "Stamp",
  rotationDeg = 0,
  size = STAMP_W,
  className,
}: StampImageProps) {
  const style: CSSProperties = {
    width: size,
    height: size * STAMP_RATIO,
    objectFit: "cover",
    transform: rotationDeg ? `rotate(${rotationDeg}deg)` : undefined,
    maskImage: "url(#stamp-perf)",
    WebkitMaskImage: "url(#stamp-perf)",
  };

  return <img src={src} alt={alt} loading="lazy" className={className} style={style} />;
}
