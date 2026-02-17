import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const reflectionZones = [
  {
    id: "comfort",
    label: "Comfort Zone",
    bgColor: "bg-chart-2",
    emoji: "😸",
    description: "Where you feel safe and in control. Tasks are easy and familiar.",
  },
  {
    id: "stretch-enjoying",
    label: "Stretch zone - Enjoying the challenges",
    bgColor: "bg-chart-4",
    emoji: "😺",
    description: "Pushing your boundaries, feeling challenged but excited.",
  },
  {
    id: "stretch-overwhelmed",
    label: "Stretch zone - Overwhelmed",
    bgColor: "bg-chart-1",
    emoji: "😿",
    description: "Feeling stressed, but still learning and growing.",
  },
  {
    id: "panic",
    label: "Panic Zone",
    bgColor: "bg-destructive",
    emoji: "🙀",
    description: "Feeling extreme stress or fear. Learning is difficult here.",
  },
  {
    id: "no-data",
    label: "No Data",
    bgColor: "bg-muted",
    emoji: "❌",
    description: "Insufficient information to categorize the experience.",
  },
] as const;

type ReflectionZone = typeof reflectionZones[number];

type BarometerVisualProps = {
  barometer?: string;
  zone?: ReflectionZone;
  variant?: "inline" | "full";
  size?: "sm" | "md";
  showTooltip?: boolean;
  className?: string;
};

export const BarometerVisual = ({
  barometer,
  zone: zoneProp,
  variant = "inline",
  size = "md",
  showTooltip = true,
  className,
}: BarometerVisualProps) => {
  const zone = zoneProp || (barometer ? reflectionZones.find((z) => z.label === barometer) : null);
  if (!zone || barometer === "-") return <span>{barometer || "-"}</span>;

  const layoutClass =
    variant === "full"
      ? "flex w-full justify-center min-w-0"
      : "inline-flex";

  const sizeClass =
    size === "sm" ? "gap-1.5 px-2 py-0.5 text-xs" : "gap-2 px-3 py-1.5";

  const emojiClass = size === "sm" ? "text-sm" : "text-base";

  const barometerContent = (
    <div className="cursor-pointer">
      <motion.div
        className={`${layoutClass} items-center ${sizeClass} rounded-md ${zone.bgColor} bg-opacity-15 transition-all duration-300 ${className || ""}`}
        whileHover={{
          scale: 1.05,
        }}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.span
          className={emojiClass}
          animate={{
            rotate: [0, 10, 0, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        >
          {zone.emoji}
        </motion.span>
        {size !== "sm" && (
          <span
            className={`font-medium text-sm ${variant === "full" ? "truncate" : ""}`}
          >
            {zone.label}
          </span>
        )}
      </motion.div>
    </div>
  );

  if (!showTooltip) {
    return barometerContent;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {barometerContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{zone.emoji} {zone.label}</p>
            <p className="text-sm text-muted-foreground">{zone.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};