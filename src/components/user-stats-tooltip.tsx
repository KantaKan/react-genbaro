import { TooltipContent } from "@/components/ui/tooltip"


import type { Zone } from "../lib/types";


interface UserStats {
  totalEntries: number
  zoneBreakdown: {
    zone: Zone
    count: number
    percentage: number
  }[]
  mostFrequentZone: {
    zone: Zone
    count: number
    percentage: number
  }
  username: string
}

interface UserStatsTooltipProps {
  stats: UserStats
  zones: {
    id: Zone
    label: string
    emoji: string
  }[]
}

export function UserStatsTooltip({ stats, zones }: UserStatsTooltipProps) {
  const mostFrequentZone = zones.find(z => z.id === stats.mostFrequentZone.zone)

  return (
    <TooltipContent className="w-64">
      <div className="space-y-2">
        <p className="font-medium">{stats.username}</p>
        <div className="text-sm">
          <p className="text-muted-foreground">Total Entries: {stats.totalEntries}</p>
          <p className="mt-1">Most Frequent Zone:</p>
          <p className="flex items-center gap-1">
            {mostFrequentZone?.emoji} {mostFrequentZone?.label}
            <span className="text-muted-foreground ml-1">
              ({stats.mostFrequentZone.percentage.toFixed(1)}%)
            </span>
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-1">Zone Breakdown:</p>
          {stats.zoneBreakdown.map(({ zone, count, percentage }) => {
            const zoneInfo = zones.find(z => z.id === zone)
            if (!zoneInfo || count === 0) return null
            
            return (
              <p key={zone} className="flex items-center gap-1 text-muted-foreground">
                {zoneInfo.emoji} {count} ({percentage.toFixed(1)}%)
              </p>
            )
          })}
        </div>
      </div>
    </TooltipContent>
  )
}
