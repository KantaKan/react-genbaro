import { useCalendar } from '../store/useCalendarStore';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { getWeekDateRange, getTotalDateRange } from '../types/calendar';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CohortSelector() {
  const { cohorts, selectedCohort, setSelectedCohort } = useCalendar();
  const cohort = cohorts.find(c => c.id === selectedCohort);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Cohort:</span>
      <Select value={selectedCohort} onValueChange={setSelectedCohort}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {cohorts.map(c => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {cohort && (
        <span className="text-sm text-muted-foreground ml-2">
          {getTotalDateRange(cohort.startDate, 15)}
        </span>
      )}
    </div>
  );
}

export function WeekNavigator() {
  const { 
    selectedCohort, 
    selectedWeek, 
    setSelectedWeek, 
    cohorts, 
    getWeeksWithSessions,
    openModal 
  } = useCalendar();

  const cohort = cohorts.find(c => c.id === selectedCohort);
  const weeksWithSessions = getWeeksWithSessions();
  
  const allWeeks = Array.from({ length: 15 }, (_, i) => i + 1);
  const visibleWeeks = weeksWithSessions.length > 0 ? weeksWithSessions : [1];
  const currentIndex = visibleWeeks.indexOf(selectedWeek);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < visibleWeeks.length - 1;

  const handlePrev = () => {
    if (canGoPrev) {
      setSelectedWeek(visibleWeeks[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setSelectedWeek(visibleWeeks[currentIndex + 1]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handlePrev}
        disabled={!canGoPrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select 
        value={selectedWeek.toString()} 
        onValueChange={(v) => setSelectedWeek(parseInt(v))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {visibleWeeks.map(week => (
            <SelectItem key={week} value={week.toString()}>
              {cohort && getWeekDateRange(cohort.startDate, week)}
            </SelectItem>
          ))}
          {weeksWithSessions.length < 15 && (
            <SelectItem value="add-week">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Plus className="h-3 w-3" />
                Add Week...
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleNext}
        disabled={!canGoNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => openModal()}
        className="ml-2"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Session
      </Button>
    </div>
  );
}
