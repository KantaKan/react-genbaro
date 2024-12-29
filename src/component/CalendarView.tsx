import React, { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatDate, isSameDay } from "../lib/utils";

interface CalendarViewProps {
  filledDates: Date[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
}

export function CalendarView({ filledDates, onSelectDate, selectedDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isDateFilled = (date: Date) => {
    return filledDates.some((filledDate) => isSameDay(filledDate, date));
  };

  const isPastDate = (date: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < now;
  };

  const isFutureDate = (date: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > now;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="p-2" />;
          }

          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const filled = isDateFilled(date);
          const past = isPastDate(date);
          const future = isFutureDate(date);
          const isToday = isSameDay(date, today);

          return (
            <Button
              key={date.toISOString()}
              variant="ghost"
              className={cn(
                "h-12 w-full rounded-lg relative",
                isSelected && "bg-primary/10 text-primary",
                filled && "bg-emerald-50 text-emerald-600",
                past && !filled && "bg-red-50 text-red-600",
                future && "opacity-50 cursor-not-allowed",
                isToday && "ring-2 ring-primary ring-offset-2"
              )}
              disabled={future}
              onClick={() => onSelectDate(date)}
            >
              <span className="absolute inset-0 flex items-center justify-center">{date.getDate()}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
