import { useCalendar } from '../store/useCalendarStore';
import { DAYS_OF_WEEK, getWeekDates } from '../types/calendar';
import { SessionBlock } from './SessionBlock';
import { TIME_SLOTS } from '../types/calendar';

export function CalendarGrid() {
  const { 
    selectedCohort, 
    selectedWeek, 
    cohorts, 
    getSessionsForWeek,
    openModal 
  } = useCalendar();

  const cohort = cohorts.find(c => c.id === selectedCohort);
  const weekDays = cohort ? getWeekDates(cohort.startDate, selectedWeek) : [];
  const sessions = getSessionsForWeek(selectedWeek);

  const timeSlots = TIME_SLOTS.filter(time => {
    const [hours] = time.split(':').map(Number);
    return hours >= 9 && hours < 17;
  });

  const handleSlotClick = (dayOfWeek: number, time: string) => {
    openModal({
      weekNumber: selectedWeek,
      dayOfWeek,
      startTime: time,
      durationMinutes: 60,
    } as any);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="flex sticky top-0 z-10 bg-background border-b">
          <div className="w-20 shrink-0 border-r" />
          {weekDays.map((day, index) => {
            const dayNum = day.date.getDate();
            const dayName = DAYS_OF_WEEK[index].label;
            const isToday = day.date.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={day.dayOfWeek}
                className="flex-1 min-w-[120px] py-3 px-2 text-center border-r last:border-r-0"
              >
                <div className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {dayName} {dayNum}
                </div>
                {isToday && (
                  <div className="w-2 h-2 rounded-full bg-primary mx-auto mt-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Time Grid */}
        <div className="relative">
          {timeSlots.map((time, timeIndex) => {
            const [hours] = time.split(':').map(Number);
            const isHourStart = time.endsWith(':00');
            
            return (
              <div key={time} className="flex border-b last:border-b-0">
                {/* Time Label */}
                <div className="w-20 shrink-0 border-r py-2 px-2 text-xs text-muted-foreground text-right">
                  {isHourStart && (
                    <span className="text-[10px]">{time}</span>
                  )}
                </div>
                
                {/* Day Columns */}
                {weekDays.map((day, dayIndex) => {
                  const dayOfWeek = day.dayOfWeek;
                  const isHourStart = time.endsWith(':00');
                  
                  return (
                    <div 
                      key={`${dayOfWeek}-${time}`}
                      className="flex-1 min-w-[120px] h-12 border-r last:border-r-0 relative group"
                      onClick={() => handleSlotClick(dayOfWeek, time)}
                    >
                      {/* Hour line */}
                      {isHourStart && (
                        <div className="absolute inset-x-0 top-0 h-px bg-border" />
                      )}
                      
                      {/* Half-hour line */}
                      <div className="absolute inset-x-0 top-1/2 h-px bg-border/50" />
                      
                      {/* Add button on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center text-lg">
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Sessions Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {sessions.map(session => (
              <div key={session.id} className="pointer-events-auto">
                <SessionBlock session={session} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
