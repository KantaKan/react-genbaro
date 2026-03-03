import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CalendarSession, Instructor, Cohort, mockInstructors, mockSessions, mockCohorts } from '../data/mockData';

const STORAGE_KEY_CALENDAR_WEEK = 'calendar_last_week';
const STORAGE_KEY_CALENDAR_COHORT = 'calendar_last_cohort';

interface CalendarContextType {
  sessions: CalendarSession[];
  instructors: Instructor[];
  cohorts: Cohort[];
  selectedCohort: string;
  selectedWeek: number;
  editingSession: CalendarSession | null;
  isModalOpen: boolean;
  
  getSessionsForWeek: (week: number) => CalendarSession[];
  getWeeksWithSessions: () => number[];
  getInstructorName: (id: string) => string;
  
  addSession: (session: Omit<CalendarSession, 'id'>) => void;
  updateSession: (id: string, data: Partial<CalendarSession>) => void;
  deleteSession: (id: string) => void;
  addInstructor: (name: string) => void;
  
  setSelectedCohort: (cohortId: string) => void;
  setSelectedWeek: (week: number) => void;
  openModal: (session?: CalendarSession) => void;
  closeModal: () => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<CalendarSession[]>(mockSessions);
  const [instructors, setInstructors] = useState<Instructor[]>(mockInstructors);
  const [cohorts] = useState<Cohort[]>(mockCohorts);
  const [selectedCohort, setSelectedCohortState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_CALENDAR_COHORT) || 'jsd12';
  });
  const [selectedWeek, setSelectedWeekState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CALENDAR_WEEK);
    return saved ? parseInt(saved, 10) : 1;
  });
  const [editingSession, setEditingSession] = useState<CalendarSession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CALENDAR_WEEK, selectedWeek.toString());
  }, [selectedWeek]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CALENDAR_COHORT, selectedCohort);
  }, [selectedCohort]);

  const getSessionsForWeek = useCallback((week: number): CalendarSession[] => {
    return sessions.filter(s => s.cohortId === selectedCohort && s.weekNumber === week);
  }, [sessions, selectedCohort]);

  const getWeeksWithSessions = useCallback((): number[] => {
    const cohortSessions = sessions.filter(s => s.cohortId === selectedCohort);
    const weeks = [...new Set(cohortSessions.map(s => s.weekNumber))];
    return weeks.sort((a, b) => a - b);
  }, [sessions, selectedCohort]);

  const getInstructorName = useCallback((id: string): string => {
    return instructors.find(i => i.id === id)?.name || 'Unknown';
  }, [instructors]);

  const addSession = useCallback((session: Omit<CalendarSession, 'id'>) => {
    const newSession: CalendarSession = {
      ...session,
      id: Date.now().toString(),
    };
    setSessions(prev => [...prev, newSession]);
  }, []);

  const updateSession = useCallback((id: string, data: Partial<CalendarSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const addInstructor = useCallback((name: string) => {
    const newInstructor: Instructor = {
      id: Date.now().toString(),
      name,
    };
    setInstructors(prev => [...prev, newInstructor]);
  }, []);

  const setSelectedCohort = useCallback((cohortId: string) => {
    setSelectedCohortState(cohortId);
    const cohort = cohorts.find(c => c.id === cohortId);
    if (cohort) {
      const existingWeeks = sessions.filter(s => s.cohortId === cohortId).map(s => s.weekNumber);
      if (existingWeeks.length > 0) {
        setSelectedWeekState(Math.min(...existingWeeks));
      } else {
        setSelectedWeekState(1);
      }
    }
  }, [cohorts, sessions]);

  const setSelectedWeek = useCallback((week: number) => {
    setSelectedWeekState(week);
  }, []);

  const openModal = useCallback((session?: CalendarSession) => {
    setEditingSession(session || null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setEditingSession(null);
    setIsModalOpen(false);
  }, []);

  const value: CalendarContextType = {
    sessions,
    instructors,
    cohorts,
    selectedCohort,
    selectedWeek,
    editingSession,
    isModalOpen,
    getSessionsForWeek,
    getWeeksWithSessions,
    getInstructorName,
    addSession,
    updateSession,
    deleteSession,
    addInstructor,
    setSelectedCohort,
    setSelectedWeek,
    openModal,
    closeModal,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}
