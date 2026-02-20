"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import { 
  generateAttendanceCode, 
  getActiveAttendanceCode, 
  manualMarkAttendance,
  getAttendanceLogs,
  getStudentAttendanceHistory,
  getTodayOverview,
  deleteAttendanceRecord,
  getDailyAttendanceStats,
  getAttendanceStats,
  getCohort,
  bulkMarkAttendance,
  getHolidays,
  deleteHoliday,
  type AttendanceCode,
  type AttendanceRecord,
  type TodayOverview,
  type DailyStats,
  type User,
  type Holiday,
  type AttendanceStats
} from "@/lib/api";
import { Trash2, RefreshCw, Clock, AlertTriangle, Calendar, X, CalendarClock, Check, ChevronDown, Loader2, Star, Users, Eye } from "lucide-react";
import { LeaveRequestsTable } from "./leave-requests-table";
import { CreateLeaveRequestDialog } from "./create-leave-request-dialog";
import { AdminAttendanceCalendar } from "./admin-attendance-calendar";
import { DaySummaryDialog } from "./day-summary-dialog";
import { CreateHolidayDialog } from "./create-holiday-dialog";

interface AttendanceDashboardProps {
  cohort?: string;
}

const COHORTS = Array.from({ length: 12 }, (_, i) => i + 7);

// Get today's date in YYYY-MM-DD format (local timezone)
const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Request queue item type
interface QueueItem {
  id: string;
  userId: string;
  session: "morning" | "afternoon";
  status: "present" | "late" | "absent" | "late_excused" | "absent_excused";
  date: string;
  attempts: number;
}

// Retry helper with exponential backoff
const withRetry = async <T,>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429)
      if (error?.response?.status === 429 && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors or if max retries reached, throw
      throw error;
    }
  }
  
  throw lastError;
};

