"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import type { StreakData } from "@/hooks/use-reflections"
import {
  getMilestoneForStreak,
  isMilestoneReached,
  getRandomComfortMessage,
  getPlantTier,
  getPlantTierConfig,
  type PlantTier,
} from "@/lib/streak-milestones"

import { Cat } from "lucide-react"
import { fireConfetti } from "@/lib/confetti"

const tierTextColors: Record<PlantTier, string> = {
  0: "text-muted-foreground",
  1: "text-emerald-600 dark:text-emerald-400",
  2: "text-green-600 dark:text-green-400",
  3: "text-green-700 dark:text-green-300",
  4: "text-emerald-700 dark:text-emerald-300",
  5: "text-amber-600 dark:text-amber-300",
}

const tierSubtextColors: Record<PlantTier, string> = {
  0: "text-muted-foreground/60",
  1: "text-emerald-500/80 dark:text-emerald-400/70",
  2: "text-green-500/80 dark:text-green-400/70",
  3: "text-green-600/80 dark:text-green-300/70",
  4: "text-emerald-600/80 dark:text-emerald-300/70",
  5: "text-amber-500/80 dark:text-amber-300/70",
}

export const GrowthBar = ({ value, max = 100 }: { value: number; max?: number }) => {
  const progress = (value / max) * 100
  const controls = useAnimation()

  useEffect(() => {
    controls.start({
      width: `${progress}%`,
      transition: { duration: 1, ease: "easeOut" },
    })
  }, [controls, progress])

  return (
    <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 h-full rounded-full"
        style={{
          background: "linear-gradient(90deg, #8B6F47, #52B788, #2D6A4F)",
        }}
        initial={{ width: 0 }}
        animate={controls}
      />
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
      <span className="text-emerald-500 text-sm">🌱</span>
      <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {count} day streak
      </motion.span>
    </motion.div>
  )
}

const EMOJI_COUNT = 8

type CelebrationEffect = "petalBurst" | "pollenRain" | "leafBurst" | "natureConfetti" | "glowPulse"

function getRandomCelebrationEffect(): CelebrationEffect {
  const effects: CelebrationEffect[] = ["petalBurst", "pollenRain", "leafBurst", "natureConfetti", "glowPulse"]
  return effects[Math.floor(Math.random() * effects.length)]
}

const PollenRain = ({ onDone }: { onDone: () => void }) => {
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
            ✦
          </motion.span>
        )
      })}
    </div>
  )
}

const LeafBurst = ({ onDone }: { onDone: () => void }) => {
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
            🌿
          </motion.span>
        )
      })}
    </div>
  )
}

const NatureConfetti = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 1800)
    return () => clearTimeout(timer)
  }, [onDone])

  const natureEmojis = ["🌱", "🌿", "🌸", "🌺", "🍃", "🌾", "✨", "💚"]

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 pointer-events-none z-30">
      {Array.from({ length: 16 }, (_, i) => {
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
            {natureEmojis[i % natureEmojis.length]}
          </motion.span>
        )
      })}
    </div>
  )
}

const GrowthGlowPulse = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 1000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      className="absolute inset-0 rounded-full pointer-events-none z-30"
      style={{
        background: "radial-gradient(circle, rgba(82,183,136,0.4) 0%, rgba(45,106,79,0.2) 50%, transparent 70%)",
      }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [0.5, 2, 0.5], opacity: [0, 0.8, 0] }}
      transition={{ duration: 1, ease: "easeOut" }}
    />
  )
}

const PetalBurst = ({ onDone }: { onDone: () => void }) => {
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
            🌸
          </motion.span>
        )
      })}
    </div>
  )
}

