import { motion } from "framer-motion";

import { BOARD_REACTION_URLS, getBoardReactionCounts, type BoardReaction } from "@/lib/board";
import { cn } from "@/lib/utils";

interface BoardReactionSummaryProps {
  reactions?: BoardReaction[];
  currentReaction?: string;
  bouncingReaction?: string | null;
  className?: string;
  itemClassName?: string;
  animated?: boolean;
}

export function BoardReactionSummary({
  reactions = [],
  currentReaction,
  bouncingReaction,
  className,
  itemClassName,
  animated = false,
}: BoardReactionSummaryProps) {
  const reactionCounts = getBoardReactionCounts(reactions);
  const entries = Object.entries(reactionCounts);

  if (entries.length === 0) {
    return null;
  }

  const Item = animated ? motion.div : "div";

  return (
    <div className={className}>
      {entries.map(([type, count]) => (
        <Item
          key={type}
          {...(animated ? { whileTap: { scale: 0.95 } } : {})}
          className={cn(itemClassName, currentReaction === type && "ring-2 ring-primary/50")}
        >
          {BOARD_REACTION_URLS[type] ? (
            <img
              src={BOARD_REACTION_URLS[type]}
              alt={type}
              className={cn("w-5 h-5", bouncingReaction === type && "reaction-bounce")}
            />
          ) : (
            <span className="text-sm">{type}</span>
          )}
          <span className="text-xs font-medium">{count}</span>
        </Item>
      ))}
    </div>
  );
}
