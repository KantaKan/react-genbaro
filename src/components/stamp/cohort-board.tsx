import { Lock, Stamp as StampIcon } from "lucide-react";

import { DeleteStampButton } from "@/components/stamp/delete-stamp-button";
import { StampImage } from "@/components/stamp/stamp-image";
import { STAMP_W } from "@/lib/stamp-mask";
import { deterministicRotation } from "@/lib/stamp-rotation";
import type { Stamp } from "@/lib/stamp";

interface CohortBoardProps {
  stamps: Stamp[];
  isLocked: boolean;
  canDelete?: boolean;
}

export function CohortBoard({ stamps, isLocked, canDelete = false }: CohortBoardProps) {
  if (stamps.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <StampIcon className="h-10 w-10 text-primary/50" />
        </div>
        <h3 className="text-xl font-semibold">No stamps yet</h3>
        <p className="text-muted-foreground mt-2">Be the first to stamp your progress!</p>
      </div>
    );
  }

  return (
    <div>
      {isLocked && (
        <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 rounded-lg bg-muted text-muted-foreground text-sm">
          <Lock className="h-4 w-4" />
          This board is closed. Stamps can no longer be added.
        </div>
      )}

      <div
        className="grid gap-4 place-items-center"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}
      >
        {stamps.map((stamp) => (
          <div key={stamp.id} className="relative">
            {canDelete && (
              <div className="absolute -right-2 -top-2 z-10">
                <DeleteStampButton cohortNumber={stamp.cohortNumber} stampId={stamp.id} />
              </div>
            )}
            <StampImage
              src={stamp.imageUrl}
              alt={`Stamp from ${new Date(stamp.createdAt).toLocaleDateString()}`}
              rotationDeg={deterministicRotation(stamp.id)}
              size={STAMP_W * 0.55}
              className="rounded-sm shadow-md transition-transform hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
