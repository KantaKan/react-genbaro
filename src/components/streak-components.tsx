"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import type { StreakData } from "@/hooks/use-reflections"
import { getMilestoneForStreak, isMilestoneReached, getRandomComfortMessage, getFlameTier, getFlameTierConfig, type FlameTier } from "@/lib/streak-milestones"

import { Cat } from "lucide-react"
import { fireConfetti } from "@/lib/confetti"

const tierTextColors: Record<FlameTier, string> = {
  0: "text-muted-foreground",
  1: "text-amber-600 dark:text-amber-400",
  2: "text-emerald-600 dark:text-emerald-400",
  3: "text-indigo-600 dark:text-indigo-400",
  4: "text-purple-600 dark:text-purple-400",
  5: "text-yellow-600 dark:text-yellow-400",
}

const tierSubtextColors: Record<FlameTier, string> = {
  0: "text-muted-foreground/60",
  1: "text-amber-500/80 dark:text-amber-400/70",
  2: "text-emerald-500/80 dark:text-emerald-400/70",
  3: "text-indigo-500/80 dark:text-indigo-400/70",
  4: "text-purple-500/80 dark:text-purple-400/70",
  5: "text-yellow-500/80 dark:text-yellow-400/70",
}

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

const GlowingFlame = ({ tier = 0, active, className }: { tier?: FlameTier; active: boolean; className?: string }) => {
  const wobbleControls = useAnimation()
  const bounceControls = useAnimation()
  const config = getFlameTierConfig(tier)

  useEffect(() => {
    if (active) {
      wobbleControls.start({
        rotate: [0, -3, 2.5, -2, 3, -1.5, 0],
        transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
      })
      bounceControls.start({
        scaleY: [1, 1.06, 0.95, 1.03, 1],
        scaleX: [1, 0.97, 1.04, 0.98, 1],
        transition: { duration: 1.1, repeat: Infinity, ease: "easeInOut" },
      })
    } else {
      wobbleControls.stop()
      wobbleControls.set({ rotate: 0 })
      bounceControls.stop()
      bounceControls.set({ scaleY: 1, scaleX: 1 })
    }
  }, [active, wobbleControls, bounceControls])

  const flameColor = active ? config.flameColor : "#a1a1aa"
  const innerColor = active ? config.innerColor : "#d4d4d8"
  const tipColor = active ? config.tipColor : "#71717a"
  const outlineColor = active ? config.strokeColor : "#52525b"
  const strokeW = 2.2

  const starPositions = [
    { delay: 0.3, x: -8, y: -10, size: 8, color: config.innerColor, dur: 2.2 },
    { delay: 1.1, x: 10, y: -14, size: 7, color: config.flameColor, dur: 2.5 },
    { delay: 2.0, x: -5, y: -18, size: 9, color: config.tipColor, dur: 2.0 },
    { delay: 0.6, x: 12, y: -12, size: 6, color: config.innerColor, dur: 2.3 },
    { delay: 1.5, x: -11, y: -16, size: 7, color: config.flameColor, dur: 2.1 },
    { delay: 2.8, x: 3, y: -20, size: 8, color: config.tipColor, dur: 2.4 },
    { delay: 0.9, x: -6, y: -15, size: 6, color: config.innerColor, dur: 2.7 },
    { delay: 1.9, x: 8, y: -17, size: 7, color: config.flameColor, dur: 2.0 },
    { delay: 2.4, x: -10, y: -13, size: 8, color: config.tipColor, dur: 2.6 },
    { delay: 3.2, x: 6, y: -19, size: 6, color: config.innerColor, dur: 2.2 },
  ]

  const heartPositions = [
    { delay: 0.7, x: 6, dur: 2.8 },
    { delay: 1.8, x: -9, dur: 2.4 },
    { delay: 2.6, x: 3, dur: 2.6 },
    { delay: 3.1, x: -7, dur: 2.3 },
    { delay: 0.4, x: 10, dur: 2.9 },
    { delay: 1.3, x: -4, dur: 2.5 },
    { delay: 2.2, x: 8, dur: 2.7 },
  ]

  const swirlPositions = [
    { delay: 1.4, x: -3, dur: 2.1 },
    { delay: 2.5, x: 7, dur: 2.6 },
    { delay: 3.0, x: -6, dur: 2.3 },
    { delay: 0.8, x: 5, dur: 2.4 },
    { delay: 1.9, x: -8, dur: 2.2 },
  ]

  const diamondPositions = [
    { delay: 0.5, x: -7, dur: 2.0 },
    { delay: 1.6, x: 9, dur: 2.3 },
    { delay: 2.7, x: -4, dur: 2.5 },
    { delay: 3.3, x: 6, dur: 2.1 },
  ]

  const hasStars = active && config.particleTypes.includes("star")
  const hasHearts = active && config.particleTypes.includes("heart")
  const hasSwirls = active && config.particleTypes.includes("swirl")
  const hasDiamonds = active && config.particleTypes.includes("diamond")

  return (
    <div className={`relative ${className}`} style={active && config.hasColorShift ? { filter: "hue-rotate(0deg)" } : undefined}>
      {/* Warm glow halo */}
      {active && (
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: `-${5 * config.glowScale * 10}px`,
            background: `radial-gradient(circle, ${config.glowColor}55 0%, ${config.glowColor}25 55%, transparent 80%)`,
            filter: "blur(8px)",
          }}
          animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Ring — tier 4+ */}
      {active && config.hasRing && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: config.flameColor + "55" }}
          animate={{ scale: [0.85, 1.1, 0.85], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Color shift overlay — tier 5 */}
      {active && config.hasColorShift && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ mixBlendMode: "overlay", background: `linear-gradient(135deg, ${config.flameColor}33, ${config.tipColor}33)` }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Flipbook flame body — 3 frames cycled via stepped timing */}
      <motion.div
        className="absolute inset-0"
        animate={wobbleControls}
        style={{ originX: "50%", originY: "100%" }}
      >
        <motion.div
          className="w-full h-full"
          animate={bounceControls}
          style={{ originX: "50%", originY: "100%" }}
        >
          <svg viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* === Frame 1 — flames tips left === */}
            <motion.g
              animate={active ? { opacity: [1, 0, 0] } : { opacity: 1 }}
              transition={active ? { duration: 0.6, repeat: Infinity, times: [0, 0.01, 1] } : {}}
            >
              <path d="M20 5C17 12 9 20 9 32C9 40 14 47 20 48C26 47 31 40 31 32C31 20 23 12 20 5Z" fill={flameColor} stroke={outlineColor} strokeWidth={strokeW} strokeLinejoin="round" />
              <path d="M20 16C18 21 13 26 13 34C13 39 16 44 20 46C24 44 27 39 27 34C27 26 22 21 20 16Z" fill={innerColor} stroke={outlineColor} strokeWidth={1.5} strokeLinejoin="round" />
              <ellipse cx="20" cy="42" rx="3.5" ry="4" fill={active ? "#FFF8DC" : "#e4e4e7"} stroke={outlineColor} strokeWidth={1} />
              <path d="M20 5C18 11 16 15 14 18C12 21 15 21 17 18C19 15 20 11 20 5Z" fill={tipColor} stroke={outlineColor} strokeWidth={1.3} strokeLinejoin="round" />
            </motion.g>

            {/* === Frame 2 — flames tips right === */}
            <motion.g
              animate={active ? { opacity: [0, 1, 0] } : { opacity: 0 }}
              transition={active ? { duration: 0.6, repeat: Infinity, times: [0, 0.01, 1] } : {}}
            >
              <path d="M20 4C18 11 10 21 10 33C10 40 14 47 20 48C26 47 30 40 30 33C30 21 22 11 20 4Z" fill={flameColor} stroke={outlineColor} strokeWidth={strokeW} strokeLinejoin="round" />
              <path d="M20 15C18 20 14 27 14 34C14 39 17 44 20 46C23 44 26 39 26 34C26 27 22 20 20 15Z" fill={innerColor} stroke={outlineColor} strokeWidth={1.5} strokeLinejoin="round" />
              <ellipse cx="20" cy="41" rx="3.8" ry="4.3" fill={active ? "#FFF8DC" : "#e4e4e7"} stroke={outlineColor} strokeWidth={1} />
              <path d="M20 4C22 10 24 14 26 17C28 20 25 20 23 17C21 14 20 10 20 4Z" fill={tipColor} stroke={outlineColor} strokeWidth={1.3} strokeLinejoin="round" />
            </motion.g>

            {/* === Frame 3 — flames tips center === */}
            <motion.g
              animate={active ? { opacity: [0, 0, 1] } : { opacity: 0 }}
              transition={active ? { duration: 0.6, repeat: Infinity, times: [0, 0.01, 1] } : {}}
            >
              <path d="M20 3C19 10 11 20 11 32C11 40 15 47 20 48C25 47 29 40 29 32C29 20 21 10 20 3Z" fill={flameColor} stroke={outlineColor} strokeWidth={strokeW} strokeLinejoin="round" />
              <path d="M20 14C19 19 15 26 15 33C15 38 17 44 20 46C23 44 25 38 25 33C25 26 21 19 20 14Z" fill={innerColor} stroke={outlineColor} strokeWidth={1.5} strokeLinejoin="round" />
              <ellipse cx="20" cy="42" rx="3.2" ry="3.8" fill={active ? "#FFF8DC" : "#e4e4e7"} stroke={outlineColor} strokeWidth={1} />
              <path d="M20 3C19 8 18 12 17 14C16 16 19 16 20 14C21 12 20 8 20 3Z" fill={tipColor} stroke={outlineColor} strokeWidth={1.3} strokeLinejoin="round" />
            </motion.g>

            {/* === Crown tips — tier 4+ === */}
            {active && config.hasCrownTips && (
              <>
                <motion.g
                  animate={{ y: [0, -1.5, 0, 1, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <path d="M14 7C13 4 11 2 10 5C9 8 12 9 14 7Z" fill={config.tipColor} stroke={outlineColor} strokeWidth={1} strokeLinejoin="round" />
                  <path d="M20 5C20 2 20 0 20 3C20 6 20 7 20 5Z" fill={config.tipColor} stroke={outlineColor} strokeWidth={1} strokeLinejoin="round" />
                  <path d="M26 7C27 4 29 2 30 5C31 8 28 9 26 7Z" fill={config.tipColor} stroke={outlineColor} strokeWidth={1} strokeLinejoin="round" />
                </motion.g>
              </>
            )}

            {/* === Cute face === */}
            {active ? (
              <>
                {/* Eyes — round dots with occasional blink */}
                <motion.circle
                  cx="16" cy="33" r="1.8" fill={outlineColor}
                  animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity, times: [0, 0.92, 0.95, 0.98, 1] }}
                  style={{ originY: "33px" }}
                />
                <motion.circle
                  cx="24" cy="33" r="1.8" fill={outlineColor}
                  animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity, times: [0, 0.92, 0.95, 0.98, 1] }}
                  style={{ originY: "33px" }}
                />
                {/* Smile */}
                <path d="M17 37C18 39 22 39 23 37" stroke={outlineColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />
                {/* Rosy cheeks */}
                <circle cx="13" cy="36" r="2" fill={config.flameColor} opacity={0.25} />
                <circle cx="27" cy="36" r="2" fill={config.flameColor} opacity={0.25} />
              </>
            ) : (
              <>
                {/* Dead eyes — X marks */}
                <line x1="14.5" y1="31.5" x2="17.5" y2="34.5" stroke={outlineColor} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="17.5" y1="31.5" x2="14.5" y2="34.5" stroke={outlineColor} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="22.5" y1="31.5" x2="25.5" y2="34.5" stroke={outlineColor} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="25.5" y1="31.5" x2="22.5" y2="34.5" stroke={outlineColor} strokeWidth="1.5" strokeLinecap="round" />
                {/* Flat mouth */}
                <line x1="17" y1="38" x2="23" y2="38" stroke={outlineColor} strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
          </svg>
        </motion.div>
      </motion.div>

      {/* Floating doodle particles */}
      {active && config.particleCount > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {/* Star sparkles */}
          {hasStars && starPositions.slice(0, Math.ceil(config.particleCount * 0.4)).map((p, i) => (
            <motion.svg
              key={`star-${i}`}
              viewBox="0 0 12 12"
              className="absolute left-1/2 top-0"
              style={{ width: p.size, height: p.size, marginLeft: -p.size / 2 }}
              initial={{ x: p.x, y: 0, opacity: 0, scale: 0, rotate: 0 }}
              animate={{
                x: [p.x, p.x + 4, p.x - 3, p.x + 2],
                y: [0, p.y * 0.5, p.y, p.y - 6],
                opacity: [0, 1, 0.8, 0],
                scale: [0, 1.2, 0.9, 0],
                rotate: [0, 45, 90, 135],
              }}
              transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeOut" }}
            >
              <path
                d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z"
                fill={p.color}
                stroke={outlineColor}
                strokeWidth="0.6"
              />
            </motion.svg>
          ))}

          {/* Tiny hearts */}
          {hasHearts && heartPositions.slice(0, Math.ceil(config.particleCount * 0.3)).map((h, i) => (
            <motion.svg
              key={`heart-${i}`}
              viewBox="0 0 12 12"
              className="absolute left-1/2 top-0"
              style={{ width: 7, height: 7, marginLeft: -3.5 }}
              initial={{ x: h.x, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: [h.x, h.x + 3, h.x - 2],
                y: [0, -12, -24],
                opacity: [0, 1, 0],
                scale: [0, 1.1, 0.3],
              }}
              transition={{ duration: h.dur, repeat: Infinity, delay: h.delay, ease: "easeOut" }}
            >
              <path
                d="M6 10L5.2 9.3C2.4 6.7 0.5 5 0.5 2.8C0.5 1.1 1.8 0 3.4 0C4.3 0 5.2 0.4 6 1.1C6.8 0.4 7.7 0 8.6 0C10.2 0 11.5 1.1 11.5 2.8C11.5 5 9.6 6.7 6.8 9.3L6 10Z"
                fill={tipColor}
                stroke={outlineColor}
                strokeWidth="0.7"
              />
            </motion.svg>
          ))}

          {/* Swirl sparkles */}
          {hasSwirls && swirlPositions.slice(0, Math.ceil(config.particleCount * 0.2)).map((s, i) => (
            <motion.svg
              key={`swirl-${i}`}
              viewBox="0 0 10 10"
              className="absolute left-1/2 top-0"
              style={{ width: 6, height: 6, marginLeft: -3 }}
              initial={{ x: s.x, y: 0, opacity: 0, scale: 0, rotate: 0 }}
              animate={{
                x: [s.x, s.x + 2, s.x - 1],
                y: [0, -8, -20],
                opacity: [0, 0.9, 0],
                scale: [0, 1, 0.2],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: "easeOut" }}
            >
              <path
                d="M5 8C5 8 2 6 2 4C2 2.5 3.5 1.5 5 2C6.5 2.5 6.5 4 5 4.5C3.5 5 3.5 3 5 3"
                fill="none"
                stroke={innerColor}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </motion.svg>
          ))}

          {/* Diamond sparkles — tier 4+ */}
          {hasDiamonds && diamondPositions.slice(0, Math.ceil(config.particleCount * 0.1)).map((d, i) => (
            <motion.svg
              key={`diamond-${i}`}
              viewBox="0 0 10 10"
              className="absolute left-1/2 top-0"
              style={{ width: 7, height: 7, marginLeft: -3.5 }}
              initial={{ x: d.x, y: 0, opacity: 0, scale: 0, rotate: 0 }}
              animate={{
                x: [d.x, d.x + 2, d.x - 1, d.x + 1],
                y: [0, -6, -14, -22],
                opacity: [0, 1, 0.7, 0],
                scale: [0, 1.1, 0.8, 0],
                rotate: [0, 90, 180, 270],
              }}
              transition={{ duration: d.dur, repeat: Infinity, delay: d.delay, ease: "easeOut" }}
            >
              <path
                d="M5 0L10 5L5 10L0 5Z"
                fill={config.innerColor}
                stroke={outlineColor}
                strokeWidth="0.6"
              />
            </motion.svg>
          ))}
        </div>
      )}
    </div>
  )
}

export const StreakIcon = ({ streakData, showMilestoneToast = true }: { streakData: StreakData; showMilestoneToast?: boolean }) => {
  const { currentStreak, oldStreak, hasCurrentStreak } = streakData
  const displayStreak = hasCurrentStreak ? currentStreak : oldStreak > 0 ? oldStreak : 0
  const tier = hasCurrentStreak ? getFlameTier(displayStreak) : 0
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
            tier={tier}
            active={hasCurrentStreak}
            className="w-10 h-12 flex-shrink-0"
          />
          <div className="flex flex-col leading-none">
            <span
              className={`text-lg font-bold tabular-nums ${hasCurrentStreak ? tierTextColors[tier] : oldStreak > 0 ? "text-muted-foreground" : "text-muted-foreground/60"}`}
            >
              {displayStreak}
            </span>
            <span
              className={`text-[10px] font-medium uppercase tracking-wider ${hasCurrentStreak ? tierSubtextColors[tier] : "text-muted-foreground/60"}`}
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
