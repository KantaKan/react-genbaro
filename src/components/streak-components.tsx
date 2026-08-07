"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { motion, useAnimation, AnimatePresence, useReducedMotion } from "framer-motion"
import type { StreakData } from "@/hooks/use-reflections"
import {
  getMilestoneForStreak,
  isMilestoneReached,
  getRandomComfortMessage,
  getPlantTier,
  getPlantTierConfig,
  getFlourishTier,
  flourishAccentColors,
  type PlantTier,
} from "@/lib/streak-milestones"

import { Cat } from "lucide-react"
import { fireConfetti } from "@/lib/confetti"
import { getPotPath, getStemTilt, type PlantVariantConfig } from "@/lib/plant-variants"

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

const growthBarGradients = {
  streak: "linear-gradient(90deg, #8B6F47, #52B788, #2D6A4F)",
  growth: "linear-gradient(90deg, #F59E0B, #FBBF24, #FDE68A)",
}

export const GrowthBar = ({ value, max = 100, variant = "streak" }: { value: number; max?: number; variant?: "streak" | "growth" }) => {
  const progress = max > 0 ? (value / max) * 100 : 0
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
          background: growthBarGradients[variant],
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

const AuraGlow = ({
  sizePct,
  color,
  blurPx,
  opacity,
  duration,
  topPct = 38,
}: {
  sizePct: number
  color: string
  blurPx: number
  opacity: number
  duration: number
  topPct?: number
}) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: `${sizePct}%`,
      height: `${sizePct}%`,
      top: `${topPct}%`,
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: `radial-gradient(circle, ${color}45 0%, ${color}18 50%, transparent 72%)`,
      filter: `blur(${blurPx}px)`,
      mixBlendMode: "screen",
    }}
    animate={{ scale: [0.92, 1.08, 0.92], opacity: [opacity * 0.6, opacity, opacity * 0.6] }}
    transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
  />
)

