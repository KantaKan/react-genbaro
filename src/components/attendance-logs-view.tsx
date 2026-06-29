"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAttendanceContext } from "./attendance-shell";
import { AttendanceLogsSection } from "./attendance/attendance-logs-section";
import { useAttendanceLogs } from "@/application/hooks/useAttendance";

export function AttendanceLogsView() {
  const { selectedCohort, selectedDate, handleDeleteFromLogs } = useAttendanceContext();
  const cohortNum = parseInt(selectedCohort);
  const logsQuery = useAttendanceLogs(cohortNum, selectedDate, 1, 50, true);
  const logsData = (logsQuery.data as { logs?: any[] } | undefined)?.logs ?? [];

  if (logsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-[hsl(var(--muted-foreground))] font-register-body text-sm">
          Loading logs...
        </CardContent>
      </Card>
    );
  }

  return (
    <AttendanceLogsSection
      logs={logsData}
      onDelete={handleDeleteFromLogs}
    />
  );
}
