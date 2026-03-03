import { CalendarSession, Cohort, Instructor } from './types/calendar';

export const mockInstructors: Instructor[] = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Sarah Smith' },
  { id: '3', name: 'Mike Johnson' },
  { id: '4', name: 'Emily Brown' },
  { id: '5', name: 'David Wilson' },
];

export const mockCohorts: Cohort[] = [
  { id: 'jsd12', name: 'JSD12', startDate: '2026-02-02' },
  { id: 'jsd13', name: 'JSD13', startDate: '2026-05-11' },
  { id: 'jsd14', name: 'JSD14', startDate: '2026-08-17' },
];

export const mockSessions: CalendarSession[] = [
  {
    id: '1',
    cohortId: 'jsd12',
    weekNumber: 1,
    dayOfWeek: 1,
    startTime: '09:00',
    durationMinutes: 90,
    sessionName: 'Technical - HTML/CSS',
    instructorId: '1',
    color: '#3B82F6',
  },
  {
    id: '2',
    cohortId: 'jsd12',
    weekNumber: 1,
    dayOfWeek: 2,
    startTime: '10:00',
    durationMinutes: 60,
    sessionName: 'Soft Skills - Communication',
    instructorId: '2',
    color: '#22C55E',
  },
  {
    id: '3',
    cohortId: 'jsd12',
    weekNumber: 1,
    dayOfWeek: 3,
    startTime: '09:00',
    durationMinutes: 120,
    sessionName: 'Project - Portfolio',
    instructorId: '3',
    color: '#A855F7',
  },
  {
    id: '4',
    cohortId: 'jsd12',
    weekNumber: 2,
    dayOfWeek: 1,
    startTime: '09:00',
    durationMinutes: 90,
    sessionName: 'Technical - JavaScript Basics',
    instructorId: '1',
    color: '#3B82F6',
  },
  {
    id: '5',
    cohortId: 'jsd12',
    weekNumber: 2,
    dayOfWeek: 3,
    startTime: '13:00',
    durationMinutes: 45,
    sessionName: 'Workshop - React',
    instructorId: '4',
    color: '#F97316',
  },
  {
    id: '6',
    cohortId: 'jsd12',
    weekNumber: 3,
    dayOfWeek: 2,
    startTime: '09:00',
    durationMinutes: 60,
    sessionName: 'Assessment - Quiz 1',
    instructorId: '5',
    color: '#EF4444',
  },
];
