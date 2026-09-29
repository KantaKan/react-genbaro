export type FarmLighting = "morning" | "day" | "evening" | "night";

export function farmLightingForDate(date: Date): FarmLighting {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", hourCycle: "h23" }).format(date));
  if (hour < 6 || hour >= 20) return "night";
  if (hour < 10) return "morning";
  if (hour < 17) return "day";
  return "evening";
}
