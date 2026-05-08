import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { MouseEvent } from "react";

import { BOARD_REACTIONS } from "@/lib/board";
import { cn } from "@/lib/utils";

interface BoardReactionPickerProps {
  currentReaction?: string;
  hasReaction: boolean;
  onReact: (event: MouseEvent, reaction: string) => void;
  onRemove: (event: MouseEvent) => void;
  className?: string;
  reactionClassName?: string;
  removeClassName?: string;
  animated?: boolean;
}

export function BoardReactionPicker({
  currentReaction,
  hasReaction,
  onReact,
  onRemove,
  className,
  reactionClassName,
  removeClassName,
  animated = false,
}: BoardReactionPickerProps) {
  const Wrapper = animated ? motion.div : "div";
  const ReactionButton = animated ? motion.button : "button";
  const RemoveButton = animated ? motion.button : "button";

  return (
    <Wrapper
      {...(animated
        ? {
            initial: { opacity: 0, y: 10, scale: 0.9 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, y: 10, scale: 0.9 },
          }
        : {})}
      className={className}
      onClick={(event) => event.stopPropagation()}
    >
      {BOARD_REACTIONS.map((reaction) => (
        <ReactionButton
          key={reaction.name}
          onClick={(event) => onReact(event, reaction.name)}
          {...(animated ? { whileHover: { scale: 1.2 }, whileTap: { scale: 0.9 } } : {})}
          className={cn(reactionClassName, currentReaction === reaction.name && "ring-2 ring-blue-500 rounded-full")}
          title={currentReaction === reaction.name ? "Current reaction" : `React with ${reaction.name}`}
        >
          <img src={reaction.url} alt={reaction.name} className={animated ? "w-7 h-7" : "w-8 h-8"} />
        </ReactionButton>
      ))}
      {hasReaction && (
        <RemoveButton
          onClick={onRemove}
          {...(animated
            ? {
                initial: { scale: 0 },
                animate: { scale: 1 },
                whileHover: { scale: 1.1 },
                whileTap: { scale: 0.9 },
              }
            : {})}
          className={removeClassName}
          title="Remove reaction"
        >
          <X className="h-4 w-4" />
        </RemoveButton>
      )}
    </Wrapper>
  );
}
