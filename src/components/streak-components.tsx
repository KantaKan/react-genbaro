"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import type { StreakData } from "@/hooks/use-reflections"
import { getMilestoneForStreak, isMilestoneReached, getRandomComfortMessage } from "@/lib/streak-milestones"

import { Cat } from "lucide-react"
import { fireConfetti } from "@/lib/confetti"

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
        particle.className = "absolute bottom-0 rounded-full bg-amber-500 opacity-70"
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
    <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-amber-400"
        initial={{ width: 0 }}
        animate={controls}
      />
      <div ref={fireRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
    </div>
  )
}

export const StreakCounter = ({ count, hasActiveStreak = true }: { count: number; hasActiveStreak?: boolean }) => {
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

  if (!hasActiveStreak && count === 0) {
    return <ComfortZoneMessage type="gentle" />
  }

  return (
    <motion.div className="flex items-center gap-1" animate={countAnimation}>
      <span className="text-amber-500 text-sm">🔥</span>
      <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {count} day streak
      </motion.span>
    </motion.div>
  )
}

const EMOJI_COUNT = 8

type CelebrationEffect = "fireEmoji" | "sparkleRain" | "starBurst" | "emojiConfetti" | "glowPulse"

function getRandomCelebrationEffect(): CelebrationEffect {
  const effects: CelebrationEffect[] = ["fireEmoji", "sparkleRain", "starBurst", "emojiConfetti", "glowPulse"]
  return effects[Math.floor(Math.random() * effects.length)]
}

const SparkleRain = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none z-30">
      {Array.from({ length: 12 }, (_, i) => {
        const delay = i * 0.08
        const startX = Math.random() * 60 - 30
        const startY = -20 - Math.random() * 30

        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 text-lg select-none"
            initial={{ x: startX, y: startY, opacity: 1, scale: 1 }}
            animate={{ y: startY + 80, opacity: 0, scale: 0.3 }}
            transition={{ duration: 1.2, delay, ease: "easeIn" }}
          >
            ✨
          </motion.span>
        )
      })}
    </div>
  )
}

const StarBurst = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 1200)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 pointer-events-none z-30">
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (360 / 10) * i
        const radians = (angle * Math.PI) / 180
        const distance = 60 + Math.random() * 15

        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 text-xl select-none"
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: Math.cos(radians) * distance,
              y: Math.sin(radians) * distance,
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            ⭐
          </motion.span>
        )
      })}
    </div>
  )
}

const EmojiConfetti = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 1800)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 pointer-events-none z-30">
      {Array.from({ length: 16 }, (_, i) => {
        const emojis = ["🔥", "⭐", "🎉", "🎊", "✨", "💪", "🏆", "🎯"]
        const startX = Math.random() * 40 - 20
        const startY = -30 - Math.random() * 20
        const endX = startX + (Math.random() * 100 - 50)
        const endY = startY + 120

        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 text-xl select-none"
            initial={{ x: startX, y: startY, opacity: 1, scale: 1, rotate: 0 }}
            animate={{ x: endX, y: endY, opacity: 0, scale: 0.5, rotate: Math.random() * 360 }}
            transition={{ duration: 1.5, delay: i * 0.05, ease: "easeOut" }}
          >
            {emojis[i % emojis.length]}
          </motion.span>
        )
      })}
    </div>
  )
}

const GlowPulse = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 1000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      className="absolute inset-0 rounded-full pointer-events-none z-30"
      style={{
        background: "radial-gradient(circle, rgba(255,165,0,0.4) 0%, rgba(255,69,0,0.2) 50%, transparent 70%)",
      }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [0.5, 2, 0.5], opacity: [0, 0.8, 0] }}
      transition={{ duration: 1, ease: "easeOut" }}
    />
  )
}

