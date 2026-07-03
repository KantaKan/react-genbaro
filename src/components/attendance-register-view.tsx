"use client";

import { AttendanceRegisterGrid } from "./attendance/attendance-register-grid";
import { AttendanceCodePanel } from "./attendance/attendance-code-panel";
import { useAttendanceContext } from "./attendance-shell";

export function AttendanceRegisterView() {
  const ctx = useAttendanceContext();
  const { overview, overviewQuery, selectedDate, holidayToday, isMutating,
    handleMarkAllPresent, handleManualMark, handleClearAttendance,
    handleOpenLeaveDialog, onViewDetails } = ctx;

  return (
    <div className="flex gap-4 items-start">
      <div className="flex-1 min-w-0">
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
      <div className="w-64 shrink-0 hidden lg:block">
        <AttendanceCodePanel />
      </div>
    </div>
  );
}