const SeedlingPlant = ({ tier = 0, active, className }: { tier?: PlantTier; active: boolean; className?: string }) => {
  const swayControls = useAnimation()
  const leafBounceControls = useAnimation()
  const config = getPlantTierConfig(tier)

  useEffect(() => {
    if (active) {
      swayControls.start({
        rotate: [0, -2, 1.5, -1, 2, -0.5, 0],
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
      })
      leafBounceControls.start({
        scaleY: [1, 1.03, 0.97, 1.02, 1],
        scaleX: [1, 0.98, 1.02, 0.99, 1],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
      })
    } else {
      swayControls.stop()
      swayControls.set({ rotate: 0 })
      leafBounceControls.stop()
      leafBounceControls.set({ scaleY: 1, scaleX: 1 })
    }
  }, [active, swayControls, leafBounceControls])

  const stemColor = active ? config.stemColor : "#a1a1aa"
  const leafColor = active ? config.leafColor : "#d4d4d8"
  const flowerColor = active ? config.flowerColor : "#71717a"
  const fruitColor = active ? config.fruitColor : "#71717a"
  const potColor = active ? config.potColor : "#9c8b7e"
  const soilColor = active ? config.soilColor : "#6b5b4e"
  const outlineColor = active ? "#3d3d3d" : "#52525b"
  const strokeW = 1.8

  const petalPositions = [
    { delay: 0.3, x: -6, y: -8, size: 6, color: config.flowerColor, dur: 2.2 },
    { delay: 1.1, x: 8, y: -12, size: 5, color: config.glowColor, dur: 2.5 },
    { delay: 2.0, x: -4, y: -15, size: 7, color: config.flowerColor, dur: 2.0 },
    { delay: 0.6, x: 10, y: -10, size: 5, color: config.glowColor, dur: 2.3 },
    { delay: 1.5, x: -8, y: -14, size: 6, color: config.flowerColor, dur: 2.1 },
    { delay: 2.8, x: 4, y: -18, size: 6, color: config.glowColor, dur: 2.4 },
    { delay: 0.9, x: -5, y: -12, size: 5, color: config.flowerColor, dur: 2.7 },
    { delay: 1.9, x: 7, y: -15, size: 5, color: config.glowColor, dur: 2.0 },
    { delay: 2.4, x: -7, y: -11, size: 6, color: config.flowerColor, dur: 2.6 },
    { delay: 3.2, x: 5, y: -16, size: 5, color: config.glowColor, dur: 2.2 },
  ]

  const pollenPositions = [
    { delay: 0.7, x: 5, dur: 2.8 },
    { delay: 1.8, x: -7, dur: 2.4 },
    { delay: 2.6, x: 4, dur: 2.6 },
    { delay: 3.1, x: -6, dur: 2.3 },
    { delay: 0.4, x: 8, dur: 2.9 },
    { delay: 1.3, x: -3, dur: 2.5 },
    { delay: 2.2, x: 6, dur: 2.7 },
  ]

  const leafParticlePositions = [
    { delay: 1.4, x: -4, dur: 2.1 },
    { delay: 2.5, x: 6, dur: 2.6 },
    { delay: 3.0, x: -5, dur: 2.3 },
    { delay: 0.8, x: 4, dur: 2.4 },
    { delay: 1.9, x: -6, dur: 2.2 },
  ]

  const lightPositions = [
    { delay: 0.5, x: -5, dur: 2.0 },
    { delay: 1.6, x: 7, dur: 2.3 },
    { delay: 2.7, x: -3, dur: 2.5 },
    { delay: 3.3, x: 5, dur: 2.1 },
  ]

  const hasPetals = active && config.particleTypes.includes("petal")
  const hasPollen = active && config.particleTypes.includes("pollen")
  const hasLeafParticles = active && config.particleTypes.includes("leaf")
  const hasLight = active && config.particleTypes.includes("light")

  const pollenCount = Math.ceil(config.particleCount * 0.35)
  const petalCount = Math.ceil(config.particleCount * 0.3)
  const leafParticleCount = Math.ceil(config.particleCount * 0.2)
  const lightCount = config.particleCount - pollenCount - petalCount - leafParticleCount

  return (
    <div className={`relative ${className}`}>
      {/* Glow effects — Sunlight Through Canopy */}
      {active && config.growthGlow === "glow" && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 8}px`,
              background: `radial-gradient(circle, ${config.glowColor}22 0%, ${config.glowColor}10 50%, transparent 70%)`,
              filter: "blur(8px)",
            }}
            animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.18, 0.38, 0.18] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 3}px`,
              background: `radial-gradient(circle, ${config.leafColor}30 0%, ${config.glowColor}15 60%, transparent 80%)`,
              filter: "blur(3px)",
            }}
            animate={{ scale: [0.94, 1.06, 0.94], opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      {active && config.growthGlow === "radiant" && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 12}px`,
              background: `radial-gradient(circle, ${config.glowColor}28 0%, ${config.glowColor}12 50%, transparent 72%)`,
              filter: "blur(12px)",
            }}
            animate={{ scale: [0.88, 1.14, 0.88], opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 5}px`,
              background: `radial-gradient(circle, ${config.flowerColor}25 0%, ${config.glowColor}14 55%, transparent 78%)`,
              filter: "blur(5px)",
            }}
            animate={{ scale: [0.92, 1.1, 0.92], opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 2}px`,
              background: `radial-gradient(circle, ${config.leafColor}35 0%, ${config.glowColor}20 65%, transparent 85%)`,
              filter: "blur(2px)",
            }}
            animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      {active && config.growthGlow === "bloom" && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 16}px`,
              background: `radial-gradient(circle, ${config.glowColor}35 0%, ${config.glowColor}15 45%, transparent 68%)`,
              filter: "blur(18px)",
            }}
            animate={{ scale: [0.84, 1.2, 0.84], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 7}px`,
              background: `radial-gradient(circle, ${config.flowerColor}35 0%, ${config.glowColor}18 50%, transparent 75%)`,
              filter: "blur(7px)",
            }}
            animate={{ scale: [0.88, 1.15, 0.88], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 2.5}px`,
              background: `radial-gradient(circle, ${config.flowerColor}50 0%, ${config.glowColor}25 60%, transparent 82%)`,
              filter: "blur(2.5px)",
            }}
            animate={{ scale: [0.92, 1.1, 0.92], opacity: [0.4, 0.75, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: config.flowerColor + "45" }}
            animate={{ scale: [0.84, 1.12, 0.84], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      {active && config.growthGlow === "aurora" && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 22}px`,
              background: `radial-gradient(circle, ${config.fruitColor}28 0%, ${config.glowColor}12 38%, transparent 62%)`,
              filter: "blur(26px)",
            }}
            animate={{ scale: [0.8, 1.28, 0.8], opacity: [0.25, 0.6, 0.25] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 13}px`,
              background: `radial-gradient(circle, ${config.fruitColor}40 0%, ${config.glowColor}20 45%, transparent 70%)`,
              filter: "blur(14px)",
            }}
            animate={{ scale: [0.84, 1.22, 0.84], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 5}px`,
              background: `radial-gradient(circle, ${config.fruitColor}45 0%, ${config.flowerColor}22 50%, transparent 75%)`,
              filter: "blur(5px)",
            }}
            animate={{ scale: [0.9, 1.14, 0.9], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 8}px`,
              background: `radial-gradient(circle, ${config.fruitColor}35 0%, ${config.glowColor}15 55%, transparent 78%)`,
              filter: "blur(8px)",
            }}
            animate={{ scale: [0.88, 1.16, 0.88], opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: `-${5 * config.glowScale * 2.5}px`,
              background: `radial-gradient(circle, ${config.fruitColor}55 0%, ${config.flowerColor}30 60%, transparent 82%)`,
              filter: "blur(3px)",
            }}
            animate={{ scale: [0.93, 1.1, 0.93], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `conic-gradient(from 0deg, ${config.fruitColor}18, ${config.glowColor}10, ${config.flowerColor}12, ${config.stemColor}10, ${config.fruitColor}18)`,
              mixBlendMode: "soft-light",
            }}
            animate={{ rotate: [0, 360], opacity: [0.12, 0.32, 0.12] }}
            transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
          />
        </>
      )}

      {!active && config.growthGlow !== "none" && (
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: `-${5 * config.glowScale * 6}px`,
            background: `radial-gradient(circle, ${"#a1a1aa"}15 0%, transparent 65%)`,
            filter: "blur(6px)",
          }}
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Plant SVG */}
      <motion.div
        className="absolute inset-0"
        animate={swayControls}
        style={{ originX: "50%", originY: "100%" }}
      >
        <motion.div
          className="w-full h-full"
          animate={leafBounceControls}
          style={{ originX: "50%", originY: "100%" }}
        >
          <svg viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Pot */}
            <g>
              <path
                d="M9 44 C9 50 13 51.5 20 51.5 C27 51.5 31 50 31 44 Z"
                fill={potColor}
                stroke={outlineColor}
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />
              <path
                d="M7 44 L33 44 L31 41 L9 41 Z"
                fill={potColor}
                stroke={outlineColor}
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />
              {/* Soil */}
              <path
                d="M10 44 C10 43 14 42 20 42.5 C26 42 30 43 30 44"
                fill={soilColor}
                stroke={outlineColor}
                strokeWidth={1.2}
                strokeLinejoin="round"
              />
              {/* Soil texture dots */}
              {active && (
                <>
                  <circle cx="14" cy="43.5" r="0.8" fill={outlineColor} opacity={0.3} />
                  <circle cx="18" cy="43" r="0.6" fill={outlineColor} opacity={0.25} />
                  <circle cx="24" cy="43.5" r="0.7" fill={outlineColor} opacity={0.3} />
                  <circle cx="27" cy="44" r="0.5" fill={outlineColor} opacity={0.2} />
                </>
              )}
            </g>

            {/* Tier 0: Dormant — seed in soil */}
            {tier === 0 && (
              <g>
                <ellipse cx="20" cy="42" rx="2.5" ry="1.8" fill={stemColor} stroke={outlineColor} strokeWidth="1" />
                <line x1="20" y1="42" x2="20" y2="41" stroke={outlineColor} strokeWidth="0.8" strokeLinecap="round" />
              </g>
            )}

            {/* Tier 1: Sprout */}
            {tier >= 1 && (
              <g opacity={tier >= 1 ? 1 : 0}>
                {/* Stem */}
                <path
                  d="M20 42 Q19 40 20.5 37 Q21 35 20 33"
                  stroke={stemColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Leaves */}
                <path
                  d="M20 36 Q16 34 16.5 32 Q18 33 20 36"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 36 Q24 34 23.5 32 Q22 33 20 36"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </g>
            )}

            {/* Tier 2: Seedling */}
            {tier >= 2 && (
              <g opacity={tier >= 2 ? 1 : 0}>
                {/* Main stem */}
                <path
                  d="M20 42 L20 30"
                  stroke={stemColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Left leaf */}
                <path
                  d="M20 36 Q14 33 15 30 Q17 32 20 36"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Right leaf */}
                <path
                  d="M20 36 Q26 33 25 30 Q23 32 20 36"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Top tiny leaf */}
                <path
                  d="M20 31 Q17 28 18 26 Q19 28 20 31"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </g>
            )}

            {/* Tier 3: Growing */}
            {tier >= 3 && (
              <g opacity={tier >= 3 ? 1 : 0}>
                {/* Main stem */}
                <path
                  d="M20 42 Q21 36 19.5 30 Q19 26 20 22"
                  stroke={stemColor}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Bottom leaves */}
                <path
                  d="M20.5 38 Q14 35 15 32 Q17 34 20.5 38"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M20.5 38 Q27 35 26 32 Q24 34 20.5 38"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Middle leaves */}
                <path
                  d="M19.5 30 Q13 27 14 24 Q16 26 19.5 30"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M19.5 30 Q26 27 25 24 Q23 26 19.5 30"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Bud */}
                <ellipse cx="20" cy="21" rx="2.5" ry="3" fill={flowerColor} stroke={outlineColor} strokeWidth="1.2" />
                <ellipse cx="20" cy="21" rx="1.2" ry="1.8" fill={config.glowColor} opacity={0.5} />
              </g>
            )}

            {/* Tier 4: Blooming */}
            {tier >= 4 && (
              <g opacity={tier >= 4 ? 1 : 0}>
                {/* Stem */}
                <path
                  d="M20 42 Q21.5 36 20 30 Q19 26 20 20"
                  stroke={stemColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Bottom leaves */}
                <path
                  d="M20.5 38 Q13 35 14 31 Q17 33 20.5 38"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M20.5 38 Q28 35 27 31 Q24 33 20.5 38"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Middle leaves */}
                <path
                  d="M20 30 Q12 27 13 23 Q16 25 20 30"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 30 Q28 27 27 23 Q24 25 20 30"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Upper leaves */}
                <path
                  d="M20 24 Q14 22 15 19 Q17 21 20 24"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 24 Q26 22 25 19 Q23 21 20 24"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Flower */}
                <g transform="translate(20, 17)">
                  {/* Petals */}
                  <path d="M0 -6 C-3 -10 -3 -4 0 -2 C3 -4 3 -10 0 -6" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                  <path d="M-6 0 C-10 -3 -4 -3 -2 0 C-4 3 -10 3 -6 0" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                  <path d="M6 0 C10 -3 4 -3 2 0 C4 3 10 3 6 0" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                  <path d="M0 6 C-3 10 -3 4 0 2 C3 4 3 10 0 6" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                  {/* Flower center */}
                  <circle cx="0" cy="0" r="1.5" fill={config.glowColor} stroke={outlineColor} strokeWidth="0.8" />
                </g>
              </g>
            )}

            {/* Tier 5: Fruitful */}
            {tier >= 5 && (
              <g opacity={tier >= 5 ? 1 : 0}>
                {/* Stem */}
                <path
                  d="M20 42 Q22 35 20 28 Q19 24 20 18"
                  stroke={stemColor}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Bottom leaves */}
                <path
                  d="M21 38 Q13 34 14 30 Q17 33 21 38"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 38 Q29 34 28 30 Q25 33 21 38"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Middle leaves */}
                <path
                  d="M20 28 Q11 25 12 21 Q15 23 20 28"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 28 Q29 25 28 21 Q25 23 20 28"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Upper leaves */}
                <path
                  d="M20 22 Q14 19 15 16 Q17 18 20 22"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 22 Q26 19 25 16 Q23 18 20 22"
                  fill={leafColor}
                  stroke={outlineColor}
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Flower */}
                <g transform="translate(20, 15)">
                  <path d="M0 -5 C-2.5 -8 -2.5 -3 0 -1.5 C2.5 -3 2.5 -8 0 -5" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                  <path d="M-5 0 C-8 -2.5 -3 -2.5 -1.5 0 C-3 2.5 -8 2.5 -5 0" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                  <path d="M5 0 C8 -2.5 3 -2.5 1.5 0 C3 2.5 8 2.5 5 0" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                  <path d="M0 5 C-2.5 8 -2.5 3 0 1.5 C2.5 3 2.5 8 0 5" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                  <circle cx="0" cy="0" r="1.5" fill={config.glowColor} stroke={outlineColor} strokeWidth="0.8" />
                </g>
                {/* Fruit */}
                <g transform="translate(15, 33)">
                  <circle cx="0" cy="0" r="3.5" fill={fruitColor} stroke={outlineColor} strokeWidth="1.2" />
                  <path d="M0 -3.5 Q1 -4 2 -3.5" stroke={outlineColor} strokeWidth="0.8" fill="none" />
                  {/* Shine */}
                  <circle cx="-1" cy="-1" r="1" fill="white" opacity={0.4} />
                </g>
                {/* Second fruit */}
                <g transform="translate(26, 26)">
                  <circle cx="0" cy="0" r="2.8" fill={fruitColor} stroke={outlineColor} strokeWidth="1" />
                  <path d="M0 -2.8 Q0.8 -3.2 1.5 -2.8" stroke={outlineColor} strokeWidth="0.8" fill="none" />
                  <circle cx="-0.8" cy="-0.8" r="0.8" fill="white" opacity={0.35} />
                </g>
              </g>
            )}
          </svg>
        </motion.div>
      </motion.div>

      {/* Floating particles — organic drift */}
      {active && config.particleCount > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {/* Pollen motes — gentle warm air arcs */}
          {hasPollen && pollenPositions.slice(0, pollenCount).map((p, i) => (
            <motion.circle
              key={`pollen-${i}`}
              className="absolute left-1/2 top-0"
              style={{ width: 4, height: 4, marginLeft: -2 }}
              initial={{ x: p.x, y: 0, opacity: 0 }}
              animate={{
                x: [p.x, p.x + 4, p.x - 3, p.x + 5, p.x - 2],
                y: [0, -7, -14, -22, -30],
                opacity: [0, 0.5, 0.8, 0.3, 0],
                scale: [0, 0.8, 1.2, 0.6, 0],
              }}
              transition={{ duration: p.dur + 0.6, repeat: Infinity, delay: p.delay, ease: "easeOut" }}
              fill={config.glowColor}
            />
          ))}

          {/* Petals — lazy wobble and spin on a breeze */}
          {hasPetals && petalPositions.slice(0, petalCount).map((p, i) => (
            <motion.svg
              key={`petal-${i}`}
              viewBox="0 0 8 10"
              className="absolute left-1/2 top-0"
              style={{ width: p.size, height: p.size * 1.2, marginLeft: -p.size / 2 }}
              initial={{ x: p.x, y: 0, opacity: 0, scale: 0, rotate: 0 }}
              animate={{
                x: [p.x, p.x + 3, p.x - 4, p.x + 5, p.x - 2, p.x + 1],
                y: [0, -4, -10, -18, -26, -34],
                opacity: [0, 0.7, 1, 0.6, 0.3, 0],
                scale: [0, 0.8, 1.1, 0.9, 0.5, 0],
                rotate: [0, 20, -10, 45, -20, 60],
              }}
              transition={{ duration: p.dur + 0.8, repeat: Infinity, delay: p.delay, ease: "easeOut" }}
            >
              <path
                d="M4 0C4 0 1 3 1 6C1 8 4 10 4 10C4 10 7 8 7 6C7 3 4 0 4 0Z"
                fill={p.color}
                stroke={outlineColor}
                strokeWidth="0.6"
              />
            </motion.svg>
          ))}

          {/* Leaf particles — erratic flutter */}
          {hasLeafParticles && leafParticlePositions.slice(0, leafParticleCount).map((s, i) => (
            <motion.svg
              key={`leaf-particle-${i}`}
              viewBox="0 0 8 6"
              className="absolute left-1/2 top-0"
              style={{ width: 6, height: 5, marginLeft: -3 }}
              initial={{ x: s.x, y: 0, opacity: 0, scale: 0, rotate: 0 }}
              animate={{
                x: [s.x, s.x - 4, s.x + 6, s.x - 3, s.x + 5, s.x - 2],
                y: [0, -6, -12, -18, -26, -34],
                opacity: [0, 0.5, 0.9, 0.6, 0.3, 0],
                scale: [0, 0.7, 1.2, 0.8, 0.4, 0],
                rotate: [0, -40, 50, -30, 60, -20],
              }}
              transition={{ duration: s.dur + 0.8, repeat: Infinity, delay: s.delay, ease: "easeOut" }}
            >
              <path
                d="M0 3Q2 0 4 1Q6 2 8 3Q6 4 4 5Q2 6 0 3Z"
                fill={config.leafColor}
                stroke={outlineColor}
                strokeWidth="0.5"
              />
            </motion.svg>
          ))}

          {/* Light motes — firefly twinkle */}
          {hasLight && lightPositions.slice(0, lightCount).map((d, i) => (
            <motion.circle
              key={`light-${i}`}
              className="absolute left-1/2 top-0"
              style={{ width: 5, height: 5, marginLeft: -2.5 }}
              initial={{ x: d.x, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: [d.x, d.x + 3, d.x - 2, d.x + 4, d.x - 1, d.x + 2],
                y: [0, -4, -8, -14, -20, -26],
                opacity: [0, 0.3, 0.7, 0.2, 0.5, 0],
                scale: [0, 0.4, 1, 0.3, 0.6, 0],
              }}
              transition={{ duration: d.dur + 0.6, repeat: Infinity, delay: d.delay, ease: "easeOut" }}
              fill={config.fruitColor}
              filter="url(#glow)"
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const StreakIcon = ({ streakData, showMilestoneToast = true }: { streakData: StreakData; showMilestoneToast?: boolean }) => {
  const { currentStreak, oldStreak, hasCurrentStreak } = streakData
  const displayStreak = hasCurrentStreak ? currentStreak : oldStreak > 0 ? oldStreak : 0
  const tier = getPlantTier(displayStreak);
  const prevStreakRef = useRef(0)
  const [celebrating, setCelebrating] = useState(false)
  const [celebrationEffect, setCelebrationEffect] = useState<CelebrationEffect>("petalBurst")
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
          {celebrating && celebrationEffect === "petalBurst" && <PetalBurst onDone={handleCelebrationDone} />}
          {celebrating && celebrationEffect === "pollenRain" && <PollenRain onDone={handleCelebrationDone} />}
          {celebrating && celebrationEffect === "leafBurst" && <LeafBurst onDone={handleCelebrationDone} />}
          {celebrating && celebrationEffect === "natureConfetti" && <NatureConfetti onDone={handleCelebrationDone} />}
          {celebrating && celebrationEffect === "glowPulse" && <GrowthGlowPulse onDone={handleCelebrationDone} />}
        </AnimatePresence>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: celebrating ? [1, 1.3, 1] : 1, opacity: 1 }}
          transition={{ duration: celebrating ? 0.6 : 0.3 }}
          className="flex items-center gap-2 relative z-20"
        >
          <SeedlingPlant
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
