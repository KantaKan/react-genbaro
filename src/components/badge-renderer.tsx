import { motion } from "framer-motion";
import type { Badge } from "@/lib/types";

interface BadgeRendererProps {
  badge: Badge;
  className?: string;
  showTooltip?: boolean;
}

const pixelBorderStyle = "border-4 border-solid";

// Predefined color palette
export const badgeColors = [
  { name: "red", hex: "#EF4444", bg: "#EF4444", border: "#DC2626", text: "#FFFFFF", shadow: "#DC2626" },
  { name: "orange", hex: "#F97316", bg: "#F97316", border: "#EA580C", text: "#FFFFFF", shadow: "#EA580C" },
  { name: "yellow", hex: "#EAB308", bg: "#EAB308", border: "#CA8A04", text: "#000000", shadow: "#CA8A04" },
  { name: "green", hex: "#22C55E", bg: "#22C55E", border: "#16A34A", text: "#FFFFFF", shadow: "#16A34A" },
  { name: "blue", hex: "#3B82F6", bg: "#3B82F6", border: "#2563EB", text: "#FFFFFF", shadow: "#2563EB" },
  { name: "purple", hex: "#A855F7", bg: "#A855F7", border: "#9333EA", text: "#FFFFFF", shadow: "#9333EA" },
  { name: "pink", hex: "#EC4899", bg: "#EC4899", border: "#DB2777", text: "#FFFFFF", shadow: "#DB2777" },
  { name: "teal", hex: "#14B8A6", bg: "#14B8A6", border: "#0F766E", text: "#FFFFFF", shadow: "#0F766E" },
  { name: "gold", hex: "#FFD700", bg: "#FFD700", border: "#B8860B", text: "#000000", shadow: "#B8860B" },
  { name: "silver", hex: "#C0C0C0", bg: "#C0C0C0", border: "#808080", text: "#000000", shadow: "#808080" },
  { name: "bronze", hex: "#CD7F32", bg: "#CD7F32", border: "#8B4513", text: "#FFFFFF", shadow: "#8B4513" },
  { name: "gray", hex: "#6B7280", bg: "#6B7280", border: "#4B5563", text: "#FFFFFF", shadow: "#4B5563" },
];