export const SeedlingPlant = ({ tier = 0, active, className, variant, showParticles = true, growthPoints = 0 }: { tier?: PlantTier; active: boolean; className?: string; variant?: PlantVariantConfig; showParticles?: boolean; growthPoints?: number }) => {
  const swayControls = useAnimation()
  const leafBounceControls = useAnimation()
  const prefersReducedMotion = useReducedMotion()
  const config = getPlantTierConfig(tier)
  const potPaths = variant ? getPotPath(variant.pot) : null
  const stemTilt = variant ? getStemTilt(variant.stem) : 0
  const flourishTier = getFlourishTier(growthPoints)
  const flourishColor = flourishAccentColors[flourishTier]

  useEffect(() => {
    if (active && !prefersReducedMotion) {
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
  }, [active, prefersReducedMotion, swayControls, leafBounceControls])

  const stemColor = active ? (variant?.palette.stem ?? config.stemColor) : "#a1a1aa"
  const leafColor = active ? (variant?.palette.leaf ?? config.leafColor) : "#d4d4d8"
  const flowerColor = active ? (variant?.palette.flower ?? config.flowerColor) : "#71717a"
  const fruitColor = active ? (variant?.palette.fruit ?? config.fruitColor) : "#71717a"
  const potColor = active ? (variant?.palette.pot ?? config.potColor) : "#9c8b7e"
  const soilColor = active ? (variant?.palette.soil ?? config.soilColor) : "#6b5b4e"
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
      {/* Glow effects — one clean light source per tier instead of stacked multi-hue smudges */}
      {active && !prefersReducedMotion && config.growthGlow === "glow" && (
        <>
          <AuraGlow sizePct={80 * config.glowScale} color={config.glowColor} blurPx={8} opacity={0.3} duration={4.5} />
          <AuraGlow sizePct={40 * config.glowScale} color={config.glowColor} blurPx={3} opacity={0.4} duration={3} />
        </>
      )}

      {active && !prefersReducedMotion && config.growthGlow === "radiant" && (
        <>
          <AuraGlow sizePct={100 * config.glowScale} color={config.glowColor} blurPx={11} opacity={0.35} duration={4} />
          <AuraGlow sizePct={50 * config.glowScale} color={config.glowColor} blurPx={4} opacity={0.5} duration={2.6} />
        </>
      )}

      {active && !prefersReducedMotion && config.growthGlow === "bloom" && (
        <>
          <AuraGlow sizePct={130 * config.glowScale} color={config.glowColor} blurPx={16} opacity={0.4} duration={3.5} />
          <AuraGlow sizePct={60 * config.glowScale} color={config.flowerColor} blurPx={6} opacity={0.55} duration={2.2} />
        </>
      )}

      {active && !prefersReducedMotion && config.growthGlow === "aurora" && (
        <>
          <AuraGlow sizePct={170 * config.glowScale} color={config.glowColor} blurPx={22} opacity={0.45} duration={5} />
          <AuraGlow sizePct={75 * config.glowScale} color={config.flowerColor} blurPx={7} opacity={0.6} duration={2.4} />
          {/* Signature high-tier accent: a single slow-rotating ring, not another stacked blur */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "115%",
              height: "115%",
              top: "38%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              border: `1px solid ${config.fruitColor}55`,
              mixBlendMode: "screen",
            }}
            animate={{ rotate: [0, 360], opacity: [0.25, 0.55, 0.25] }}
            transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
          />
        </>
      )}

      {!active && !prefersReducedMotion && config.growthGlow !== "none" && (
        <AuraGlow sizePct={60 * config.glowScale} color="#a1a1aa" blurPx={6} opacity={0.1} duration={4} />
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
                d={potPaths?.bottom ?? "M9 44 C9 50 13 51.5 20 51.5 C27 51.5 31 50 31 44 Z"}
                fill={potColor}
                stroke={outlineColor}
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />
              <path
                d={potPaths?.rim ?? "M7 44 L33 44 L31 41 L9 41 Z"}
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
              {/* Growth-points flourish: pot-rim accent (bronze/silver/gold) */}
              {active && flourishTier > 0 && (
                <path
                  d={potPaths?.rim ?? "M7 44 L33 44 L31 41 L9 41 Z"}
                  fill="none"
                  stroke={flourishColor}
                  strokeWidth={1.2}
                  strokeLinejoin="round"
                  opacity={0.85}
                />
              )}
            </g>

            {/* Plant, tilted per-user via variant.stem */}
            <g transform={`rotate(${stemTilt} 20 44)`}>
              {/* Tier 0: Dormant — plump seed in soil */}
              {tier === 0 && (
                <g>
                  <ellipse cx="20" cy="42" rx="3" ry="2.2" fill={stemColor} stroke={outlineColor} strokeWidth="1" />
                  <line x1="20" y1="42" x2="20" y2="40.5" stroke={outlineColor} strokeWidth="0.8" strokeLinecap="round" />
                </g>
              )}

              {/* Tier 1: single curled sprout */}
              {tier >= 1 && (
                <g opacity={tier >= 1 ? 1 : 0}>
                  <path
                    d="M20 42 C18.5 39 18 36.5 20 34 C21 32.7 21.3 32 20.5 31"
                    stroke={stemColor}
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <ellipse cx="18.5" cy="31.5" rx="3.4" ry="2.2" fill={leafColor} stroke={outlineColor} strokeWidth="1.4" transform="rotate(-35 18.5 31.5)" />
                </g>
              )}

              {/* Tier 2: twin round leaf pair + tiny topknot */}
              {tier >= 2 && (
                <g opacity={tier >= 2 ? 1 : 0}>
                  <path d="M20 42 L20 29" stroke={stemColor} strokeWidth="3" strokeLinecap="round" />
                  <ellipse cx="15" cy="33" rx="3.6" ry="2.4" fill={leafColor} stroke={outlineColor} strokeWidth="1.4" transform="rotate(-30 15 33)" />
                  <ellipse cx="25" cy="33" rx="3.6" ry="2.4" fill={leafColor} stroke={outlineColor} strokeWidth="1.4" transform="rotate(30 25 33)" />
                  <circle cx="20" cy="28" r="2" fill={leafColor} stroke={outlineColor} strokeWidth="1.2" />
                </g>
              )}

              {/* Tier 3: fuller canopy + closed bud */}
              {tier >= 3 && (
                <g opacity={tier >= 3 ? 1 : 0}>
                  <path d="M20 42 Q21 36 19.5 30 Q19 26 20 22" stroke={stemColor} strokeWidth="3.2" strokeLinecap="round" fill="none" />
                  <ellipse cx="14.5" cy="35" rx="4" ry="2.6" fill={leafColor} stroke={outlineColor} strokeWidth="1.4" transform="rotate(-30 14.5 35)" />
                  <ellipse cx="25.5" cy="35" rx="4" ry="2.6" fill={leafColor} stroke={outlineColor} strokeWidth="1.4" transform="rotate(30 25.5 35)" />
                  <ellipse cx="13" cy="27" rx="3.6" ry="2.4" fill={leafColor} stroke={outlineColor} strokeWidth="1.4" transform="rotate(-35 13 27)" />
                  <ellipse cx="27" cy="27" rx="3.6" ry="2.4" fill={leafColor} stroke={outlineColor} strokeWidth="1.4" transform="rotate(35 27 27)" />
                  {/* Closed bud — same overlapping-petal motif as the tier 4/5 bloom, drawn tight and unopened */}
                  <ellipse cx="17.6" cy="23.5" rx="2.2" ry="1.6" fill={leafColor} stroke={outlineColor} strokeWidth="1.2" transform="rotate(-30 17.6 23.5)" />
                  <ellipse cx="22.4" cy="23.5" rx="2.2" ry="1.6" fill={leafColor} stroke={outlineColor} strokeWidth="1.2" transform="rotate(30 22.4 23.5)" />
                  <g transform="translate(20, 20)">
                    <circle cx="0" cy="-1.5" r="2.2" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                    <circle cx="-1.8" cy="1" r="2.2" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                    <circle cx="1.8" cy="1" r="2.2" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                    <ellipse cx="-0.7" cy="-2" rx="0.7" ry="0.9" fill="white" opacity={0.4} />
                  </g>
                </g>
              )}

              {/* Tier 4: open chunky bloom + denser canopy */}
              {tier >= 4 && (
                <g opacity={tier >= 4 ? 1 : 0}>
                  <path d="M20 42 Q21.5 36 20 30 Q19 26 20 19" stroke={stemColor} strokeWidth="3.4" strokeLinecap="round" fill="none" />
                  <ellipse cx="13.5" cy="37" rx="4.2" ry="2.7" fill={leafColor} stroke={outlineColor} strokeWidth="1.5" transform="rotate(-32 13.5 37)" />
                  <ellipse cx="26.5" cy="37" rx="4.2" ry="2.7" fill={leafColor} stroke={outlineColor} strokeWidth="1.5" transform="rotate(32 26.5 37)" />
                  <ellipse cx="12.5" cy="29" rx="3.8" ry="2.5" fill={leafColor} stroke={outlineColor} strokeWidth="1.5" transform="rotate(-38 12.5 29)" />
                  <ellipse cx="27.5" cy="29" rx="3.8" ry="2.5" fill={leafColor} stroke={outlineColor} strokeWidth="1.5" transform="rotate(38 27.5 29)" />
                  <ellipse cx="14.5" cy="23" rx="3.2" ry="2.1" fill={leafColor} stroke={outlineColor} strokeWidth="1.4" transform="rotate(-40 14.5 23)" />
                  <ellipse cx="25.5" cy="23" rx="3.2" ry="2.1" fill={leafColor} stroke={outlineColor} strokeWidth="1.4" transform="rotate(40 25.5 23)" />
                  {/* Chunky open bloom: 5-petal circle cluster */}
                  <g transform="translate(20, 16)">
                    {[0, 72, 144, 216, 288].map((angle) => {
                      const rad = (angle * Math.PI) / 180
                      const px = Math.cos(rad) * 3.4
                      const py = Math.sin(rad) * 3.4
                      return <circle key={angle} cx={px} cy={py} r="2.6" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                    })}
                    <circle cx="0" cy="0" r="2" fill={config.glowColor} stroke={outlineColor} strokeWidth="0.8" />
                  </g>
                </g>
              )}

              {/* Tier 5: bloom + two plump fruits + sparkle crown */}
              {tier >= 5 && (
                <g opacity={tier >= 5 ? 1 : 0}>
                  <path d="M20 42 Q22 35 20 28 Q19 24 20 17" stroke={stemColor} strokeWidth="3.6" strokeLinecap="round" fill="none" />
                  <ellipse cx="13" cy="37" rx="4.4" ry="2.8" fill={leafColor} stroke={outlineColor} strokeWidth="1.5" transform="rotate(-32 13 37)" />
                  <ellipse cx="27" cy="37" rx="4.4" ry="2.8" fill={leafColor} stroke={outlineColor} strokeWidth="1.5" transform="rotate(32 27 37)" />
                  <ellipse cx="11.5" cy="28" rx="4" ry="2.6" fill={leafColor} stroke={outlineColor} strokeWidth="1.5" transform="rotate(-38 11.5 28)" />
                  <ellipse cx="28.5" cy="28" rx="4" ry="2.6" fill={leafColor} stroke={outlineColor} strokeWidth="1.5" transform="rotate(38 28.5 28)" />
                  <ellipse cx="14" cy="22" rx="3.4" ry="2.2" fill={leafColor} stroke={outlineColor} strokeWidth="1.4" transform="rotate(-40 14 22)" />
                  <ellipse cx="26" cy="22" rx="3.4" ry="2.2" fill={leafColor} stroke={outlineColor} strokeWidth="1.4" transform="rotate(40 26 22)" />
                  {/* Bloom */}
                  <g transform="translate(20, 14)">
                    {[0, 72, 144, 216, 288].map((angle) => {
                      const rad = (angle * Math.PI) / 180
                      const px = Math.cos(rad) * 3.6
                      const py = Math.sin(rad) * 3.6
                      return <circle key={angle} cx={px} cy={py} r="2.8" fill={flowerColor} stroke={outlineColor} strokeWidth="1" />
                    })}
                    <circle cx="0" cy="0" r="2.2" fill={config.glowColor} stroke={outlineColor} strokeWidth="0.8" />
                  </g>
                  {/* Sparkle crown — floats clear above the bloom instead of cutting through it */}
                  <path
                    d="M20 1.7 L20.7 3.8 L22.8 4.5 L20.7 5.2 L20 7.3 L19.3 5.2 L17.2 4.5 L19.3 3.8 Z"
                    fill={config.glowColor}
                    stroke={outlineColor}
                    strokeWidth="0.6"
                    opacity={0.95}
                  />
                  <circle cx="25" cy="6.5" r="0.9" fill={config.glowColor} opacity={0.8} />
                  <circle cx="15" cy="7.5" r="0.6" fill={config.glowColor} opacity={0.7} />
                  {/* Fruit — plump, with a small leafy calyx instead of a bare line */}
                  <g transform="translate(14.5, 33)">
                    <circle cx="0" cy="0" r="3.8" fill={fruitColor} stroke={outlineColor} strokeWidth="1.3" />
                    <ellipse cx="0.3" cy="-3.6" rx="1.1" ry="0.7" fill={leafColor} stroke={outlineColor} strokeWidth="0.7" transform="rotate(20 0.3 -3.6)" />
                    <circle cx="-1.1" cy="-1.1" r="1.1" fill="white" opacity={0.4} />
                  </g>
                  <g transform="translate(26.5, 26)">
                    <circle cx="0" cy="0" r="3" fill={fruitColor} stroke={outlineColor} strokeWidth="1.1" />
                    <ellipse cx="0.25" cy="-2.8" rx="0.9" ry="0.6" fill={leafColor} stroke={outlineColor} strokeWidth="0.6" transform="rotate(20 0.25 -2.8)" />
                    <circle cx="-0.9" cy="-0.9" r="0.9" fill="white" opacity={0.35} />
                  </g>
                </g>
              )}
            </g>
          </svg>
        </motion.div>
      </motion.div>

      {/* Floating particles — organic drift */}
      {active && showParticles && !prefersReducedMotion && config.particleCount > 0 && (
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

export const StreakIcon = ({ streakData, showMilestoneToast = true, variant, growthPoints = 0 }: { streakData: StreakData; showMilestoneToast?: boolean; variant?: PlantVariantConfig; growthPoints?: number }) => {
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
            variant={variant}
            growthPoints={growthPoints}
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
