"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// This is a simplified version. You'll need to process your actual data.
const data = [
  { date: "2024-01", tech: 20, nonTech: 15 },
  { date: "2024-02", tech: 25, nonTech: 18 },
  // ... more data points
]

export function SessionEngagementChart() {
  return (
    <ChartContainer
      config={{
        tech: {
          label: "Tech Sessions",
          color: "hsl(var(--chart-1))",
        },
        nonTech: {
          label: "Non-Tech Sessions",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="tech" stackId="a" fill="var(--color-tech)" />
          <Bar dataKey="nonTech" stackId="a" fill="var(--color-nonTech)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

