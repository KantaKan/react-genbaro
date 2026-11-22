import { useId, useState } from "react";
import { motion } from "framer-motion";

export interface MedalProps {
  name: string;
  sub?: string;
  color?: string; // face color; rim is derived
  glyph?: string; // short text (e.g. "12") or emoji-free initial
  emoji?: string; // a badge's emoji, drawn on the medal
  imageUrl?: string; // a badge's picture, clipped to the medal
  locked?: boolean;
  progress?: number; // 0..1 for locked medals
}

export function Medal({ name, sub, color = "#6366f1", glyph, emoji, imageUrl, locked, progress = 0 }: MedalProps) {
  const id = useId();
  const [spin, setSpin] = useState(0);
  const C = 2 * Math.PI * 35;
  return (
    <button type="button" className="flex flex-col items-center gap-1.5 text-center" onClick={() => !locked && setSpin((s) => s + 360)} aria-label={`${name}${locked ? " (locked)" : ""}`}>
      <motion.svg
        viewBox="0 0 76 76"
        width={68}
        height={68}
        animate={{ rotateY: spin }}
        whileHover={locked ? undefined : { rotateY: spin + 18, rotateX: -6 }}
        transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
        style={{ filter: locked ? "none" : "drop-shadow(0 8px 10px rgba(24,24,27,.14))" }}
      >
        {locked ? (
          <>
            <circle cx="38" cy="38" r="35" fill="none" stroke="var(--l-hair)" strokeWidth="3" />
            <circle cx="38" cy="38" r="35" fill="none" stroke="var(--l-ink)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${C * progress} ${C}`} transform="rotate(-90 38 38)" />
            <circle cx="38" cy="38" r="27" fill="var(--l-sub)" stroke="var(--l-hair)" />
          </>
        ) : (
          <>
            <defs>
              <radialGradient id={id} cx="38%" cy="25%" r="85%">
                <stop offset="0" stopColor="#fff" stopOpacity=".55" />
                <stop offset=".35" stopColor={color} />
                <stop offset="1" stopColor={color} />
              </radialGradient>
            </defs>
            <circle cx="38" cy="38" r="35" fill={color} opacity=".55" />
            <circle cx="38" cy="38" r="28" fill={`url(#${id})`} />
            <ellipse cx="30" cy="20" rx="18" ry="8" fill="#fff" opacity=".22" />
          </>
        )}
        {!locked && imageUrl ? (
          <>
            <clipPath id={`${id}-clip`}>
              <circle cx="38" cy="38" r="26" />
            </clipPath>
            <image href={imageUrl} x="12" y="12" width="52" height="52" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-clip)`} />
          </>
        ) : !locked && emoji ? (
          <text x="38" y="47" textAnchor="middle" fontSize="26">
            {emoji}
          </text>
        ) : (
          glyph && (
            <text x="38" y="46" textAnchor="middle" fontSize="20" fontWeight="800" fill={locked ? "var(--l-ink3)" : "#fff"}>
              {glyph}
            </text>
          )
        )}
      </motion.svg>
      <span className="text-[12px] font-semibold leading-tight">{name}</span>
      {sub && <span className="text-[11px] text-l-ink3">{sub}</span>}
    </button>
  );
}
