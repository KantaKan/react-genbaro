"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface AttendanceChartData {
  date: string;
  present: number;
  late: number;
  absent: number;
  late_excused?: number;
  absent_excused?: number;
}

interface AttendanceChartProps {
  data: AttendanceChartData[];
  title?: string;
  showLegend?: boolean;
  height?: number;
}

const chartConfig: ChartConfig = {
  present: {
    label: "Present",
    color: "hsl(var(--register-stamp-present))",
  },
  late: {
    label: "Late",
    color: "hsl(var(--register-stamp-late))",
  },
  absent: {
    label: "Absent",
    color: "hsl(var(--register-stamp-absent))",
  },
  late_excused: {
    label: "Late (Excused)",
    color: "hsl(var(--register-stamp-excused))",
  },
  absent_excused: {
    label: "Absent (Excused)",
    color: "hsl(var(--register-stamp-excused))",
  },
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatFullDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

export function AttendanceChart({ data, title, showLegend = true, height = 300 }: AttendanceChartProps) {
  const processedData = data.map((item) => ({
    ...item,
    displayDate: formatDate(item.date),
    fullDate: formatFullDate(item.date),
  }));

  const hasExcused = data.some((d) => (d.late_excused || 0) > 0 || (d.absent_excused || 0) > 0);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] font-register-body text-sm text-[hsl(var(--muted-foreground))]">
        No attendance data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {title && <h3 className="font-register-heading text-sm">{title}</h3>}
      <ChartContainer config={chartConfig} className="w-full">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={processedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-[hsl(var(--border))]" />
            <XAxis
              dataKey="displayDate"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
            <Tooltip
              content={
                <ChartTooltipContent
                  labelKey="fullDate"
                  formatter={(value, name) => (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: chartConfig[name as keyof typeof chartConfig]?.color }}
                      />
                      <span className="text-[hsl(var(--muted-foreground))] font-register-body text-xs">
                        {chartConfig[name as keyof typeof chartConfig]?.label || name}:
                      </span>
                      <span className="font-register-mono text-xs font-medium text-[hsl(var(--foreground))]">{value}</span>
                    </div>
                  )}
                />
              }
            />
            {showLegend && (
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="font-register-body text-xs text-[hsl(var(--foreground))]">
                    {chartConfig[value as keyof typeof chartConfig]?.label || value}
                  </span>
                )}
              />
            )}
            <Bar
              dataKey="present"
              stackId="a"
              fill="hsl(var(--register-stamp-present))"
              radius={[0, 0, 0, 0]}
              name="present"
            />
            <Bar
              dataKey="late"
              stackId="a"
              fill="hsl(var(--register-stamp-late))"
              radius={[0, 0, 0, 0]}
              name="late"
            />
            <Bar
              dataKey="absent"
              stackId="a"
              fill="hsl(var(--register-stamp-absent))"
              radius={[0, 0, 0, 0]}
              name="absent"
            />
            {hasExcused && (
              <>
                <Bar
                  dataKey="late_excused"
                  stackId="a"
                  fill="hsl(var(--register-stamp-excused))"
                  radius={[0, 0, 0, 0]}
                  name="late_excused"
                />
                <Bar
                  dataKey="absent_excused"
                  stackId="a"
                  fill="hsl(var(--register-stamp-excused))"
                  radius={[0, 0, 0, 0]}
                  opacity={0.6}
                  name="absent_excused"
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

interface SimpleAttendanceChartProps {
  data: { date: string; value: number; type: "present" | "absent" | "late" }[];
  height?: number;
}

const typeColor: Record<string, string> = {
  present: "hsl(var(--register-stamp-present))",
  late: "hsl(var(--register-stamp-late))",
  absent: "hsl(var(--register-stamp-absent))",
};

export function SimpleAttendanceChart({ data, height = 200 }: SimpleAttendanceChartProps) {
  const processedData = data.map((item) => ({
    ...item,
    displayDate: formatDate(item.date),
    fill: typeColor[item.type] || "hsl(var(--muted-foreground))",
  }));

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ height: `${height}px` }} className="flex items-end gap-1">
      {processedData.map((day, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t transition-all hover:opacity-80"
            style={{
              backgroundColor: day.fill,
              height: `${(day.value / maxValue) * (height - 40)}px`,
              minHeight: day.value > 0 ? "4px" : "0",
            }}
            title={`${day.displayDate}: ${day.value} ${day.type}`}
          />
          {index % Math.ceil(data.length / 7) === 0 && (
            <p className="font-register-mono text-[10px] text-[hsl(var(--muted-foreground))]">{day.displayDate}</p>
          )}
        </div>
      ))}
    </div>
  );
}