export function AttendanceDashboard({ cohort }: AttendanceDashboardProps) {
  const navigate = useNavigate();
  const [selectedCohort, setSelectedCohort] = useState<string>("11");
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDate());
  const [activeCodeMorning, setActiveCodeMorning] = useState<AttendanceCode | null>(null);
  const [activeCodeAfternoon, setActiveCodeAfternoon] = useState<AttendanceCode | null>(null);
  const [timeLeftMorning, setTimeLeftMorning] = useState<string>("");
  const [timeLeftAfternoon, setTimeLeftAfternoon] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [todayOverview, setTodayOverview] = useState<TodayOverview | null>(null);
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<AttendanceStats | null>(null);
  const [studentHistory, setStudentHistory] = useState<AttendanceRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{id: string; name: string; session: string; date: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Date range for stats
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };
  const [statsStartDate, setStatsStartDate] = useState<string>(getDefaultStartDate());
  const [statsEndDate, setStatsEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<User[]>([]);
  const [createLeaveDialogOpen, setCreateLeaveDialogOpen] = useState(false);
  const [selectedStudentForLeave, setSelectedStudentForLeave] = useState<{user_id: string; jsd_number: string; first_name: string; last_name: string} | null>(null);
  const [daySummaryOpen, setDaySummaryOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Holiday state
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [createHolidayDialogOpen, setCreateHolidayDialogOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState<string>("");
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  
  // Request queue state
  const [requestQueue, setRequestQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());
  const queueRef = useRef<QueueItem[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Local storage for record IDs to enable reliable clearing
  const [recordIdMap, setRecordIdMap] = useState<Map<string, string>>(new Map());
  
  // Mark All Present loading state
  const [isMarkingAllPresent, setIsMarkingAllPresent] = useState(false);

  // Cleanup stale pending operations every 30 seconds
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (!isProcessingQueue && pendingOperations.size > 0) {
        console.log("Cleaning up stale pending operations:", pendingOperations.size);
        setPendingOperations(new Set());
        toast.warn("Cleared stale attendance operations");
      }
    }, 30000);

    return () => clearInterval(cleanupInterval);
  }, [isProcessingQueue, pendingOperations]);

  // Load cohort from localStorage on mount
  useEffect(() => {
    const savedCohort = localStorage.getItem("attendance_cohort");
    if (savedCohort) {
      setSelectedCohort(savedCohort);
    } else if (cohort) {
      setSelectedCohort(cohort);
    }
  }, [cohort]);

  // Save cohort to localStorage when changed
  const handleCohortChange = (value: string) => {
    setSelectedCohort(value);
    localStorage.setItem("attendance_cohort", value);
  };

  // Process the request queue with batching
  const processQueue = useCallback(async () => {
    if (isProcessingQueue || queueRef.current.length === 0) return;
    
    setIsProcessingQueue(true);
    
    try {
      // Group similar requests by session, status, and date for batching
      const batches: Map<string, QueueItem[]> = new Map();
      
      queueRef.current.forEach(item => {
        const key = `${item.session}-${item.status}-${item.date}`;
        if (!batches.has(key)) {
          batches.set(key, []);
        }
        batches.get(key)!.push(item);
      });
      
      // Process batches
      for (const [key, items] of batches) {
        if (items.length >= 3) {
          // Use bulk API for 3+ items
          try {
            const result = await withRetry(() => 
              bulkMarkAttendance(
                items.map(i => i.userId),
                items[0].date,
                items[0].session,
                items[0].status
              )
            );
            
            // Store record IDs for reliable clearing
            setRecordIdMap(prev => {
              const next = new Map(prev);
              if (result.records) {
                result.records.forEach((record: AttendanceRecord) => {
                  next.set(`${record.user_id}-${record.session}`, record._id);
                });
              }
              return next;
            });
            
            // Optimistically update the UI immediately
            setTodayOverview(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                students: prev.students.map(s => {
                  const updatedItem = items.find(i => i.userId === s.user_id && i.session === items[0].session);
                  if (updatedItem) {
                    return {
                      ...s,
                      [updatedItem.session]: items[0].status,
                      [`${updatedItem.session}_record_id`]: result.records?.find((r: AttendanceRecord) => r.user_id === s.user_id)?._id
                    };
                  }
                  return s;
                })
              };
            });
            
            // Clear processed items from queue
            const itemIds = new Set(items.map(i => i.id));
            queueRef.current = queueRef.current.filter(i => !itemIds.has(i.id));
            
            // Update pending operations
            setPendingOperations(prev => {
              const next = new Set(prev);
              items.forEach(i => {
                next.delete(`${i.userId}-${i.session}`);
              });
              return next;
            });
            
            toast.success(`Marked ${items.length} students as ${items[0].status}`);
          } catch (error) {
            console.error("Batch operation failed:", error);
            // Don't remove from queue - will retry
            items.forEach(item => {
              item.attempts++;
            });
          }
        } else {
          // Process individually with delay
          for (const item of items) {
            try {
              const result = await withRetry(() => 
                manualMarkAttendance(item.userId, item.date, item.session, item.status)
              );
              
              // Store record ID for reliable clearing
              if (result && result._id) {
                setRecordIdMap(prev => {
                  const next = new Map(prev);
                  next.set(`${item.userId}-${item.session}`, result._id);
                  return next;
                });
              }
              
              // Optimistically update the UI immediately
              setTodayOverview(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  students: prev.students.map(s => {
                    if (s.user_id === item.userId) {
                      return {
                        ...s,
                        [item.session]: item.status,
                        [`${item.session}_record_id`]: result?._id
                      };
                    }
                    return s;
                  })
                };
              });
              
              // Remove from queue
              queueRef.current = queueRef.current.filter(i => i.id !== item.id);
              
              // Update pending operations
              setPendingOperations(prev => {
                const next = new Set(prev);
                next.delete(`${item.userId}-${item.session}`);
                return next;
              });
              
              // Small delay between requests to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 150));
            } catch (error: any) {
              console.error(`Failed to mark attendance for ${item.userId}:`, error);
              item.attempts++;
              
              if (item.attempts >= 3) {
                // Remove from queue after max retries
                queueRef.current = queueRef.current.filter(i => i.id !== item.id);
                setPendingOperations(prev => {
                  const next = new Set(prev);
                  next.delete(`${item.userId}-${item.session}`);
                  return next;
                });
                toast.error(`Failed to mark attendance for student after retries`);
              }
            }
          }
        }
      }
      
      // Refresh overview after a small delay to ensure DB consistency
      if (queueRef.current.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
        loadTodayOverview();
      }
    } finally {
      setIsProcessingQueue(false);
      setRequestQueue([...queueRef.current]);
    }
  }, [isProcessingQueue]);

  // Toast ID for queue updates
  const queueToastRef = useRef<string | null>(null);
  
  // Add item to queue and trigger processing
  const addToQueue = useCallback((item: Omit<QueueItem, 'id' | 'attempts'>) => {
    const queueItem: QueueItem = {
      ...item,
      id: `${item.userId}-${item.session}-${Date.now()}`,
      attempts: 0
    };
    
    queueRef.current.push(queueItem);
    const queueLength = queueRef.current.length;
    setRequestQueue([...queueRef.current]);
    
    // Add to pending operations for optimistic UI
    setPendingOperations(prev => new Set(prev).add(`${item.userId}-${item.session}`));
    
    // Clear any existing batch timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    // Show queue status toast
    if (queueToastRef.current) {
      toast.dismiss(queueToastRef.current);
    }
    
    const isSingleItem = queueLength === 1;
    queueToastRef.current = toast.info(
      isSingleItem 
        ? "⏱️ Queuing attendance update... (Processing in 300ms)"
        : `📦 ${queueLength} updates queued... (Processing in 300ms)`,
      { autoClose: 300, hideProgressBar: true }
    );
    
    // Debounce: wait for more items to accumulate, then process
    batchTimeoutRef.current = setTimeout(() => {
      if (queueRef.current.length > 0) {
        const count = queueRef.current.length;
        toast.info(`🚀 Processing ${count} attendance update${count > 1 ? 's' : ''}...`, {
          autoClose: 2000,
          hideProgressBar: false
        });
        processQueue();
      }
    }, 300);
  }, [processQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      // Process any remaining items
      if (queueRef.current.length > 0) {
        processQueue();
      }
    };
  }, [processQueue]);

  const loadTodayOverview = useCallback(async () => {
    const cohortNum = parseInt(selectedCohort);
    try {
      const [morning, afternoon, overview] = await Promise.all([
        getActiveAttendanceCode(cohortNum, "morning"),
        getActiveAttendanceCode(cohortNum, "afternoon"),
        getTodayOverview(cohortNum, undefined, selectedDate)
      ]);
      setActiveCodeMorning(morning);
      setActiveCodeAfternoon(afternoon);
      setTodayOverview(overview);
    } catch (error) {
      console.error("Error loading overview:", error);
    }
  }, [selectedCohort, selectedDate]);

  const loadStats = useCallback(async () => {
    const cohortNum = parseInt(selectedCohort);
    try {
      let statsData;
      if (selectedDays > 0 || (statsStartDate && statsEndDate)) {
        statsData = await getAttendanceStats(cohortNum, statsStartDate, statsEndDate);
      } else {
        statsData = await getAttendanceStats(cohortNum);
      }
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [selectedCohort, selectedDays, statsStartDate, statsEndDate]);

  const loadDailyStats = async () => {
    try {
      const data = await getDailyAttendanceStats(parseInt(selectedCohort), selectedDays);
      setDailyStats(data);
    } catch (error) {
      console.error("Error loading daily stats:", error);
    }
  };

  const loadStudents = async () => {
    try {
      const users = await getCohort(selectedCohort);
      setStudents(users);
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await getAttendanceLogs(parseInt(selectedCohort), selectedDate);
      const logsData = Array.isArray(data.logs) ? data.logs : [];
      setLogs(logsData);
      return logsData;
    } catch (error) {
      console.error("Error loading logs:", error);
      setLogs([]);
      return [];
    }
  };

  const loadHolidays = async () => {
    try {
      const data = await getHolidays();
      setHolidays(data);
    } catch (error) {
      console.error("Error loading holidays:", error);
      setHolidays([]);
    }
  };

  const isHoliday = (date: string): Holiday | null => {
    if (!holidays || holidays.length === 0) return null;
    return holidays.find((h) => date >= h.start_date && date <= h.end_date) || null;
  };

  // Load data when cohort or date changes - only essential data
  useEffect(() => {
    loadTodayOverview();
    loadHolidays();
  }, [selectedCohort, selectedDate, loadTodayOverview]);

  // Load stats and daily stats only when needed (all-students tab or at-risk tab)
  useEffect(() => {
    if (activeTab === "all-students" || activeTab === "at-risk") {
      const cohort = selectedCohort;
      // Pass dates when a quick filter is selected (7/15/30 days) or when dates are manually set
      if (selectedDays > 0 || (statsStartDate && statsEndDate)) {
        getAttendanceStats(parseInt(cohort), statsStartDate, statsEndDate).then(setStats).catch(console.error);
      } else {
        // Show all records (no date filter)
        getAttendanceStats(parseInt(cohort)).then(setStats).catch(console.error);
      }
      loadDailyStats();
    }
  }, [activeTab, selectedCohort, selectedDays, statsStartDate, statsEndDate]);

  // Load logs only when logs tab is active
  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs();
    }
  }, [activeTab, selectedCohort, selectedDate, selectedDays]);

  // Countdown timers
  useEffect(() => {
    if (activeCodeMorning) {
      const interval = setInterval(() => {
        const now = new Date();
        const expires = new Date(activeCodeMorning.expires_at);
        const diff = expires.getTime() - now.getTime();
        if (diff <= 0) {
          setTimeLeftMorning("Expired");
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeftMorning(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeCodeMorning]);

  useEffect(() => {
    if (activeCodeAfternoon) {
      const interval = setInterval(() => {
        const now = new Date();
        const expires = new Date(activeCodeAfternoon.expires_at);
        const diff = expires.getTime() - now.getTime();
        if (diff <= 0) {
          setTimeLeftAfternoon("Expired");
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeftAfternoon(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeCodeAfternoon]);

  const handleGenerateCode = async (session: "morning" | "afternoon") => {
    setIsGenerating(true);
    try {
      const code = await generateAttendanceCode(parseInt(selectedCohort), session);
      if (session === "morning") {
        setActiveCodeMorning(code);
      } else {
        setActiveCodeAfternoon(code);
      }
      toast.success(`Generated ${session} code: ${code.code}`);
      loadTodayOverview();
    } catch {
      toast.error("Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualMark = (userId: string, session: "morning" | "afternoon", status: "present" | "late" | "absent" | "late_excused" | "absent_excused") => {
    // Check if already pending
    if (pendingOperations.has(`${userId}-${session}`)) {
      toast.info("Attendance update already in progress...");
      return;
    }
    
    // Add to queue instead of making immediate API call
    addToQueue({
      userId,
      session,
      status,
      date: selectedDate
    });
    
    toast.info("Attendance queued for update...");
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAttendanceRecord(recordToDelete.id);
      toast.success("Attendance removed");
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
      loadTodayOverview();
      if (activeTab === "logs") {
        loadLogs();
      }
    } catch (error) {
      toast.error("Failed to remove attendance");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAttendance = async (userId: string, session: "morning" | "afternoon") => {
    // Optimistic UI update - immediately show "-" in the UI
    setTodayOverview(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        students: prev.students.map(s => {
          if (s.user_id === userId) {
            return {
              ...s,
              [session]: "-",
              [`${session}_record_id`]: undefined
            };
          }
          return s;
        })
      };
    });

    // Priority 1: Check local record ID map (most reliable)
    let recordId = recordIdMap.get(`${userId}-${session}`);
    
    // Priority 2: Check todayOverview data from backend
    if (!recordId) {
      const student = todayOverview?.students.find(s => s.user_id === userId);
      recordId = session === "morning" ? student?.morning_record_id : student?.afternoon_record_id;
    }
    
    // Priority 3: Try to find in logs as fallback
    if (!recordId) {
      if (!logs || logs.length === 0) {
        await loadLogs();
      }
      
      const record = logs.find(l => 
        l.user_id === userId && 
        l.session === session && 
        l.date === selectedDate && 
        !l.deleted
      );
      
      if (record) {
        recordId = record._id;
      }
    }
    
    if (!recordId) {
      toast.error("Attendance record not found. Please refresh the page and try again.");
      // Revert optimistic UI update
      loadTodayOverview();
      return;
    }
    
    await performDelete(recordId, session, userId);
  };

  const performDelete = async (recordId: string, session: string, userId: string) => {
    setIsDeleting(true);
    try {
      await withRetry(() => deleteAttendanceRecord(recordId));
      
      // Remove from local record ID map
      setRecordIdMap(prev => {
        const next = new Map(prev);
        next.delete(`${userId}-${session}`);
        return next;
      });
      
      toast.success("Attendance cleared");
      
      // Add delay before refresh to ensure DB consistency
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadTodayOverview();
    } catch (error) {
      toast.error("Failed to clear attendance");
      // Revert optimistic UI update on error
      loadTodayOverview();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAllPresent = async () => {
    if (!todayOverview?.students) return;
    
    const unmarkedStudents = todayOverview.students.filter(s => s.morning === "-" || s.afternoon === "-");
    if (unmarkedStudents.length === 0) {
      toast.info("All students already marked");
      return;
    }
    
    setIsMarkingAllPresent(true);
    try {
      const morningUnmarked = unmarkedStudents.filter(s => s.morning === "-").map(s => s.user_id);
      const afternoonUnmarked = unmarkedStudents.filter(s => s.afternoon === "-").map(s => s.user_id);
      
      let morningResults: AttendanceRecord[] = [];
      let afternoonResults: AttendanceRecord[] = [];
      
      if (morningUnmarked.length > 0) {
        const result = await bulkMarkAttendance(morningUnmarked, selectedDate, "morning", "present");
        morningResults = result.records || [];
      }
      if (afternoonUnmarked.length > 0) {
        const result = await bulkMarkAttendance(afternoonUnmarked, selectedDate, "afternoon", "present");
        afternoonResults = result.records || [];
      }
      
      // Optimistically update the UI
      setTodayOverview(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          students: prev.students.map(s => {
            const morningRecord = morningResults.find((r: AttendanceRecord) => r.user_id === s.user_id);
            const afternoonRecord = afternoonResults.find((r: AttendanceRecord) => r.user_id === s.user_id);
            return {
              ...s,
              morning: morningRecord ? "present" : s.morning,
              morning_record_id: morningRecord?._id || s.morning_record_id,
              afternoon: afternoonRecord ? "present" : s.afternoon,
              afternoon_record_id: afternoonRecord?._id || s.afternoon_record_id
            };
          })
        };
      });
      
      toast.success(`Marked ${unmarkedStudents.length} students as present`);
      
      // Delay before refresh
      await new Promise(resolve => setTimeout(resolve, 300));
      loadTodayOverview();
    } catch (error) {
      toast.error("Failed to mark all present");
    } finally {
      setIsMarkingAllPresent(false);
    }
  };

  const handleViewStudentHistory = async (student: AttendanceStats) => {
    setSelectedStudent(student);
    setIsLoadingHistory(true);
    try {
      const history = await getStudentAttendanceHistory(student.user_id);
      setStudentHistory(history);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpenLeaveDialog = (student: {user_id: string; jsd_number: string; first_name: string; last_name: string}) => {
    setSelectedStudentForLeave(student);
    setCreateLeaveDialogOpen(true);
  };

  const handleCalendarDayClick = (date: string, isHoliday: boolean, holiday?: Holiday) => {
    if (isHoliday && holiday) {
      setSelectedHoliday(holiday);
      setHolidayDate(date);
      setDaySummaryOpen(true);
    } else {
      setSelectedCalendarDate(date);
      setDaySummaryOpen(true);
    }
  };

  const handleMarkAsHoliday = (date: string) => {
    setHolidayDate(date);
    setSelectedHoliday(null);
    setCreateHolidayDialogOpen(true);
    setDaySummaryOpen(false);
  };

  const handleRemoveHoliday = async (holidayId: string) => {
    try {
      await deleteHoliday(holidayId);
      toast.success("Holiday removed");
      loadHolidays();
      setDaySummaryOpen(false);
      setSelectedHoliday(null);
    } catch (error) {
      toast.error("Failed to remove holiday");
    }
  };

  const handleHolidayCreated = (holiday: Holiday) => {
    loadHolidays();
    setDaySummaryOpen(false);
  };

  const handleGoToAttendance = () => {
    setSelectedDate(selectedCalendarDate);
    setActiveTab("overview");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>;
      case "late":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Late</Badge>;
      case "absent":
        return <Badge className="bg-red-500 hover:bg-red-600">Absent</Badge>;
      case "late_excused":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Late Excused</Badge>;
      case "absent_excused":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Absent Excused</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getWarningBadge = (level: string) => {
    switch (level) {
      case "red":
        return <Badge className="bg-red-500">Critical</Badge>;
      case "yellow":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      default:
        return <Badge className="bg-green-500">Good</Badge>;
    }
  };

  const maxDailyTotal = Math.max(...dailyStats.map(d => d.total), 1);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Manage class attendance and track student participation</p>
        </div>
        <div className="flex items-center gap-2">
          <Input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[150px]"
          />
          <Select value={selectedCohort} onValueChange={handleCohortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Cohort" />
            </SelectTrigger>
            <SelectContent>
              {COHORTS.map((c) => (
                <SelectItem key={c} value={c.toString()}>Cohort {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => {
            loadTodayOverview();
            loadStats();
            loadLogs();
            loadDailyStats();
          }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all-students">All Students</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="leave-requests">Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Morning Session
                </CardTitle>
                <CardDescription className="text-blue-100">9:00 - 10:30</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <Button 
                  onClick={() => handleGenerateCode("morning")}
                  disabled={isGenerating}
                  className="w-full"
                  variant={activeCodeMorning ? "outline" : "default"}
                >
                  {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  {activeCodeMorning ? "Regenerate Code" : "Generate Code"}
                </Button>
                {activeCodeMorning && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Code</p>
                    <p className="text-3xl font-bold font-mono tracking-wider">{activeCodeMorning.code}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Valid for: <span className="font-semibold text-primary">{timeLeftMorning}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Afternoon Session
                </CardTitle>
                <CardDescription className="text-purple-100">13:00 - 14:30</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <Button 
                  onClick={() => handleGenerateCode("afternoon")}
                  disabled={isGenerating}
                  className="w-full"
                  variant={activeCodeAfternoon ? "outline" : "default"}
                >
                  {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  {activeCodeAfternoon ? "Regenerate Code" : "Generate Code"}
                </Button>
                {activeCodeAfternoon && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Code</p>
                    <p className="text-3xl font-bold font-mono tracking-wider">{activeCodeAfternoon.code}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Valid for: <span className="font-semibold text-primary">{timeLeftAfternoon}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Attendance - {selectedDate}
                  </CardTitle>
                  {isHoliday(selectedDate) && (
                    <Badge className="bg-purple-500 text-white">
                      <Star className="h-3 w-3 mr-1 fill-yellow-300 text-yellow-300" />
                      {isHoliday(selectedDate)?.name || "Holiday"}
                    </Badge>
                  )}
                  {requestQueue.length > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      {requestQueue.length} pending
                    </Badge>
                  )}
                </div>
                <Button 
                  onClick={handleMarkAllPresent} 
                  size="sm" 
                  variant="outline" 
                  disabled={isMarkingAllPresent || requestQueue.length > 0 || !!isHoliday(selectedDate)}
                >
                  {isHoliday(selectedDate) ? (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Holiday
                    </>
                  ) : isMarkingAllPresent ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Mark All Present
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">JSD</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Morning</TableHead>
                    <TableHead>Afternoon</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayOverview?.students.map((student) => (
                    <TableRow key={student.user_id}>
                      <TableCell className="font-medium">{student.jsd_number}</TableCell>
                      <TableCell>{student.first_name} {student.last_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {pendingOperations.has(`${student.user_id}-morning`) ? (
                            <Badge variant="outline" className="animate-pulse">
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Updating...
                            </Badge>
                          ) : (
                            getStatusBadge(student.morning)
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {pendingOperations.has(`${student.user_id}-afternoon`) ? (
                            <Badge variant="outline" className="animate-pulse">
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Updating...
                            </Badge>
                          ) : (
                            getStatusBadge(student.afternoon)
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => navigate(`/admin/attendance/student/${student.user_id}`)}
                            title="View full details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleOpenLeaveDialog(student)}
                            title="Create leave request"
                          >
                            <CalendarClock className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant={student.morning !== "-" ? "default" : "outline"} 
                                size="sm"
                                disabled={pendingOperations.has(`${student.user_id}-morning`) || isDeleting || !!isHoliday(selectedDate)}
                              >
                                AM {student.morning !== "-" ? "✓" : ""} {pendingOperations.has(`${student.user_id}-morning`) && <Loader2 className="h-3 w-3 animate-spin ml-1" />} <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "present")} disabled={!!isHoliday(selectedDate)}>
                                <Check className="h-4 w-4 mr-2 text-green-500" /> Present
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "late")} disabled={!!isHoliday(selectedDate)}>
                                <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Late
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "absent")} disabled={!!isHoliday(selectedDate)}>
                                <X className="h-4 w-4 mr-2 text-red-500" /> Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "late_excused")} disabled={!!isHoliday(selectedDate)}>
                                <Clock className="h-4 w-4 mr-2 text-blue-500" /> Late (Excused)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "absent_excused")} disabled={!!isHoliday(selectedDate)}>
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" /> Absent (Excused)
                              </DropdownMenuItem>
                              {student.morning !== "-" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleClearAttendance(student.user_id, "morning")} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" /> Clear
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant={student.afternoon !== "-" ? "default" : "outline"} 
                                size="sm"
                                disabled={pendingOperations.has(`${student.user_id}-afternoon`) || isDeleting || !!isHoliday(selectedDate)}
                              >
                                PM {student.afternoon !== "-" ? "✓" : ""} {pendingOperations.has(`${student.user_id}-afternoon`) && <Loader2 className="h-3 w-3 animate-spin ml-1" />} <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "present")} disabled={!!isHoliday(selectedDate)}>
                                <Check className="h-4 w-4 mr-2 text-green-500" /> Present
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "late")} disabled={!!isHoliday(selectedDate)}>
                                <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Late
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "absent")} disabled={!!isHoliday(selectedDate)}>
                                <X className="h-4 w-4 mr-2 text-red-500" /> Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "late_excused")} disabled={!!isHoliday(selectedDate)}>
                                <Clock className="h-4 w-4 mr-2 text-blue-500" /> Late (Excused)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "absent_excused")} disabled={!!isHoliday(selectedDate)}>
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" /> Absent (Excused)
                              </DropdownMenuItem>
                              {student.afternoon !== "-" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleClearAttendance(student.user_id, "afternoon")} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" /> Clear
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Students - Cohort {selectedCohort}
              </CardTitle>
              <CardDescription>
                Attendance summary for all students in this cohort
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">JSD</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-center">Absent Sessions</TableHead>
                    <TableHead className="text-center">Absent Days</TableHead>
                    <TableHead className="text-center">Excused</TableHead>
                    <TableHead className="text-center">Warning</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No attendance data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats
                      .sort((a, b) => b.absent - a.absent)
                      .map((student) => (
                        <TableRow key={student.user_id}>
                          <TableCell className="font-medium">{student.jsd_number}</TableCell>
                          <TableCell>{student.first_name} {student.last_name}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-green-600 font-medium">{student.present}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-yellow-600 font-medium">{student.late}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-red-600 font-medium">{student.absent}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-red-700 font-bold">{student.absent_days}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-blue-600 font-medium">{student.late_excused + student.absent_excused}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {getWarningBadge(student.warning_level)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              onClick={() => navigate(`/admin/attendance/student/${student.user_id}`)}
                              title="View full details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <AdminAttendanceCalendar
            cohort={parseInt(selectedCohort)}
            onDayClick={handleCalendarDayClick}
            holidays={holidays}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>JSD</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.filter(l => !l.deleted).map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.jsd_number}</TableCell>
                      <TableCell>{log.first_name} {log.last_name}</TableCell>
                      <TableCell className="capitalize">{log.session}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="capitalize">{log.marked_by}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            setRecordToDelete({ 
                              id: log._id, 
                              name: `${log.first_name} ${log.last_name}`, 
                              session: log.session,
                              date: log.date
                            });
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave-requests" className="space-y-4">
          <LeaveRequestsTable cohort={selectedCohort} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              History - {selectedStudent?.first_name} {selectedStudent?.last_name}
            </DialogTitle>
            <DialogDescription>
              JSD: {selectedStudent?.jsd_number} | Present: {selectedStudent?.present} | Absent: {selectedStudent?.absent}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingHistory ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : (
                  studentHistory.filter(h => !h.deleted).map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell className="capitalize">{record.session}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="capitalize">{record.marked_by}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Attendance</DialogTitle>
            <DialogDescription>
              Remove {recordToDelete?.name}'s {recordToDelete?.session} attendance for {recordToDelete?.date}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteRecord} disabled={isDeleting}>
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateLeaveRequestDialog
        open={createLeaveDialogOpen}
        onOpenChange={(open) => {
          setCreateLeaveDialogOpen(open);
          if (!open) setSelectedStudentForLeave(null);
        }}
        students={students}
        preselectedStudent={selectedStudentForLeave || undefined}
        defaultDate={selectedDate}
        onSuccess={() => {
          loadTodayOverview();
          loadLogs();
          loadStats();
        }}
      />

      <DaySummaryDialog
        open={daySummaryOpen}
        onOpenChange={setDaySummaryOpen}
        date={selectedCalendarDate || holidayDate}
        cohort={parseInt(selectedCohort)}
        onMarkAttendance={handleGoToAttendance}
        holiday={selectedHoliday}
        onMarkAsHoliday={handleMarkAsHoliday}
        onRemoveHoliday={handleRemoveHoliday}
      />

      <CreateHolidayDialog
        open={createHolidayDialogOpen}
        onOpenChange={setCreateHolidayDialogOpen}
        selectedDate={holidayDate}
        onSuccess={handleHolidayCreated}
      />
    </div>
  );
}
