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
    color: "#22c55e",
  },
  late: {
    label: "Late",
    color: "#eab308",
  },
  absent: {
    label: "Absent",
    color: "#ef4444",
  },
  late_excused: {
    label: "Late (Excused)",
    color: "#3b82f6",
  },
  absent_excused: {
    label: "Absent (Excused)",
    color: "#6b7280",
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
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No attendance data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      <ChartContainer config={chartConfig} className="w-full">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={processedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis
              dataKey="displayDate"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
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
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label || name}:
                      </span>
                      <span className="font-medium">{value}</span>
                    </div>
                  )}
                />
              }
            />
            {showLegend && (
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label || value}
              />
            )}
            <Bar dataKey="present" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} name="present" />
            <Bar dataKey="late" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} name="late" />
            <Bar dataKey="absent" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} name="absent" />
            {hasExcused && (
              <>
                <Bar dataKey="late_excused" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="late_excused" />
                <Bar dataKey="absent_excused" stackId="a" fill="#6b7280" radius={[0, 0, 0, 0]} name="absent_excused" />
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

export function SimpleAttendanceChart({ data, height = 200 }: SimpleAttendanceChartProps) {
  const getColor = (type: string) => {
    switch (type) {
      case "present":
        return "#22c55e";
      case "late":
        return "#eab308";
      case "absent":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const processedData = data.map((item) => ({
    ...item,
    displayDate: formatDate(item.date),
    fill: getColor(item.type),
  }));

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="h-[${height}px] flex items-end gap-1">
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
            <p className="text-[10px] text-muted-foreground">{day.displayDate}</p>
          )}
        </div>
      ))}
    </div>
  );
}
