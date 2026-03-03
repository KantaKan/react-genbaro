export interface Instructor {
  id: string;
  name: string;
}

export interface CalendarSession {
  id: string;
  cohortId: string;
  weekNumber: number;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  sessionName: string;
  instructorId: string;
  color: string;
}

export interface Cohort {
  id: string;
  name: string;
  startDate: string;
}

export const TOPIC_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
];

export const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export const TIME_SLOTS = Array.from({ length: 33 }, (_, i) => {
  const hour = 9 + Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

export const DAYS_OF_WEEK = [
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
];

export function getWeekDates(cohortStartDate: string, weekNumber: number): { date: Date; dayOfWeek: number }[] {
  const startDate = new Date(cohortStartDate);
  const weekStart = new Date(startDate);
  weekStart.setDate(startDate.getDate() + (weekNumber - 1) * 7);
  
  const days: { date: Date; dayOfWeek: number }[] = [];
  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    days.push({ date: dayDate, dayOfWeek: i + 1 });
  }
  return days;
}

export function getWeekDateRange(cohortStartDate: string, weekNumber: number): string {
  const days = getWeekDates(cohortStartDate, weekNumber);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = days[0].date.toLocaleDateString('en-US', options);
  const end = days[4].date.toLocaleDateString('en-US', options);
  const year = days[0].date.getFullYear();
  return `${start} - ${end}, ${year}`;
}

export function getTotalDateRange(cohortStartDate: string, maxWeek: number): string {
  const firstWeek = getWeekDates(cohortStartDate, 1);
  const lastWeek = getWeekDates(cohortStartDate, maxWeek);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const start = firstWeek[0].date.toLocaleDateString('en-US', options);
  const end = lastWeek[4].date.toLocaleDateString('en-US', options);
  return `${start} - ${end}`;
}
