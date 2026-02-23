export { api } from "../infrastructure/api";
export { setAuthToken, removeAuthToken, getAuthToken, setAuthData, clearAllAuthData } from "../infrastructure/storage";

export {
  authService,
  userService,
  reflectionService,
  attendanceService,
  leaveService,
  badgeService,
  boardService,
} from "../application/services";

export { awardBadge } from "../application/services/badgeService";
export {
  addReaction,
  removeReaction,
  addCommentReaction,
  removeCommentReaction,
} from "../application/services/boardService";
export { getAllUsers, getCohort, getUsersByBarometer } from "../application/services/userService";
export { getWeeklyReflections, createReflection, getBarometerData } from "../application/services/reflectionService";
export {
  submitLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  adminCreateLeaveRequest,
  updateLeaveRequestStatus,
  getHolidays,
  createHoliday,
  deleteHoliday,
} from "../application/services/leaveService";
export {
  generateAttendanceCode,
  getActiveAttendanceCode,
  submitAttendance,
  getMyAttendanceStatus,
  manualMarkAttendance,
  getAttendanceLogs,
  getAttendanceStats,
  getStudentAttendanceHistory,
  getTodayOverview,
  lockAttendance,
  deleteAttendanceRecord,
  getAttendanceStatsByDays,
  getDailyAttendanceStats,
  getMyAttendanceHistory,
  getMyDailyStats,
  bulkMarkAttendance,
} from "../application/services/attendanceService";

export * from "../domain/types";
