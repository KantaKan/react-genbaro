import { useState } from "react";
import type { CSSProperties } from "react";
import { Stamp } from "lucide-react";
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
  const [hasError, setHasError] = useState(false);
  const style: CSSProperties = {
    width: size,
    height: size * STAMP_RATIO,
    objectFit: "cover",
    transform: rotationDeg ? `rotate(${rotationDeg}deg)` : undefined,
    maskImage: "url(#stamp-perf)",
    WebkitMaskImage: "url(#stamp-perf)",
  };

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className ?? ""}`}
        style={{ ...style, maskImage: undefined, WebkitMaskImage: undefined }}
      >
        <Stamp className="h-1/3 w-1/3 opacity-40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      style={style}
      onError={() => setHasError(true)}
    />
  );
}
