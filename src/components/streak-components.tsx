"use client"

import { useRef, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { FlameIcon as Fire } from "lucide-react"
import type { StreakData } from "@/hooks/use-reflections"

export const FireBar = ({ value, max = 100 }: { value: number; max?: number }) => {
  const progress = (value / max) * 100
  const controls = useAnimation()
  const fireRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    controls.start({
      width: `${progress}%`,
      transition: { duration: 1, ease: "easeOut" },
    })

    if (fireRef.current && value > 0) {
      const particles = Array.from({ length: Math.min(value, 10) }, () => {
        const particle = document.createElement("div")
        particle.className = "absolute bottom-0 rounded-full bg-orange-500 opacity-70"
        particle.style.width = `${Math.random() * 6 + 4}px`
        particle.style.height = `${Math.random() * 6 + 4}px`
        particle.style.left = `${Math.random() * 100}%`
        return particle
      })

      particles.forEach((particle) => {
        fireRef.current?.appendChild(particle)

        const animation = particle.animate(
          [
            {
              transform: `translateY(0) scale(1)`,
              opacity: 0.7,
            },
            {
              transform: `translateY(-${Math.random() * 20 + 10}px) scale(${Math.random() * 0.5 + 0.5})`,
              opacity: 0,
            },
          ],
          {
            duration: Math.random() * 1000 + 1000,
            iterations: Number.POSITIVE_INFINITY,
          },
        )

        return () => {
          animation.cancel()
          particle.remove()
        }
      })

      return () => {
        particles.forEach((p) => p.remove())
      }
    }
  }, [controls, progress, value])

  return (
    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500"
        initial={{ width: 0 }}
        animate={controls}
      />
      <div ref={fireRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
    </div>
  )
}

export const StreakCounter = ({ count }: { count: number }) => {
  const prevCount = useRef(0)
  const countAnimation = useAnimation()

  useEffect(() => {
    if (count !== prevCount.current) {
      countAnimation.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.5 },
      })
      prevCount.current = count
    }
  }, [count, countAnimation])

  return (
    <motion.div className="flex items-center gap-1" animate={countAnimation}>
      <Fire className="h-4 w-4 text-orange-500" />
      <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {count} day streak
      </motion.span>
    </motion.div>
  )
}

export const StreakIcon = ({ streakData }: { streakData: StreakData }) => {
  const { currentStreak, oldStreak, hasCurrentStreak } = streakData
  const displayStreak = hasCurrentStreak ? currentStreak : oldStreak > 0 ? oldStreak : 0

  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-1"
      >
        <Fire
          className={`h-5 w-5 ${hasCurrentStreak ? "text-orange-500" : oldStreak > 0 ? "text-gray-500" : "text-gray-400"}`}
        />
        <span
          className={`text-sm font-medium ${hasCurrentStreak ? "" : oldStreak > 0 ? "text-gray-500" : "text-gray-400"}`}
        >
          {displayStreak}
        </span>
        {!hasCurrentStreak && oldStreak > 0 && <span className="text-xs text-gray-500 ml-1">(previous)</span>}
      </motion.div>
    </div>
  )
}
