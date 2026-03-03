import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarSession, TIME_SLOTS } from '../types/calendar';
import { useCalendar } from '../store/useCalendarStore';

interface SessionBlockProps {
  session: CalendarSession;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function SessionBlock({ session }: SessionBlockProps) {
  const { getInstructorName, updateSession, openModal } = useCalendar();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, startTime: 0, startDay: 1, duration: 0 });

  const startMinutes = timeToMinutes(session.startTime);
  const endMinutes = startMinutes + session.durationMinutes;
  const topOffset = ((startMinutes - 540) / 15) * 48; // 540 = 9:00 in minutes
  const height = (session.durationMinutes / 15) * 48;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startTime: startMinutes,
      startDay: session.dayOfWeek,
      duration: session.durationMinutes,
    };
  }, [startMinutes, session.dayOfWeek, session.durationMinutes]);

  const handleResizeStart = useCallback((direction: 'top' | 'bottom', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(direction);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startTime: startMinutes,
      startDay: session.dayOfWeek,
      duration: session.durationMinutes,
    };
  }, [startMinutes, session.dayOfWeek, session.durationMinutes]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const dayDelta = Math.round(deltaX / 100);
      const timeDelta = Math.round(deltaY / 48) * 15;
      
      if (isDragging) {
        let newDay = Math.max(1, Math.min(5, dragStartRef.current.startDay + dayDelta));
        let newTime = Math.max(540, Math.min(1020, dragStartRef.current.startTime + timeDelta));
        newTime = Math.round(newTime / 15) * 15;
        
        updateSession(session.id, {
          dayOfWeek: newDay,
          startTime: minutesToTime(newTime),
        });
      } else if (isResizing) {
        if (isResizing === 'bottom') {
          let newDuration = dragStartRef.current.duration + timeDelta;
          newDuration = Math.max(15, Math.min(480, newDuration));
          newDuration = Math.round(newDuration / 15) * 15;
          
          updateSession(session.id, { durationMinutes: newDuration });
        } else {
          let newStart = dragStartRef.current.startTime + timeDelta;
          newStart = Math.max(540, Math.min(1020 - 15, newStart));
          newStart = Math.round(newStart / 15) * 15;
          
          const newDuration = dragStartRef.current.startTime + dragStartRef.current.duration - newStart;
          if (newDuration >= 15) {
            updateSession(session.id, {
              startTime: minutesToTime(newStart),
              durationMinutes: newDuration,
            });
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, session.id, updateSession]);

  const formatTime = (time: string, minutes: number) => {
    const start = time;
    const endMins = timeToMinutes(time) + minutes;
    const end = minutesToTime(endMins);
    const durationLabel = minutes >= 60 
      ? `${Math.floor(minutes / 60)}${minutes % 60 ? `h ${minutes % 60}m` : 'h'}`
      : `${minutes}m`;
    return `${start} - ${end} (${durationLabel})`;
  };

  return (
    <motion.div
      ref={blockRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute left-1 right-1 rounded-lg cursor-move group select-none overflow-hidden"
      style={{
        top: topOffset,
        height: height,
        backgroundColor: `${session.color}15`,
        borderLeft: `4px solid ${session.color}`,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        if (!isDragging) {
          openModal(session);
        }
      }}
    >
      <div className="p-2 h-full flex flex-col justify-between">
        <div>
          <div className="font-medium text-sm truncate" style={{ color: session.color }}>
            {session.sessionName}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {getInstructorName(session.instructorId)}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTime(session.startTime, session.durationMinutes)}
        </div>
      </div>
      
      <div 
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => handleResizeStart('top', e)}
      />
      <div 
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => handleResizeStart('bottom', e)}
      />
    </motion.div>
  );
}
