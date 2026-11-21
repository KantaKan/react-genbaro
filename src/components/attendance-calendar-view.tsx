"use client";

import { useAttendanceContext } from "./attendance-shell";
import { AdminAttendanceCalendar } from "./admin-attendance-calendar";

export function AttendanceCalendarView() {
  const { selectedCohort, holidays, handleCalendarDayClick } = useAttendanceContext();
  const cohortNum = parseInt(selectedCohort);

  return (
    <AdminAttendanceCalendar
      cohort={cohortNum}
      onDayClick={handleCalendarDayClick}
      holidays={holidays}
    />
  );
}
