import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useCalendar } from '../store/useCalendarStore';
import { TOPIC_COLORS, DAYS_OF_WEEK, DURATION_OPTIONS, TIME_SLOTS } from '../types/calendar';

export function AddSessionModal() {
  const { 
    isModalOpen, 
    closeModal, 
    editingSession,
    addSession,
    updateSession,
    deleteSession,
    instructors,
    addInstructor,
    selectedCohort,
    selectedWeek,
  } = useCalendar();

  const [sessionName, setSessionName] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [newInstructorName, setNewInstructorName] = useState('');
  const [showNewInstructor, setShowNewInstructor] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [color, setColor] = useState(TOPIC_COLORS[0].value);
  const [weekNumber, setWeekNumber] = useState(1);

  useEffect(() => {
    if (editingSession) {
      setSessionName(editingSession.sessionName);
      setInstructorId(editingSession.instructorId);
      setDayOfWeek(editingSession.dayOfWeek);
      setStartTime(editingSession.startTime);
      setDurationMinutes(editingSession.durationMinutes);
      setColor(editingSession.color);
      setWeekNumber(editingSession.weekNumber);
    } else {
      setSessionName('');
      setInstructorId(instructors[0]?.id || '');
      setNewInstructorName('');
      setShowNewInstructor(false);
      setDayOfWeek(1);
      setStartTime('09:00');
      setDurationMinutes(60);
      setColor(TOPIC_COLORS[0].value);
      setWeekNumber(selectedWeek);
    }
  }, [editingSession, isModalOpen, instructors, selectedWeek]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalInstructorId = instructorId;
    
    if (showNewInstructor && newInstructorName.trim()) {
      const newId = Date.now().toString();
      addInstructor(newInstructorName.trim());
      finalInstructorId = newId;
    }

    const sessionData = {
      cohortId: selectedCohort,
      weekNumber,
      dayOfWeek,
      startTime,
      durationMinutes,
      sessionName,
      instructorId: finalInstructorId,
      color,
    };

    if (editingSession) {
      updateSession(editingSession.id, sessionData);
    } else {
      addSession(sessionData);
    }

    closeModal();
  };

  const handleDelete = () => {
    if (editingSession) {
      deleteSession(editingSession.id);
      closeModal();
    }
  };

  const filteredTimeSlots = TIME_SLOTS.filter(time => {
    const [hours] = time.split(':').map(Number);
    return hours >= 9 && hours < 17;
  });

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingSession ? 'Edit Session' : 'Add New Session'}
          </DialogTitle>
          <DialogDescription>
            {editingSession 
              ? 'Update the session details below.' 
              : 'Fill in the details to create a new session.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionName">Session Name</Label>
            <Input
              id="sessionName"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., Technical - HTML/CSS"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Week</Label>
              <Select value={weekNumber.toString()} onValueChange={(v) => setWeekNumber(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 }, (_, i) => i + 1).map(week => (
                    <SelectItem key={week} value={week.toString()}>
                      Week {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Day</Label>
              <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.fullLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredTimeSlots.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select 
                value={durationMinutes.toString()} 
                onValueChange={(v) => setDurationMinutes(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(dur => (
                    <SelectItem key={dur.value} value={dur.value.toString()}>
                      {dur.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Instructor</Label>
            {showNewInstructor ? (
              <div className="flex gap-2">
                <Input
                  value={newInstructorName}
                  onChange={(e) => setNewInstructorName(e.target.value)}
                  placeholder="Enter instructor name"
                  required
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowNewInstructor(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select value={instructorId} onValueChange={setInstructorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map(inst => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowNewInstructor(true)}
                >
                  + New
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Topic Color</Label>
            <div className="flex flex-wrap gap-2">
              {TOPIC_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            {editingSession && (
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingSession ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
