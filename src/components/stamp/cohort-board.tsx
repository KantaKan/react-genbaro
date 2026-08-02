import { Lock, Stamp as StampIcon } from "lucide-react";

import { DeleteStampButton } from "@/components/stamp/delete-stamp-button";
import { StampImage } from "@/components/stamp/stamp-image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { STAMP_W } from "@/lib/stamp-mask";
import { deterministicOffset, deterministicRotation } from "@/lib/stamp-rotation";
import type { Stamp } from "@/lib/stamp";

interface CohortBoardProps {
  stamps: Stamp[];
  isLocked: boolean;
  canDelete?: boolean;
  userId?: string | null;
}

const STAMP_SIZE = STAMP_W * 0.6;

function formatStampDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CohortBoard({ stamps, isLocked, canDelete = false, userId }: CohortBoardProps) {
  if (stamps.length === 0) {
    return (
      <div className="stamp-board-shell paper-texture px-6 py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <StampIcon className="h-10 w-10 text-primary/50" />
          </div>
          <h3 className="font-handwriting text-3xl">No stamps yet</h3>
          <p className="text-muted-foreground mt-2">Be the first to stamp your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div>
        {isLocked && (
          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 rounded-lg bg-muted text-muted-foreground text-sm">
            <Lock className="h-4 w-4" />
            This board is closed. Stamps can no longer be added.
          </div>
        )}

        <div className="stamp-board-shell paper-texture px-4 py-10 sm:px-6">
          <div
            className="grid gap-x-5 gap-y-7 place-items-center"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}
          >
            {stamps.map((stamp, index) => {
              const isMine = Boolean(userId && stamp.ownerId === userId);
              return (
                <div
                  key={stamp.id}
                  className="animate-stamp-stagger"
                  style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}
                >
                  <div
                    className="relative"
                    style={{ transform: `translateY(${deterministicOffset(stamp.id)}px)` }}
                  >
                    {canDelete && (
                      <div className="absolute -right-2 -top-2 z-10">
                        <DeleteStampButton
                          cohortNumber={stamp.cohortNumber}
                          stampId={stamp.id}
                        />
                      </div>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer">
                          <StampImage
                            src={stamp.imageUrl}
                            alt={`Stamp from ${formatStampDate(stamp.createdAt)}`}
                            rotationDeg={deterministicRotation(stamp.id, 10)}
                            size={STAMP_SIZE}
                            className="rounded-sm shadow-lg drop-shadow-[0_4px_8px_rgba(0,0,0,0.18)] transition-[filter] duration-200 hover:drop-shadow-[0_10px_16px_rgba(0,0,0,0.28)]"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {isMine ? "You" : "Cohort mate"} · {formatStampDate(stamp.createdAt)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    {isMine && (
                      <span className="absolute left-1/2 -translate-x-1/2 -bottom-2.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
                        You
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
