import { useState } from "react";
import { useQueryClient } from "react-query";
import { AwardBadgeButton } from "@/components/award-badge-button";
import type { OverviewBadge } from "../../wellbeing";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" });

function Tile({ b }: { b: OverviewBadge }) {
  const [broken, setBroken] = useState(false);
  return (
    <span title={`${b.name} · ${when(b.awarded_at)}`} className="grid h-[26px] w-[26px] place-items-center overflow-hidden rounded-lg bg-l-card text-sm shadow-[0_0_0_1px_var(--l-hair)]">
      {b.style === "image" && b.image_url && !broken ? <img src={b.image_url} alt={b.name} className="h-full w-full object-cover" onError={() => setBroken(true)} /> : b.emoji}
    </span>
  );
}

export function BadgeTiles({ badges, userId }: { badges: OverviewBadge[]; userId: string }) {
  const qc = useQueryClient();
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1">
      {badges.map((b, i) => (
        <Tile key={b.id ?? i} b={b} />
      ))}
      <span className="ml-1.5">
        <AwardBadgeButton userId={userId} onBadgeAwarded={() => qc.invalidateQueries(["admin-overview", userId])} />
      </span>
    </div>
  );
}
