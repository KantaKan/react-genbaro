import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { cva } from "class-variance-authority";

const cardStyles = cva("relative overflow-hidden transition-all duration-300 group hover:shadow-md", {
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
    <Card className={cn(cardStyles({ size: isDominant ? "large" : "default" }), zone.bgColor, "backdrop-blur-sm border-0")}>
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 100% 100%, 
            rgba(255,255,255,0.3) 0%, 
            rgba(255,255,255,0) 60%)`,
        }}
      />
      <CardContent className={cn("relative z-10", isDominant ? "p-6" : "p-5")}>
        {isCurrent && (
          <div 
            className="absolute -top-2 -right-2 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md z-20"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Today
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className={cn("relative", "rounded-full p-3", "bg-white/15", "backdrop-blur-sm")}>
            <span className={cn("text-3xl", isDominant && "text-4xl")}>{zone.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <h3 
                className={cn("font-semibold truncate", isDominant ? "text-xl" : "text-lg")}
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {zone.label}
              </h3>
              <div className={cn("font-bold tabular-nums", isDominant ? "text-3xl" : "text-2xl")}>{percentage}%</div>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <p className="text-sm text-white/70">
                {isDominant ? "Your dominant zone" : `${stats.count} reflection${stats.count !== 1 ? 's' : ''}`}
              </p>
              {isDominant && (
                <span className="text-sm font-medium bg-white/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {stats.count} total
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
