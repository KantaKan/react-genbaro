import { motion } from "framer-motion";
import type { Badge } from "@/lib/types";

interface PixelBadgeProps {
  badge: Badge;
  className?: string;
}

const pixelBorderStyle = "border-4 border-solid";

export function PixelBadge({ badge, className = "" }: PixelBadgeProps) {
  const getPixelColors = (badgeName: string) => {
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
    return colors.bronze;
  };

  const colors = getPixelColors(badge.name);

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
      title={`${badge.type}: ${badge.name}`}
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
      <div
        className="absolute bottom-1 right-1 w-2 h-2 opacity-30"
        style={{ backgroundColor: colors.shadow }}
      />
    </motion.div>
  );
}
