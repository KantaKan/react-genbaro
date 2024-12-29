"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const chartData = [
  { date: "2024-04-01", "Comfort Zone": 8, "Panic Zone": 7, "Stretch Zone - Enjoying the Challenges": 10, "Stretch Zone - Overwhelmed": 7 },
  { date: "2024-04-02", "Comfort Zone": 6, "Panic Zone": 9, "Stretch Zone - Enjoying the Challenges": 8, "Stretch Zone - Overwhelmed": 5 },
  { date: "2024-04-03", "Comfort Zone": 9, "Panic Zone": 8, "Stretch Zone - Enjoying the Challenges": 7, "Stretch Zone - Overwhelmed": 6 },
  { date: "2024-04-04", "Comfort Zone": 7, "Panic Zone": 6, "Stretch Zone - Enjoying the Challenges": 8, "Stretch Zone - Overwhelmed": 9 },
  // Add more data for the remaining dates in the same format...
];

const chartConfig = {
  "Comfort Zone": {
    label: "Comfort Zone",
    color: "hsl(var(--chart-1))",
  },
  "Panic Zone": {
    label: "Panic Zone",
    color: "hsl(var(--chart-2))",
  },
  "Stretch Zone - Enjoying the Challenges": {
    label: "Stretch Zone - Enjoying the Challenges",
    color: "hsl(var(--chart-3))",
  },
  "Stretch Zone - Overwhelmed": {
    label: "Stretch Zone - Overwhelmed",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function Component() {
  const [timeRange, setTimeRange] = React.useState("90d");

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Reflection Zones - Interactive</CardTitle>
          <CardDescription>Showing daily reflection zones for the last 3 months</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a value">
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillComfortZone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-comfort-zone)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-comfort-zone)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillPanicZone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-panic-zone)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-panic-zone)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillStretchZoneEnjoying" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-stretch-zone-enjoying)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-stretch-zone-enjoying)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillStretchZoneOverwhelmed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-stretch-zone-overwhelmed)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-stretch-zone-overwhelmed)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area dataKey="Stretch Zone - Enjoying the Challenges" type="natural" fill="url(#fillStretchZoneEnjoying)" stroke="var(--color-stretch-zone-enjoying)" stackId="a" />
            <Area dataKey="Stretch Zone - Overwhelmed" type="natural" fill="url(#fillStretchZoneOverwhelmed)" stroke="var(--color-stretch-zone-overwhelmed)" stackId="a" />
            <Area dataKey="Panic Zone" type="natural" fill="url(#fillPanicZone)" stroke="var(--color-panic-zone)" stackId="a" />
            <Area dataKey="Comfort Zone" type="natural" fill="url(#fillComfortZone)" stroke="var(--color-comfort-zone)" stackId="a" />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
