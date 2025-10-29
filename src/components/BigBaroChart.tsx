"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useQuery } from "react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBarometerData } from "@/lib/api";
import AdminReflectionsTable from "./admin-reflections-table";
import { Button } from "@/components/ui/button";
import LatestWeeklySummary from "./latest-weekly-summary";
import { Badge } from "@/components/ui/badge"; // New import
import { getDayBadge } from "@/utils/day-colors"; // New import

import { reflectionZones } from "./reflection-zones";

const CustomizedXAxisTick = ({ x, y, payload }) => {
  const { dayName } = getDayBadge(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-30} y={0} width={60} height={24}>
        <div className="flex justify-center">
          <Badge variant="outline">{dayName.slice(0, 3)}</Badge>
        </div>
      </foreignObject>
    </g>
  );
};


const chartConfig = Object.fromEntries(
  reflectionZones.map((zone, index) => [
    zone.label,
    {
      label: zone.label,
      color: `hsl(var(--chart-${index + 1}))`,
    },
  ])
) as ChartConfig;

export default function BaroChart({ userId }) {
  const [timeRange, setTimeRange] = React.useState("7d");
  const [view, setView] = React.useState<"chart" | "summary">("chart");

  const {
    data: rawChartData,
    isLoading,
    error,
  } = useQuery(["barometerData", timeRange], () => getBarometerData(timeRange), {
    refetchOnWindowFocus: false,
  });

  const chartData = React.useMemo(() => {
    if (!rawChartData) return [];
    return [...rawChartData].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [rawChartData]);

  const totalReflections = React.useMemo(() => {
    if (!chartData) return 0;
    return Math.round(
      chartData.reduce((total, dayData) => {
        return (
          total +
          Object.keys(dayData).reduce(
            (dayTotal, key) =>
              key === "date" ? dayTotal : dayTotal + (dayData[key] || 0),
            0
          )
        );
      }, 0)
    );
  }, [chartData]);

  const todayReflections = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;

    const today = new Date();
    const todayFormatted = today.toISOString().split("T")[0]; // YYYY-MM-DD

    const todayData = chartData.find((day) => day.date === todayFormatted);

    if (!todayData) return 0;

    return Math.round(
      Object.keys(todayData).reduce(
        (dayTotal, key) =>
          key === "date" ? dayTotal : dayTotal + (todayData[key] || 0),
        0
      )
    );
  }, [chartData]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-red-500">Error loading reflection data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Reflection Zones - Interactive</CardTitle>
          <CardDescription>
            {view === "chart"
              ? `Showing daily reflection zones for the last ${timeRange === "90d" ? "3 months" : timeRange === "30d" ? "30 days" : "7 days"}`
              : "Showing the latest weekly summary of at-risk learners"}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === 'chart' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('chart')}>Chart</Button>
          <Button variant={view === 'summary' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('summary')}>Summary</Button>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange} disabled={view === "summary"}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a time range">
            <SelectValue placeholder="Last 7 days" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {view === "chart" ? (
          <>
            <div className="text-center mb-4">
              <div className="flex justify-center gap-8">
                <div>
                  <div className="text-4xl font-bold">
                    {totalReflections}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Reflections
                  </div>
                </div>
                <div>
                  <div className="text-4xl font-bold">
                    {todayReflections}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Today's Reflections
                  </div>
                </div>
              </div>
            </div>
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  {Object.entries(chartConfig).map(([key, value]) => (
                    <linearGradient key={key} id={`fill${key.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={value.color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={value.color} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        if (isNaN(date.getTime())) {
                          return "Invalid Date";
                        }
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                      indicator="dot"
                    />
                  }
                />
                {Object.keys(chartConfig)
                  .reverse()
                  .map((key) => (
                    <Area key={key} dataKey={key} type="natural" fill={`url(#fill${key.replace(/\s+/g, "")})`} stroke={chartConfig[key].color} stackId="a" />
                  ))}
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
            <AdminReflectionsTable />
          </>
        ) : (
          <>
            <LatestWeeklySummary />
            <AdminReflectionsTable />
          </>
        )}
      </CardContent>
    </Card>
  );
}

