"use client";

import { AttendanceRegisterGrid } from "./attendance/attendance-register-grid";
import { useAttendanceContext } from "./attendance-shell";

export function AttendanceRegisterView() {
  const ctx = useAttendanceContext();
  const { overview, overviewQuery, selectedDate, holidayToday, isMutating,
    handleMarkAllPresent, handleManualMark, handleClearAttendance,
    handleOpenLeaveDialog, onViewDetails } = ctx;

  return (
    <div className="space-y-4">
      <AttendanceRegisterGrid
        students={overview?.students ?? []}
        date={selectedDate}
        isHoliday={!!holidayToday}
        holidayName={holidayToday?.name}
        isLoading={overviewQuery.isLoading}
        isMutating={isMutating}
        onMarkAllPresent={handleMarkAllPresent}
        onStatusChange={(userId, session, status) => handleManualMark(userId, session, status)}
        onClear={handleClearAttendance}
        onViewDetails={onViewDetails}
        onOpenLeave={handleOpenLeaveDialog}
      />
    </div>
  );
}
