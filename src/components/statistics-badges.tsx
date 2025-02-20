import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Zone } from "../emoji-zone-table"

interface ZoneStats {
  zone: Zone
  count: number
  percentage: number
}

interface StatisticsBadgesProps {
  stats: ZoneStats[]
  total: number
  zones: {
    id: Zone
    label: string
    emoji: string
    bgColor: string
  }[]
}

export function StatisticsBadges({ stats, total, zones }: StatisticsBadgesProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <Card className="p-4">
        <div className="text-sm font-medium mb-2">Zone Distribution</div>
        <div className="flex flex-wrap gap-2">
          {stats.map((stat) => {
            const zone = zones.find((z) => z.id === stat.zone)
            if (!zone) return null
            
            return (
              <TooltipProvider key={stat.zone}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className={`${zone.bgColor} cursor-help`}>
                      <span className="mr-1">{zone.emoji}</span>
                      {stat.count}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{zone.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.percentage.toFixed(1)}% of total entries
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
          <Badge variant="outline">
            Total: {total}
          </Badge>
        </div>
      </Card>
    </div>
  )
}
