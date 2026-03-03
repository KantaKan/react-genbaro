import { CalendarProvider } from './store/useCalendarStore';
import { CohortSelector, WeekNavigator } from './components/CalendarControls';
import { CalendarGrid } from './components/CalendarGrid';
import { AddSessionModal } from './components/AddSessionModal';
import { Calendar } from 'lucide-react';

function CalendarPageContent() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Cohort Calendar</h1>
            <p className="text-sm text-muted-foreground">
              Schedule and manage teaching sessions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <CohortSelector />
          <WeekNavigator />
        </div>
      </div>

      {/* Calendar Grid */}
      <CalendarGrid />

      {/* Modal */}
      <AddSessionModal />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <CalendarProvider>
      <CalendarPageContent />
    </CalendarProvider>
  );
}
