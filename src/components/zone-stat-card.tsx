import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { cva } from "class-variance-authority";

const cardStyles = cva("relative overflow-hidden transition-all duration-300 group hover:shadow-lg text-white", {
  variants: {
    size: {
      default: "min-w-[200px] flex-1",
      large: "min-w-[300px] flex-[1.5]",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface ZoneStatCardProps {
  zone: {
    id: string;
    label: string;
    emoji: string;
    bgColor: string;
  };
  stats: {
    count: number;
    total: number;
  };
  isDominant: boolean;
  isCurrent: boolean;
}

export function ZoneStatCard({ zone, stats, isDominant, isCurrent }: ZoneStatCardProps) {
  const percentage = Math.round((stats.count / stats.total) * 100) || 0;

  return (
    <Card className={cn(cardStyles({ size: isDominant ? "large" : "default" }), zone.bgColor, "backdrop-blur-sm")}>
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(circle at 100% 100%, 
            rgba(255,255,255,0.2) 0%, 
            rgba(255,255,255,0) 50%)`,
        }}
      />
      <CardContent className={cn("relative z-10", isDominant ? "p-6" : "p-5")}>
        {isCurrent && <div className="absolute -top-2 -right-2 bg-white text-black px-3 py-1 rounded-full text-xs font-bold shadow-md z-20">Current Zone</div>}
        <div className="flex items-center gap-4">
          <div className={cn("relative", "rounded-full p-2", "bg-white/10", "backdrop-blur-sm")}>
            <span className={cn("text-2xl", isDominant && "text-3xl")}>{zone.emoji}</span>
            {/* Circular progress indicator */}
            <svg className="absolute inset-0 -rotate-90" width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="15" strokeWidth="2" className="stroke-white/20" fill="none" />
              <circle cx="16" cy="16" r="15" strokeWidth="2" className="stroke-white" fill="none" strokeDasharray={94.2} strokeDashoffset={94.2 - (94.2 * percentage) / 100} />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className={cn("font-semibold truncate", isDominant ? "text-xl" : "text-lg")}>{zone.label}</h3>
              <div className={cn("font-bold tabular-nums", isDominant ? "text-2xl" : "text-xl")}>{percentage}%</div>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-sm text-white/80">{isDominant ? "Most frequent zone" : `${stats.count} reflections`}</p>
              {isDominant && <span className="text-sm font-medium bg-white/20 px-2 py-0.5 rounded-full">{stats.count} total</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