const FireEmojiBurst = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 1200)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 pointer-events-none z-30">
      {Array.from({ length: EMOJI_COUNT }, (_, i) => {
        const angle = (360 / EMOJI_COUNT) * i + (Math.random() * 20 - 10)
        const radians = (angle * Math.PI) / 180
        const distance = 50 + Math.random() * 20
        const tx = Math.cos(radians) * distance
        const ty = Math.sin(radians) * distance

        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 text-2xl select-none"
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: tx,
              y: ty,
              scale: [0, 1.3, 0],
              opacity: [0, 1, 0],
              rotate: Math.random() * 60 - 30,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            🔥
          </motion.span>
        )
      })}
    </div>
  )
}

const GlowingFlame = ({ active, className }: { active: boolean; className?: string }) => {
  const idleControls = useAnimation()

  useEffect(() => {
    if (active) {
      idleControls.start({
        scale: [1, 1.06, 1],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
      })
    } else {
      idleControls.stop()
      idleControls.set({ scale: 1 })
    }
  }, [active, idleControls])

  const baseColor = active ? "#f59e0b" : "#a1a1aa"
  const glowColor = active ? "rgba(251,191,36,0.55)" : "transparent"
  const innerGlow = active ? "rgba(245,158,11,0.35)" : "transparent"

  return (
    <motion.div
      animate={idleControls}
      className={`relative ${className}`}
    >
      {/* Glow halo */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, ${innerGlow} 40%, transparent 70%)`,
          filter: "blur(6px)",
        }}
        animate={
          active
            ? { opacity: [0.6, 1, 0.6], scale: [0.95, 1.15, 0.95] }
            : { opacity: 0 }
        }
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* SVG flame */}
      <svg
        viewBox="0 0 40 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full"
      >
        <defs>
          <linearGradient id="flameGrad" x1="20" y1="48" x2="20" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={active ? "#ef4444" : "#71717a"} />
            <stop offset="45%" stopColor={active ? "#f97316" : "#a1a1aa"} />
            <stop offset="100%" stopColor={active ? "#fbbf24" : "#d4d4d8"} />
          </linearGradient>
          <radialGradient id="innerFlame" cx="20" cy="34" r="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={active ? "#fef08a" : "#e4e4e7"} stopOpacity="0.9" />
            <stop offset="100%" stopColor={active ? "#f97316" : "#a1a1aa"} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer flame */}
        <motion.path
          d="M20 2C20 2 8 14 8 26C8 34 13 42 20 46C27 42 32 34 32 26C32 14 20 2 20 2Z"
          fill="url(#flameGrad)"
          animate={
            active
              ? { d: [
                  "M20 2C20 2 8 14 8 26C8 34 13 42 20 46C27 42 32 34 32 26C32 14 20 2 20 2Z",
                  "M20 0C20 0 6 15 6 27C6 35 12 43 20 47C28 43 34 35 34 27C34 15 20 0 20 0Z",
                  "M20 2C20 2 8 14 8 26C8 34 13 42 20 46C27 42 32 34 32 26C32 14 20 2 20 2Z",
                ] }
              : {}
          }
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Inner flame core */}
        <motion.path
          d="M20 18C20 18 14 24 14 30C14 34 17 38 20 40C23 38 26 34 26 30C26 24 20 18 20 18Z"
          fill="url(#innerFlame)"
          animate={
            active
              ? { d: [
                  "M20 18C20 18 14 24 14 30C14 34 17 38 20 40C23 38 26 34 26 30C26 24 20 18 20 18Z",
                  "M20 16C20 16 12 25 12 31C12 35 16 39 20 41C24 39 28 35 28 31C28 25 20 16 20 16Z",
                  "M20 18C20 18 14 24 14 30C14 34 17 38 20 40C23 38 26 34 26 30C26 24 20 18 20 18Z",
                ] }
              : {}
          }
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Bright center dot */}
        {active && (
          <motion.circle
            cx="20"
            cy="34"
            r="3"
            fill="#fef9c3"
            opacity="0.8"
            animate={{ opacity: [0.5, 0.9, 0.5], r: [2.5, 3.5, 2.5] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </svg>

      {/* Floating embers */}
      {active && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 bottom-full block w-1.5 h-1.5 rounded-full bg-amber-400"
              initial={{ y: 0, x: 0, opacity: 0, scale: 1 }}
              animate={{
                y: [0, -18 - i * 6, -28 - i * 4],
                x: [0, (i - 1) * 4, (i % 2 === 0 ? 1 : -1) * 6],
                opacity: [0, 0.9, 0],
                scale: [1, 0.8, 0.3],
              }}
              transition={{
                duration: 1.6 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}

export const StreakIcon = ({ streakData, showMilestoneToast = true }: { streakData: StreakData; showMilestoneToast?: boolean }) => {
  const { currentStreak, oldStreak, hasCurrentStreak } = streakData
  const displayStreak = hasCurrentStreak ? currentStreak : oldStreak > 0 ? oldStreak : 0
  const prevStreakRef = useRef(0)
  const [celebrating, setCelebrating] = useState(false)
  const [celebrationEffect, setCelebrationEffect] = useState<CelebrationEffect>("fireEmoji")
  const hasSubmittedRef = useRef(false)

  const handleCelebrationDone = useCallback(() => {
    setCelebrating(false)
  }, [])

  useEffect(() => {
    if (!showMilestoneToast || !hasCurrentStreak) return

    const prev = prevStreakRef.current
    const milestone = getMilestoneForStreak(currentStreak)

    if (isMilestoneReached(currentStreak, prev) && currentStreak > prev && milestone) {
      hasSubmittedRef.current = true
      setCelebrationEffect(getRandomCelebrationEffect())
      setCelebrating(true)
      fireConfetti()
    }

    prevStreakRef.current = currentStreak
  }, [currentStreak, hasCurrentStreak, showMilestoneToast])

  return (
    <div className="flex items-center gap-2">
      <div className="relative overflow-visible">
        <AnimatePresence>
          {celebrating && celebrationEffect === "fireEmoji" && <FireEmojiBurst onDone={handleCelebrationDone} />}
          {celebrating && celebrationEffect === "sparkleRain" && <SparkleRain onDone={handleCelebrationDone} />}
          {celebrating && celebrationEffect === "starBurst" && <StarBurst onDone={handleCelebrationDone} />}
          {celebrating && celebrationEffect === "emojiConfetti" && <EmojiConfetti onDone={handleCelebrationDone} />}
          {celebrating && celebrationEffect === "glowPulse" && <GlowPulse onDone={handleCelebrationDone} />}
        </AnimatePresence>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: celebrating ? [1, 1.3, 1] : 1, opacity: 1 }}
          transition={{ duration: celebrating ? 0.6 : 0.3 }}
          className="flex items-center gap-2 relative z-20"
        >
          <GlowingFlame
            active={hasCurrentStreak}
            className="w-10 h-12 flex-shrink-0"
          />
          <div className="flex flex-col leading-none">
            <span
              className={`text-lg font-bold tabular-nums ${hasCurrentStreak ? "text-amber-600 dark:text-amber-400" : oldStreak > 0 ? "text-muted-foreground" : "text-muted-foreground/60"}`}
            >
              {displayStreak}
            </span>
            <span
              className={`text-[10px] font-medium uppercase tracking-wider ${hasCurrentStreak ? "text-amber-500/80 dark:text-amber-400/70" : "text-muted-foreground/60"}`}
            >
              days
            </span>
            {!hasCurrentStreak && oldStreak > 0 && (
              <span className="text-[9px] text-muted-foreground mt-0.5">(previous)</span>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export const ComfortZoneMessage = ({ 
  type = "gentle",
  className 
}: { 
  type?: "rest" | "comeback" | "gentle"
  className?: string 
}) => {
  const message = getRandomComfortMessage(type)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}
    >
      <Cat className="h-4 w-4 text-pink-400" />
      <span className="italic">{message}</span>
    </motion.div>
  )
}
