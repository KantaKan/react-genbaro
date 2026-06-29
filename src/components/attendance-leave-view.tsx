"use client";

import { useAttendanceContext } from "./attendance-shell";
import { LeaveRequestsTable } from "./leave-requests-table";

export function AttendanceLeaveView() {
  const { selectedCohort } = useAttendanceContext();

  return (
    <LeaveRequestsTable cohort={selectedCohort} />
  );
}
