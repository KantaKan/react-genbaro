import React from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import { Sprout, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonWarm } from "@/components/loading-skeleton";
import { getMyGenmateGarden } from "@/lib/api";
import { mapGenmateMembers } from "@/lib/genmate-garden";
import { SeedlingPlant } from "@/components/streak-components";

const MiniPlant = ({ member }: { member: ReturnType<typeof mapGenmateMembers>[number] }) => {
  const fullName = `${member.user.first_name} ${member.user.last_name}`.trim() || "Unknown learner";

  return (
    <button
      type="button"
      title={`${fullName}: ${member.displayStreak > 0 ? `${member.displayStreak}-day streak` : "no active streak"}`}
      className="flex flex-col items-center gap-0.5 cursor-pointer rounded-lg border border-transparent p-1.5 transition-colors hover:border-border hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <SeedlingPlant
        tier={member.tier}
        active={member.streakData.hasCurrentStreak}
        variant={member.variant}
        showParticles={false}
        className="h-8 w-7 flex-shrink-0"
      />
      <span className="max-w-12 truncate text-[10px] font-medium">
        {member.user.first_name}
      </span>
    </button>
  );
};

const LearnerGenmateGardenWidget: React.FC = () => {
  const { data, isLoading, isError } = useQuery(
    ["learnerGenmateGarden"],
    getMyGenmateGarden
  );

  if (isLoading) {
    return (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3">
        <SkeletonWarm className="h-4 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonWarm key={i} className="h-10 w-9 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError || !data || data.length === 0) {
    return null;
  }

  const members = mapGenmateMembers(data);
  const groupName = members[0]?.user.genmate_group ?? "Genmate Garden";

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3">
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        <Sprout className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        Genmate Garden
        <span className="font-normal text-muted-foreground">
          · {groupName} · {members.length} member{members.length === 1 ? "" : "s"}
        </span>
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {members.map((member) => (
          <MiniPlant key={member.user._id} member={member} />
        ))}
      </div>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="ml-auto h-7 gap-1 px-2 text-xs"
      >
        <Link to="/learner/garden">
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
};

export default LearnerGenmateGardenWidget;
