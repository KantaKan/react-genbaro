"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
const chartData = [
  { month: "EOW", desktop: 38 },
  { month: "Mon", desktop: 39 },
  { month: "Tue", desktop: 37 },
  { month: "Wed", desktop: 36 },
  { month: "Thu", desktop: 35 },
  { month: "Fri", desktop: 34 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function FillChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart</CardTitle>
        <CardDescription>1 Jan, 2025 - 8 Jan, 2025</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          ผู้เรียนกรอกฟอร์มเพิ่มขึ้นจากสัปดาห์เก่า 8% <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">กราฟแสดงจำนวนผู้เรียนกรอกฟอร์มต่อวัน</div>
      </CardFooter>
    </Card>
  );
}
