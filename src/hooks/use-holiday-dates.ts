import { useMemo } from "react";
import { useQuery } from "react-query";
import { leaveService } from "@/application/services/leaveService";
import type { Holiday } from "@/domain/types";

export function expandHolidayDates(holidays: Holiday[]): Set<string> {
  const dates = new Set<string>();
  for (const holiday of holidays) {
    const start = new Date(`${holiday.start_date}T00:00:00Z`);
    const end = new Date(`${holiday.end_date}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
    for (const day = start; day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
      dates.add(day.toISOString().slice(0, 10));
    }
  }
  return dates;
}

export function useHolidayDates(): Set<string> | undefined {
  const query = useQuery(["workdayHolidays"], () => leaveService.getHolidays(), { staleTime: 5 * 60 * 1000 });
  return useMemo(() => query.data ? expandHolidayDates(query.data) : undefined, [query.data]);
}
