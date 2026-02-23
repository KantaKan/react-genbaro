"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Check, Minus } from "lucide-react"
import { getThailandTime, isWeekend, isHoliday, getThailandDateISO } from "@/utils/date-utils"

interface Reflection {
  day?: string
  date?: string
  createdAt?: string
}

interface WeeklyProgressCalendarProps {
  reflections: Reflection[]
}

function getThailandDateFromUTC(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
}

export function WeeklyProgressCalendar({ reflections }: WeeklyProgressCalendarProps) {
  const weekDays = useMemo(() => {
    const today = getThailandTime()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)
    
    const reflectionDates = new Set(
      reflections.map(r => {
        if (r.createdAt) {
          return getThailandDateFromUTC(r.createdAt)
        }
        return (r.day || r.date || '').split('T')[0]
      })
    )
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      
      const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
      const isToday = dateStr === getThailandDateISO()
      const isWeekendDay = isWeekend(date)
      const isHolidayDay = isHoliday(date)
      
      const hasReflection = reflectionDates.has(dateStr)
      
      days.push({
        date,
        dateStr,
        dayName: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
        dayNum: date.getDate(),
        isToday,
        isWeekend: isWeekendDay,
        isHoliday: isHolidayDay,
        hasReflection,
        isFuture: date > today
      })
    }
    
    return days
  }, [reflections])

  return (
    <div className="flex items-center justify-center gap-1.5">
      {weekDays.map((day, index) => {
        const isNonWorkingDay = day.isWeekend || day.isHoliday
        const status = day.isFuture ? 'future' : isNonWorkingDay ? 'non-working' : day.hasReflection ? 'complete' : 'incomplete'
        
        let bgColor = 'bg-muted/50'
        let textColor = 'text-muted-foreground'
        let Icon = null
        
        if (status === 'complete') {
          bgColor = 'bg-green-500/20 dark:bg-green-500/30'
          textColor = 'text-green-600 dark:text-green-400'
          Icon = Check
        } else if (status === 'incomplete') {
          bgColor = 'bg-amber-500/20 dark:bg-amber-500/30'
          textColor = 'text-amber-600 dark:text-amber-400'
        } else if (status === 'non-working') {
          bgColor = 'bg-muted/30'
          textColor = 'text-muted-foreground/50'
          Icon = Minus
        } else if (status === 'future') {
          bgColor = 'bg-transparent border border-dashed border-muted-foreground/30'
          textColor = 'text-muted-foreground/50'
        }
        
        return (
          <motion.div
            key={day.dateStr}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center gap-1"
          >
            <span className={`text-xs font-medium ${day.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
              {day.dayName}
            </span>
            <div
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                ${bgColor}
                ${day.isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                transition-all duration-200
              `}
            >
              {Icon ? (
                <Icon className={`h-4 w-4 ${textColor}`} />
              ) : status === 'future' ? (
                <span className={`text-xs ${textColor}`}>?</span>
              ) : (
                <span className={`text-xs font-medium ${textColor}`}>
                  {day.date.getDate()}
                </span>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