// Pixel Badge Component (existing style)
function PixelBadge({ badge, className = "", showTooltip = true }: BadgeRendererProps) {
  // Use custom color if provided, otherwise fall back to name-based color logic
  const getPixelColors = (badgeName: string, customColor?: string) => {
    if (customColor) {
      // Find matching predefined color or create custom one
      const predefinedColor = badgeColors.find((c) => c.hex.toLowerCase() === customColor.toLowerCase());
      if (predefinedColor) return predefinedColor;

      // Create custom color scheme based on provided hex
      return {
        bg: customColor,
        border: customColor,
        text: "#FFFFFF", // Default to white text for custom colors
        shadow: customColor,
      };
    }

    // Original color logic for backward compatibility
    const colors = {
      gold: { bg: "#FFD700", border: "#B8860B", text: "#000000", shadow: "#B8860B" },
      silver: { bg: "#C0C0C0", border: "#808080", text: "#000000", shadow: "#808080" },
      bronze: { bg: "#CD7F32", border: "#8B4513", text: "#FFFFFF", shadow: "#8B4513" },
      blue: { bg: "#4169E1", border: "#1E3A8A", text: "#FFFFFF", shadow: "#1E3A8A" },
      green: { bg: "#32CD32", border: "#228B22", text: "#FFFFFF", shadow: "#228B22" },
      purple: { bg: "#9B59B6", border: "#6F3E8F", text: "#FFFFFF", shadow: "#6F3E8F" },
      red: { bg: "#E74C3C", border: "#C0392B", text: "#FFFFFF", shadow: "#C0392B" },
      orange: { bg: "#F39C12", border: "#D35400", text: "#FFFFFF", shadow: "#D35400" },
      pink: { bg: "#E91E63", border: "#C2185B", text: "#FFFFFF", shadow: "#C2185B" },
      teal: { bg: "#00BCD4", border: "#0097A7", text: "#000000", shadow: "#0097A7" },
    };

    const nameLower = badgeName.toLowerCase();
    if (nameLower.includes("first reflection")) return colors.gold;
    if (nameLower.includes("first")) return colors.gold;
    if (nameLower.includes("consistent")) return colors.silver;
    if (nameLower.includes("streak")) return colors.silver;
    if (nameLower.includes("insightful")) return colors.purple;
    if (nameLower.includes("insight")) return colors.purple;
    if (nameLower.includes("problem solver")) return colors.blue;
    if (nameLower.includes("problem")) return colors.blue;
    if (nameLower.includes("solver")) return colors.blue;
    if (nameLower.includes("great teammate")) return colors.green;
    if (nameLower.includes("great")) return colors.green;
    if (nameLower.includes("teammate")) return colors.green;
    if (nameLower.includes("team")) return colors.green;
    if (nameLower.includes("star performer")) return colors.gold;
    if (nameLower.includes("star")) return colors.gold;
    if (nameLower.includes("creative thinker")) return colors.pink;
    if (nameLower.includes("creative")) return colors.pink;
    if (nameLower.includes("thinker")) return colors.pink;
    if (nameLower.includes("helpful collaborator")) return colors.orange;
    if (nameLower.includes("helpful")) return colors.orange;
    if (nameLower.includes("collaborator")) return colors.orange;
    return colors.bronze; // Changed from orange to bronze as default
  };

  const colors = getPixelColors(badge.name, badge.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, type: "spring" }}
      className={`relative inline-flex items-center gap-2 px-4 py-2 ${pixelBorderStyle} ${className}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        boxShadow: `4px 4px 0px ${colors.shadow}`,
      }}
      title={showTooltip ? `${badge.type}: ${badge.name}` : undefined}
    >
      {/* Top-left corner pixel accent */}
      <div
        className="absolute top-0 left-0 w-1.5 h-1.5"
        style={{
          backgroundColor: colors.shadow,
          boxShadow: `1px 1px 0px ${colors.border}`,
        }}
      />

      {/* Icon/Emoji area with pixelated rendering */}
      <div className="flex items-center justify-center w-8 h-8 shrink-0">
        {badge.imageUrl ? (
          <img
            src={badge.imageUrl}
            alt={badge.name}
            className="w-full h-full object-contain"
            style={{
              imageRendering: "pixelated",
            }}
          />
        ) : (
          <span className="text-xl">{badge.emoji}</span>
        )}
      </div>

      {/* Badge name with pixel font */}
      <span
        className="font-bold text-sm uppercase tracking-wide"
        style={{
          textShadow: `2px 2px 0px ${colors.shadow}`,
        }}
      >
        {badge.name}
      </span>

      {/* Bottom-right pixel shadow effect */}
      <div className="absolute bottom-1 right-1 w-2 h-2 opacity-30" style={{ backgroundColor: colors.shadow }} />
    </motion.div>
  );
}

// Rounded Circle Badge Component (picture-only)
function RoundedBadge({ badge, className = "", showTooltip = true }: BadgeRendererProps) {
  const badgeColor = badge.color || "#3B82F6"; // Default blue if no color specified

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: "spring" }}
      className={`relative inline-flex items-center justify-center w-12 h-12 rounded-full border-2 ${className}`}
      style={{
        backgroundColor: badgeColor,
        borderColor: badgeColor,
        boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
      }}
      title={showTooltip ? `${badge.type}: ${badge.name}` : undefined}
    >
      {badge.imageUrl ? (
        <img
          src={badge.imageUrl}
          alt={badge.name}
          className="w-10 h-10 rounded-full object-cover"
          style={{
            objectPosition: "center",
            objectFit: "cover",
          }}
        />
      ) : (
        <span className="text-xl flex items-center justify-center">{badge.emoji}</span>
      )}

      {/* Subtle inner highlight - improved positioning */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "2px",
          left: "2px",
          right: "2px",
          bottom: "2px",
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
    </motion.div>
  );
}

// Minimal Dot Badge Component
function MinimalBadge({ badge, className = "", showTooltip = true }: BadgeRendererProps) {
  const badgeColor = badge.color || "#3B82F6"; // Default blue if no color specified

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`relative inline-flex items-center justify-center w-4 h-4 rounded-full ${className}`}
      style={{
        backgroundColor: badgeColor,
        boxShadow: `0 2px 4px rgba(0,0,0,0.1)`,
      }}
      title={showTooltip ? `${badge.type}: ${badge.name}` : undefined}
    >
      {/* Optional small inner dot for better visibility */}
      <div className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />
    </motion.div>
  );
}

// Main BadgeRenderer Component
export function BadgeRenderer({ badge, className = "", showTooltip = true }: BadgeRendererProps) {
  // Defensive programming - ensure badge exists and has required properties
  if (!badge) {
    console.error("BadgeRenderer received null/undefined badge");
    return null;
  }

  const style = badge.style || "pixel"; // Default to pixel style for backward compatibility

  switch (style) {
    case "rounded":
      return <RoundedBadge badge={badge} className={`${className} top-2 `} showTooltip={showTooltip} />;
    case "minimal":
      return <MinimalBadge badge={badge} className={className} showTooltip={showTooltip} />;
    case "pixel":
    default:
      return <PixelBadge badge={badge} className={className} showTooltip={showTooltip} />;
  }
}
