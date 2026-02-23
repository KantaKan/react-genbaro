"use client"

import { motion } from "framer-motion"
import { Flame, Calendar, Target } from "lucide-react"
import type { StreakData } from "@/hooks/use-reflections"

interface HeroStatsProps {
  totalReflections: number
  streakData: StreakData
  lastActiveDate: Date | null
}

export function HeroStats({ totalReflections, streakData, lastActiveDate }: HeroStatsProps) {
  const { currentStreak, hasCurrentStreak } = streakData
  const displayStreak = hasCurrentStreak ? currentStreak : 0

  const formatDate = (date: Date | null) => {
    if (!date) return "Never"
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    
    if (dateStr === todayStr) return "Today"
    if (dateStr === yesterdayStr) return "Yesterday"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const stats = [
    {
      label: "Total Reflections",
      value: totalReflections,
      icon: Target,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Current Streak",
      value: displayStreak,
      suffix: displayStreak === 1 ? "day" : "days",
      icon: Flame,
      color: hasCurrentStreak ? "text-orange-500" : "text-gray-400",
      bgColor: hasCurrentStreak ? "bg-orange-500/10" : "bg-gray-500/10",
      animate: hasCurrentStreak && displayStreak >= 3,
    },
    {
      label: "Last Active",
      value: formatDate(lastActiveDate),
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ]

  return (
    <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl ${stat.bgColor}`}
        >
          <stat.icon className={`h-5 w-5 ${stat.color}`} />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <span className={`font-semibold ${stat.color}`}>
              {stat.value}
              {stat.suffix && <span className="text-sm font-normal ml-1">{stat.suffix}</span>}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
