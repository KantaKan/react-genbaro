"use client"

import { useRef, useEffect, useState, useCallback, type ReactNode } from "react"
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
  getEffectivePlantDays,
  type PlantTier,
} from "@/lib/streak-milestones"

import { Cat } from "lucide-react"
import { fireConfetti } from "@/lib/confetti"
import {
  getPotPath,
  getStemTilt,
  isSpecialPotStyle,
  getSpecialPotColor,
  type PlantVariantConfig,
  type PlantSpecies,
  type SpecialPotStyle,
} from "@/lib/plant-variants"

const tierTextColors: Record<PlantTier, string> = {
  0: "text-muted-foreground",
  1: "text-emerald-500 dark:text-emerald-400",
  2: "text-emerald-600 dark:text-emerald-400",
  3: "text-green-600 dark:text-green-400",
  4: "text-green-600 dark:text-green-300",
  5: "text-green-700 dark:text-green-300",
  6: "text-emerald-700 dark:text-emerald-300",
  7: "text-pink-600 dark:text-pink-300",
  8: "text-amber-600 dark:text-amber-300",
  9: "text-amber-500 dark:text-amber-200",
}

const tierSubtextColors: Record<PlantTier, string> = {
  0: "text-muted-foreground/60",
  1: "text-emerald-500/80 dark:text-emerald-400/70",
  2: "text-emerald-500/80 dark:text-emerald-400/70",
  3: "text-green-500/80 dark:text-green-400/70",
  4: "text-green-600/80 dark:text-green-400/70",
  5: "text-green-600/80 dark:text-green-300/70",
  6: "text-emerald-600/80 dark:text-emerald-300/70",
  7: "text-pink-500/80 dark:text-pink-300/70",
  8: "text-amber-500/80 dark:text-amber-300/70",
  9: "text-amber-500/80 dark:text-amber-200/70",
}

/* ─── Procedural plant canopy ───
   Each species gets its own growth topology (not a recolor of the same
   shape): flower grows leaf pairs up a stem to a bloom, tree grows a trunk
   into a leafy crown, cactus stacks spined paddle segments, succulent
   radiates a rosette. Shapes are generated from `tier` by formula so all 10
   tiers fall out of one function instead of ten hand-drawn blocks. */

interface LeafSpec {
  x: number
  y: number
  rx: number
  ry: number
  rot: number
}

function canopyTop(tier: PlantTier): number {
  return Math.max(15, 42 - tier * 2.9)
}

function leafFan(tier: PlantTier): LeafSpec[] {
  const pairs = Math.min(tier, 5)
  const top = canopyTop(tier)
  const leaves: LeafSpec[] = []
  for (let i = 0; i < pairs; i++) {
    const t = pairs === 1 ? 0.5 : i / (pairs - 1)
    const y = 39 - t * (39 - (top + 5))
    const spread = 4 + t * 2.4
    const size = 3.6 + t * 0.9
    const angle = 28 + t * 14
    leaves.push({ x: 20 - spread, y, rx: size, ry: size * 0.62, rot: -angle })
    leaves.push({ x: 20 + spread, y, rx: size, ry: size * 0.62, rot: angle })
  }
  return leaves
}

const StemPath = ({ tier, color, width }: { tier: PlantTier; color: string; width: number }) => {
  if (tier === 0) return null
  const top = canopyTop(tier)
  return (
    <path
      d={`M20 42 Q21.2 ${((42 + top) / 2).toFixed(1)} 20 ${top}`}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      fill="none"
    />
  )
}

const LeafGroup = ({ leaves, color, outline }: { leaves: LeafSpec[]; color: string; outline: string }) => (
  <>
    {leaves.map((l, i) => (
      <ellipse
        key={i}
        cx={l.x}
        cy={l.y}
        rx={l.rx}
        ry={l.ry}
        fill={color}
        stroke={outline}
        strokeWidth={1.4}
        transform={`rotate(${l.rot} ${l.x} ${l.y})`}
      />
    ))}
  </>
)

const BloomCluster = ({
  x,
  y,
  color,
  glow,
  outline,
  scale = 1,
}: {
  x: number
  y: number
  color: string
  glow: string
  outline: string
  scale?: number
}) => (
  <g transform={`translate(${x}, ${y})`}>
    {[0, 72, 144, 216, 288].map((angle) => {
      const rad = (angle * Math.PI) / 180
      const px = Math.cos(rad) * 3.2 * scale
      const py = Math.sin(rad) * 3.2 * scale
      return <circle key={angle} cx={px} cy={py} r={2.4 * scale} fill={color} stroke={outline} strokeWidth="1" />
    })}
    <circle cx="0" cy="0" r={1.8 * scale} fill={glow} stroke={outline} strokeWidth="0.8" />
  </g>
)

const FruitDot = ({
  x,
  y,
  color,
  leafColor,
  outline,
  r = 3.4,
}: {
  x: number
  y: number
  color: string
  leafColor: string
  outline: string
  r?: number
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle cx="0" cy="0" r={r} fill={color} stroke={outline} strokeWidth="1.2" />
    <ellipse
      cx={r * 0.08}
      cy={-r * 0.9}
      rx={r * 0.28}
      ry={r * 0.18}
      fill={leafColor}
      stroke={outline}
      strokeWidth="0.6"
      transform={`rotate(20 ${(r * 0.08).toFixed(2)} ${(-r * 0.9).toFixed(2)})`}
    />
    <circle cx={-r * 0.3} cy={-r * 0.3} r={r * 0.28} fill="white" opacity={0.4} />
  </g>
)

interface CanopyColors {
  stem: string
  leaf: string
  flower: string
  fruit: string
  glow: string
  outline: string
}

const FlowerCanopy = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const leaves = leafFan(tier)
  const top = canopyTop(tier)
  const lowLeaf = leaves[0]
  const highLeaf = leaves[leaves.length - 1]
  return (
    <>
      <StemPath tier={tier} color={colors.stem} width={3} />
      <LeafGroup leaves={leaves} color={colors.leaf} outline={colors.outline} />
      {hasFlower && <BloomCluster x={20} y={top - 2} color={colors.flower} glow={colors.glow} outline={colors.outline} />}
      {hasFruit && lowLeaf && <FruitDot x={lowLeaf.x} y={lowLeaf.y + 3} color={colors.fruit} leafColor={colors.leaf} outline={colors.outline} r={3.6} />}
      {hasFruit && highLeaf && leaves.length > 2 && (
        <FruitDot x={highLeaf.x} y={highLeaf.y + 3} color={colors.fruit} leafColor={colors.leaf} outline={colors.outline} r={2.8} />
      )}
    </>
  )
}

const TreeCanopy = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const top = canopyTop(tier)
  const crownR = 4 + tier * 0.9
  const blobs = [
    { x: 20, y: top, r: crownR },
    { x: 20 - crownR * 0.65, y: top + crownR * 0.35, r: crownR * 0.75 },
    { x: 20 + crownR * 0.65, y: top + crownR * 0.35, r: crownR * 0.75 },
  ]
  const accents = [
    { x: -crownR * 0.3, y: -crownR * 0.2 },
    { x: crownR * 0.35, y: crownR * 0.1 },
    { x: 0, y: crownR * 0.45 },
    { x: -crownR * 0.5, y: crownR * 0.5 },
    { x: crownR * 0.5, y: -crownR * 0.4 },
  ]
  return (
    <>
      <StemPath tier={tier} color={colors.stem} width={4} />
      {tier >= 2 &&
        blobs.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={colors.leaf} stroke={colors.outline} strokeWidth={1.5} />
        ))}
      {tier === 1 && <ellipse cx="20" cy={top} rx={4} ry={3} fill={colors.leaf} stroke={colors.outline} strokeWidth={1.4} />}
      {hasFlower &&
        accents.slice(0, 3).map((a, i) => (
          <circle key={i} cx={20 + a.x} cy={top + a.y} r={1.4} fill={colors.flower} stroke={colors.outline} strokeWidth={0.7} />
        ))}
      {hasFruit &&
        accents.map((a, i) => (
          <circle key={`fruit-${i}`} cx={20 + a.x} cy={top + a.y} r={1.3} fill={colors.fruit} stroke={colors.outline} strokeWidth={0.7} />
        ))}
    </>
  )
}

const CactusBody = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  if (tier === 0) return null
  const segments = Math.min(1 + Math.floor((tier - 1) / 1.5), 6)
  const segHeight = 4.2
  const baseY = 42
  const parts: ReactNode[] = []
  for (let i = 0; i < segments; i++) {
    const cy = baseY - segHeight * (i + 0.5) - i * 0.4
    const width = 6.5 - i * 0.2
    parts.push(
      <rect
        key={`seg-${i}`}
        x={20 - width / 2}
        y={cy - segHeight / 2}
        width={width}
        height={segHeight}
        rx={width / 2}
        fill={colors.stem}
        stroke={colors.outline}
        strokeWidth={1.5}
      />
    )
    for (const s of [-1, 0, 1]) {
      parts.push(
        <line
          key={`spine-${i}-${s}`}
          x1={20 + s * width * 0.28}
          y1={cy - segHeight * 0.3}
          x2={20 + s * width * 0.28}
          y2={cy + segHeight * 0.3}
          stroke={colors.leaf}
          strokeWidth="0.6"
          strokeLinecap="round"
        />
      )
    }
  }
  const top = baseY - segHeight * segments - (segments - 1) * 0.4
  return (
    <>
      {parts}
      {hasFlower && <BloomCluster x={20} y={top - 1} color={colors.flower} glow={colors.glow} outline={colors.outline} scale={0.65} />}
      {hasFruit && <FruitDot x={23} y={top + 2} color={colors.fruit} leafColor={colors.leaf} outline={colors.outline} r={2.2} />}
    </>
  )
}

const SucculentRosette = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  if (tier === 0) return null
  const count = Math.min(4 + tier, 12)
  const baseY = 40
  const reach = 3.5 + Math.min(tier, 6) * 0.9
  const spreadDeg = 150
  const leaves: ReactNode[] = []
  for (let i = 0; i < count; i++) {
    const angle = count === 1 ? 0 : -spreadDeg / 2 + (spreadDeg / (count - 1)) * i
    const rad = (angle * Math.PI) / 180
    const px = 20 + Math.sin(rad) * reach
    const py = baseY - Math.cos(rad) * reach * 0.8
    leaves.push(
      <ellipse
        key={i}
        cx={px}
        cy={py}
        rx={2.6}
        ry={1.4}
        fill={colors.leaf}
        stroke={colors.outline}
        strokeWidth="1.2"
        transform={`rotate(${angle.toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})`}
      />
    )
  }
  const spikeTop = 40 - Math.min(tier, 9) * 2.2
  return (
    <>
      {leaves}
      <circle cx="20" cy={baseY} r="2.2" fill={colors.stem} stroke={colors.outline} strokeWidth="1" />
      {hasFlower && (
        <>
          <path d={`M20 ${baseY} L20 ${spikeTop}`} stroke={colors.stem} strokeWidth="1.6" strokeLinecap="round" />
          <BloomCluster x={20} y={spikeTop - 1} color={colors.flower} glow={colors.glow} outline={colors.outline} scale={0.6} />
        </>
      )}
      {hasFruit && <FruitDot x={20} y={spikeTop + 3} color={colors.fruit} leafColor={colors.leaf} outline={colors.outline} r={1.8} />}
    </>
  )
}

const FernFronds = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const count = Math.min(2 + tier, 8)
  const baseY = 42
  const fronds: { tipX: number; tipY: number }[] = []
  const parts: ReactNode[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const angle = -65 + 130 * t
    const rad = (angle * Math.PI) / 180
    const length = 9 + Math.min(tier, 7) * 2.1
    const tipX = 20 + Math.sin(rad) * length * 0.55
    const tipY = baseY - Math.cos(rad) * length
    fronds.push({ tipX, tipY })
    const midX = 20 + Math.sin(rad) * length * 0.3
    const midY = baseY - Math.cos(rad) * length * 0.55
    parts.push(
      <path
        key={`spine-${i}`}
        d={`M20 ${baseY} Q${midX.toFixed(1)} ${midY.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`}
        stroke={colors.stem}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
    )
    for (let j = 1; j <= 4; j++) {
      const lt = j / 5
      const lx = 20 + (tipX - 20) * lt
      const ly = baseY + (tipY - baseY) * lt
      const size = 1.7 * (1 - lt * 0.4)
      parts.push(
        <ellipse
          key={`leaflet-${i}-${j}`}
          cx={lx}
          cy={ly}
          rx={size}
          ry={size * 0.55}
          fill={colors.leaf}
          stroke={colors.outline}
          strokeWidth={0.8}
          transform={`rotate(${angle} ${lx.toFixed(1)} ${ly.toFixed(1)})`}
        />
      )
    }
  }
  const tallest = fronds.reduce((a, b) => (b.tipY < a.tipY ? b : a), fronds[0] ?? { tipX: 20, tipY: baseY })
  return (
    <>
      {parts}
      {hasFlower && <BloomCluster x={tallest.tipX} y={tallest.tipY} color={colors.flower} glow={colors.glow} outline={colors.outline} scale={0.5} />}
      {hasFruit && <FruitDot x={20} y={baseY - 2} color={colors.fruit} leafColor={colors.leaf} outline={colors.outline} r={1.8} />}
    </>
  )
}

function quadPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) {
  const mt = 1 - t
  return { x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x, y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y }
}

// Tendrils anchor to alternating sides of the rim (not one shared center point) and bow
// outward before drooping, so they read as trailing over the pot edge instead of a bundle
// of straight lines fanning from the middle. Leaflets follow the actual curve via
// quadPoint rather than a straight lerp between endpoints, which drifted off-curve on wide bends.
const VineDrape = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const count = Math.min(1 + Math.floor(tier / 2), 5)
  const baseY = 41
  const tips: { x: number; y: number }[] = []
  const parts: ReactNode[] = []
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1
    const originX = 20 + side * (6 + Math.floor(i / 2) * 2)
    const length = 4 + Math.min(tier, 8) * 0.65
    const p0 = { x: originX, y: baseY }
    const p1 = { x: originX + side * 4, y: baseY + length * 0.3 }
    const p2 = { x: originX + side * 1.2, y: baseY + length }
    tips.push(p2)
    parts.push(
      <path
        key={`tendril-${i}`}
        d={`M${p0.x} ${p0.y} Q${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`}
        stroke={colors.stem}
        strokeWidth={1.3}
        fill="none"
        strokeLinecap="round"
      />
    )
    for (let j = 1; j <= 4; j++) {
      const lt = j / 5
      const { x: lx, y: ly } = quadPoint(p0, p1, p2, lt)
      const size = 1.5 + lt * 0.6
      parts.push(
        <ellipse
          key={`leaflet-${i}-${j}`}
          cx={lx}
          cy={ly}
          rx={size}
          ry={size * 0.68}
          fill={colors.leaf}
          stroke={colors.outline}
          strokeWidth={0.9}
          transform={`rotate(${side * (25 + lt * 20)} ${lx.toFixed(1)} ${ly.toFixed(1)})`}
        />
      )
    }
  }
  const longest = tips.reduce((a, b) => (b.y > a.y ? b : a), tips[0] ?? { x: 20, y: baseY })
  return (
    <>
      {parts}
      {hasFlower && <BloomCluster x={longest.x} y={longest.y} color={colors.flower} glow={colors.glow} outline={colors.outline} scale={0.5} />}
      {hasFruit && tips[1] && <FruitDot x={tips[1].x} y={tips[1].y} color={colors.fruit} leafColor={colors.leaf} outline={colors.outline} r={1.6} />}
    </>
  )
}

const BambooStalk = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  if (tier === 0) return null
  const segments = Math.min(2 + Math.floor(tier / 1.2), 7)
  const segHeight = 5
  const baseY = 42
  const width = 2.4
  const parts: ReactNode[] = []
  for (let i = 0; i < segments; i++) {
    const cy = baseY - segHeight * (i + 0.5)
    parts.push(
      <rect
        key={`joint-${i}`}
        x={20 - width / 2}
        y={cy - segHeight / 2}
        width={width}
        height={segHeight}
        rx={width / 2}
        fill={colors.stem}
        stroke={colors.outline}
        strokeWidth={1.3}
      />
    )
    if (i > 0) {
      const jointY = cy + segHeight / 2
      const side = i % 2 === 0 ? 1 : -1
      const leafX = 20 + side * 3.4
      const leafY = jointY - 1.5
      parts.push(
        <line key={`band-${i}`} x1={20 - width / 2 - 0.3} y1={jointY} x2={20 + width / 2 + 0.3} y2={jointY} stroke={colors.outline} strokeWidth={0.7} />
      )
      parts.push(
        <ellipse
          key={`tuft-${i}`}
          cx={leafX}
          cy={leafY}
          rx={2.6}
          ry={0.8}
          fill={colors.leaf}
          stroke={colors.outline}
          strokeWidth={0.7}
          transform={`rotate(${side * 25} ${leafX} ${leafY})`}
        />
      )
    }
  }
  const top = baseY - segHeight * segments
  return (
    <>
      {parts}
      {hasFlower && <BloomCluster x={20} y={top - 1} color={colors.flower} glow={colors.glow} outline={colors.outline} scale={0.55} />}
      {hasFruit && <FruitDot x={22.5} y={top + 2} color={colors.fruit} leafColor={colors.leaf} outline={colors.outline} r={1.8} />}
    </>
  )
}

const PalmCrown = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const top = canopyTop(tier)
  const ringCount = Math.min(tier, 4)
  const rings: ReactNode[] = []
  for (let i = 1; i <= ringCount; i++) {
    const ry = 42 - (42 - top) * (i / (ringCount + 1))
    rings.push(<line key={`ring-${i}`} x1={18.2} y1={ry} x2={21.8} y2={ry} stroke={colors.outline} strokeWidth={0.6} opacity={0.5} />)
  }
  const frondCount = Math.min(3 + tier, 9)
  const fronds: ReactNode[] = []
  for (let i = 0; i < frondCount; i++) {
    const t = frondCount === 1 ? 0.5 : i / (frondCount - 1)
    const angle = -80 + 160 * t
    const rad = (angle * Math.PI) / 180
    const reach = 6 + Math.min(tier, 6) * 1.1
    const tipX = 20 + Math.sin(rad) * reach
    const tipY = top - Math.cos(rad) * reach * 0.45 + Math.abs(Math.sin(rad)) * reach * 0.3
    const ctrlX = 20 + Math.sin(rad) * reach * 0.5
    const ctrlY = top - reach * 0.3
    fronds.push(
      <path
        key={`frond-${i}`}
        d={`M20 ${top.toFixed(1)} Q${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`}
        stroke={colors.leaf}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    )
  }
  return (
    <>
      <StemPath tier={tier} color={colors.stem} width={2.3} />
      {rings}
      {fronds}
      {hasFlower && <BloomCluster x={20} y={top + 1} color={colors.flower} glow={colors.glow} outline={colors.outline} scale={0.5} />}
      {hasFruit && <FruitDot x={23} y={top + 3} color={colors.fruit} leafColor={colors.leaf} outline={colors.outline} r={1.8} />}
    </>
  )
}

const MushroomCluster = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const count = Math.min(2 + Math.floor(tier / 1.4), 6)
  const baseY = 42
  const parts: ReactNode[] = []
  let tallestCapY = baseY
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const x = 20 + (t - 0.5) * 16
    const h = 3 + Math.min(tier, 8) * 0.85 + (i % 2 === 0 ? 1 : 0)
    const stalkTop = baseY - h
    const capRx = 2.6 + Math.min(tier, 8) * 0.28 + (i % 2) * 0.4
    const capRy = capRx * 0.55
    const capFill = hasFlower ? colors.flower : colors.stem
    tallestCapY = Math.min(tallestCapY, stalkTop)
    parts.push(<rect key={`stalk-${i}`} x={x - 0.55} y={stalkTop} width={1.1} height={h} rx={0.5} fill={colors.leaf} stroke={colors.outline} strokeWidth={1} />)
    parts.push(<ellipse key={`cap-${i}`} cx={x} cy={stalkTop} rx={capRx} ry={capRy} fill={capFill} stroke={colors.outline} strokeWidth={1.2} />)
    if (hasFlower) {
      parts.push(<circle key={`spot-${i}-a`} cx={x - capRx * 0.35} cy={stalkTop - capRy * 0.2} r={0.5} fill="white" opacity={0.75} />)
      parts.push(<circle key={`spot-${i}-b`} cx={x + capRx * 0.3} cy={stalkTop + capRy * 0.1} r={0.4} fill="white" opacity={0.65} />)
    }
  }
  return (
    <>
      {parts}
      {hasFruit && (
        <>
          <rect x={28.5} y={baseY - 2} width={0.9} height={2} rx={0.4} fill={colors.leaf} stroke={colors.outline} strokeWidth={0.7} />
          <ellipse cx={29} cy={baseY - 2} rx={1.6} ry={0.9} fill={colors.fruit} stroke={colors.outline} strokeWidth={0.8} />
        </>
      )}
    </>
  )
}

const PineTiers = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const trunkH = 2
  const baseY = 42
  const tiersN = Math.min(2 + tier, 8)
  const layerH = 4.4
  const parts: ReactNode[] = [
    <rect key="trunk" x={19.3} y={baseY - trunkH} width={1.4} height={trunkH} fill={colors.stem} stroke={colors.outline} strokeWidth={1} />,
  ]
  const accents: { x: number; y: number }[] = []
  let topY = baseY - trunkH
  for (let i = 0; i < tiersN; i++) {
    const width = Math.max(3, 11 - i * 0.95)
    const layerTopY = topY - layerH
    parts.push(
      <polygon
        key={`tier-${i}`}
        points={`20,${layerTopY.toFixed(1)} ${(20 - width / 2).toFixed(1)},${topY.toFixed(1)} ${(20 + width / 2).toFixed(1)},${topY.toFixed(1)}`}
        fill={colors.leaf}
        stroke={colors.outline}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    )
    accents.push({ x: -width * 0.22, y: layerTopY + layerH * 0.55 })
    accents.push({ x: width * 0.22, y: layerTopY + layerH * 0.3 })
    topY = topY - layerH * 0.6
  }
  return (
    <>
      {parts}
      {hasFlower &&
        accents.slice(0, 3).map((a, i) => (
          <circle key={`orn-${i}`} cx={20 + a.x} cy={a.y} r={1.1} fill={colors.flower} stroke={colors.outline} strokeWidth={0.6} />
        ))}
      {hasFruit &&
        accents.map((a, i) => (
          <ellipse key={`cone-${i}`} cx={20 + a.x} cy={a.y} rx={0.9} ry={1.6} fill={colors.fruit} stroke={colors.outline} strokeWidth={0.6} />
        ))}
    </>
  )
}

const CloverMound = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const count = Math.min(3 + tier, 9)
  const baseY = 41
  const spread = 7 + Math.min(tier, 7) * 1.1
  const parts: ReactNode[] = []
  let tallest: { x: number; y: number } | null = null
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const x = 20 + (t - 0.5) * 2 * spread
    const riseFactor = 1 - Math.abs(t - 0.5) * 2
    const y = baseY - (1.4 + riseFactor * 2.4)
    parts.push(<line key={`stem-${i}`} x1={x} y1={baseY} x2={x} y2={y + 1} stroke={colors.stem} strokeWidth={0.9} strokeLinecap="round" />)
    for (const angDeg of [-90, 30, 150]) {
      const rad = (angDeg * Math.PI) / 180
      const lx = x + Math.cos(rad) * 1.4
      const ly = y + Math.sin(rad) * 1.4
      parts.push(<circle key={`leaflet-${i}-${angDeg}`} cx={lx} cy={ly} r={1.3} fill={colors.leaf} stroke={colors.outline} strokeWidth={0.9} />)
    }
    if (!tallest || y < tallest.y) tallest = { x, y }
  }
  return (
    <>
      {parts}
      {hasFlower && tallest && <BloomCluster x={tallest.x} y={tallest.y - 2} color={colors.flower} glow={colors.glow} outline={colors.outline} scale={0.45} />}
      {hasFruit && tallest && (
        <circle cx={tallest.x + 1.6} cy={tallest.y - 1.6} r={1.1} fill={colors.fruit} stroke={colors.outline} strokeWidth={0.7} />
      )}
    </>
  )
}

const OrchidStem = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const baseY = 42
  const top = canopyTop(tier)
  const driftX = Math.min(4 + tier * 0.6, 10)
  const tipX = 20 + driftX
  const ctrlX = 20 + driftX * 0.5
  const ctrlY = (baseY + top) / 2
  const bloomCount = hasFlower ? Math.min(Math.max(1, Math.floor((tier - 4) / 1.2)), 4) : 0
  const blossoms: ReactNode[] = []
  for (let j = 1; j <= bloomCount; j++) {
    const lt = j / (bloomCount + 1)
    const bx = 20 + (tipX - 20) * lt
    const by = baseY + (top - baseY) * lt
    blossoms.push(
      <g key={`blossom-${j}`}>
        <ellipse cx={bx - 1.6} cy={by} rx={1.8} ry={1.1} fill={colors.flower} stroke={colors.outline} strokeWidth={0.8} transform={`rotate(-25 ${(bx - 1.6).toFixed(1)} ${by.toFixed(1)})`} />
        <ellipse cx={bx + 1.6} cy={by} rx={1.8} ry={1.1} fill={colors.flower} stroke={colors.outline} strokeWidth={0.8} transform={`rotate(25 ${(bx + 1.6).toFixed(1)} ${by.toFixed(1)})`} />
        <circle cx={bx} cy={by} r={0.7} fill={colors.glow} stroke={colors.outline} strokeWidth={0.5} />
      </g>
    )
  }
  return (
    <>
      <path d={`M20 ${baseY} Q${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${tipX.toFixed(1)} ${top.toFixed(1)}`} stroke={colors.stem} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <ellipse cx={17} cy={baseY - 1} rx={1.8} ry={4} fill={colors.leaf} stroke={colors.outline} strokeWidth={1} transform={`rotate(-12 17 ${baseY - 1})`} />
      <ellipse cx={23} cy={baseY - 1} rx={1.8} ry={4} fill={colors.leaf} stroke={colors.outline} strokeWidth={1} transform={`rotate(12 23 ${baseY - 1})`} />
      {blossoms}
      {hasFruit && <ellipse cx={tipX} cy={top + 2} rx={0.9} ry={2.4} fill={colors.fruit} stroke={colors.outline} strokeWidth={0.8} transform={`rotate(15 ${tipX.toFixed(1)} ${(top + 2).toFixed(1)})`} />}
    </>
  )
}

const CoralFronds = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const count = Math.min(2 + Math.floor(tier / 1.3), 7)
  const baseY = 42
  const parts: ReactNode[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const angle = -70 + 140 * t
    const rad = (angle * Math.PI) / 180
    const length = 7 + Math.min(tier, 7) * 1.6
    const tipX = 20 + Math.sin(rad) * length * 0.6
    const tipY = baseY - Math.cos(rad) * length
    const perpRad = rad + Math.PI / 2
    const wobble = (i % 2 === 0 ? 1 : -1) * 2.2
    const ctrlX = 20 + Math.sin(rad) * length * 0.5 + Math.cos(perpRad) * wobble
    const ctrlY = baseY - Math.cos(rad) * length * 0.5 + Math.sin(perpRad) * wobble
    const bulbR = 1.5 + Math.min(tier, 8) * 0.15
    parts.push(
      <path
        key={`tentacle-${i}`}
        d={`M20 ${baseY} Q${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`}
        stroke={colors.stem}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
    )
    parts.push(<circle key={`bulb-${i}`} cx={tipX} cy={tipY} r={bulbR} fill={hasFlower ? colors.flower : colors.leaf} stroke={colors.outline} strokeWidth={1} />)
  }
  return (
    <>
      {parts}
      {hasFruit && <FruitDot x={20} y={baseY - 3} color={colors.fruit} leafColor={colors.leaf} outline={colors.outline} r={1.6} />}
    </>
  )
}

const GrassTuft = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const count = Math.min(6 + tier, 14)
  const baseY = 42
  const blades: { x: number; y: number }[] = []
  const parts: ReactNode[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const angle = -60 + 120 * t
    const rad = (angle * Math.PI) / 180
    const length = 7 + Math.min(tier, 7) * 1.5
    const tipX = 20 + Math.sin(rad) * length * 0.7
    const tipY = baseY - Math.cos(rad) * length
    const ctrlX = 20 + Math.sin(rad) * length * 0.3
    const ctrlY = baseY - Math.cos(rad) * length * 0.75
    blades.push({ x: tipX, y: tipY })
    parts.push(
      <path
        key={`blade-${i}`}
        d={`M20 ${baseY} Q${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`}
        stroke={colors.stem}
        strokeWidth={0.9}
        fill="none"
        strokeLinecap="round"
      />
    )
  }
  const tallest = blades.reduce((a, b) => (b.y < a.y ? b : a), blades[0] ?? { x: 20, y: baseY })
  return (
    <>
      {parts}
      {hasFlower && <BloomCluster x={tallest.x} y={tallest.y} color={colors.flower} glow={colors.glow} outline={colors.outline} scale={0.4} />}
      {hasFruit && <FruitDot x={20} y={baseY - 3} color={colors.fruit} leafColor={colors.leaf} outline={colors.outline} r={1.4} />}
    </>
  )
}

const LotusPads = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const padCount = Math.min(2 + Math.floor(tier / 1.5), 6)
  const baseY = 41.5
  const parts: ReactNode[] = []
  for (let i = 0; i < padCount; i++) {
    const t = padCount === 1 ? 0.5 : i / (padCount - 1)
    const x = 20 + (t - 0.5) * 14
    const y = baseY - (i % 2 === 0 ? 0 : 0.6)
    const padRx = 3.2 + Math.min(tier, 7) * 0.3
    const padRy = padRx * 0.32
    parts.push(<ellipse key={`pad-${i}`} cx={x} cy={y} rx={padRx} ry={padRy} fill={colors.leaf} stroke={colors.outline} strokeWidth={1} />)
  }
  const stemTopY = baseY - (6 + Math.min(tier, 9) * 1.4)
  return (
    <>
      {parts}
      {hasFlower && (
        <>
          <path d={`M20 ${baseY - 1} L20 ${stemTopY.toFixed(1)}`} stroke={colors.stem} strokeWidth={1.2} strokeLinecap="round" />
          <BloomCluster x={20} y={stemTopY} color={colors.flower} glow={colors.glow} outline={colors.outline} scale={0.9} />
          <BloomCluster x={20} y={stemTopY} color={colors.glow} glow={colors.flower} outline={colors.outline} scale={0.5} />
        </>
      )}
      {hasFruit && <FruitDot x={20} y={stemTopY + 2.5} color={colors.fruit} leafColor={colors.leaf} outline={colors.outline} r={1.6} />}
    </>
  )
}

const BonsaiPads = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const segs = Math.min(1 + Math.floor(tier / 2.2), 4)
  const baseY = 42
  const segLen = 3.4
  const points: { x: number; y: number }[] = [{ x: 20, y: baseY }]
  let cur = { x: 20, y: baseY }
  for (let i = 0; i < segs; i++) {
    const side = i % 2 === 0 ? 1 : -1
    cur = { x: cur.x + side * 2, y: cur.y - segLen }
    points.push(cur)
  }
  const trunkPath = points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L")
  const padCount = Math.min(1 + Math.floor(tier / 2), 3)
  const pads: { x: number; y: number }[] = []
  const padParts: ReactNode[] = []
  for (let i = 0; i < padCount; i++) {
    const anchor = points[points.length - 1 - i] ?? cur
    const side = i % 2 === 0 ? -1 : 1
    const px = anchor.x + side * (3.5 + i * 0.5)
    const py = anchor.y - 0.5
    pads.push({ x: px, y: py })
    padParts.push(<ellipse key={`pad-${i}`} cx={px} cy={py} rx={4 - i * 0.4} ry={1.2} fill={colors.leaf} stroke={colors.outline} strokeWidth={1.1} />)
  }
  return (
    <>
      <path d={`M${trunkPath}`} stroke={colors.stem} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {padParts}
      {hasFlower &&
        pads.slice(0, 2).map((p, i) => <circle key={`blossom-${i}`} cx={p.x} cy={p.y - 1} r={1} fill={colors.flower} stroke={colors.outline} strokeWidth={0.6} />)}
      {hasFruit && pads[0] && <circle cx={pads[0].x - 1.5} cy={pads[0].y} r={1} fill={colors.fruit} stroke={colors.outline} strokeWidth={0.6} />}
    </>
  )
}

const FlytrapJaws = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const count = Math.min(2 + Math.floor(tier / 1.5), 6)
  const baseY = 42
  const parts: ReactNode[] = []
  const traps: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const angle = -60 + 120 * t
    const rad = (angle * Math.PI) / 180
    const stalkLen = 5 + Math.min(tier, 8) * 0.9
    const tipX = 20 + Math.sin(rad) * stalkLen * 0.7
    const tipY = baseY - Math.cos(rad) * stalkLen
    traps.push({ x: tipX, y: tipY })
    parts.push(
      <path
        key={`stalk-${i}`}
        d={`M20 ${baseY} Q${(20 + Math.sin(rad) * stalkLen * 0.3).toFixed(1)} ${(baseY - Math.cos(rad) * stalkLen * 0.5).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`}
        stroke={colors.stem}
        strokeWidth={1.3}
        fill="none"
        strokeLinecap="round"
      />
    )
    for (const side of [-1, 1]) {
      const lobeRot = angle + side * 22
      const lobeRad = (lobeRot * Math.PI) / 180
      const lobeCx = tipX + Math.sin(lobeRad) * 2.2
      const lobeCy = tipY - Math.cos(lobeRad) * 2.2
      parts.push(
        <ellipse
          key={`lobe-${i}-${side}`}
          cx={lobeCx}
          cy={lobeCy}
          rx={3}
          ry={1.6}
          fill={colors.leaf}
          stroke={colors.outline}
          strokeWidth={1}
          transform={`rotate(${lobeRot.toFixed(0)} ${lobeCx.toFixed(1)} ${lobeCy.toFixed(1)})`}
        />
      )
    }
  }
  return (
    <>
      {parts}
      {hasFlower && traps[0] && <circle cx={traps[0].x} cy={traps[0].y} r={0.9} fill={colors.flower} stroke={colors.outline} strokeWidth={0.5} />}
      {hasFruit && traps[1] && <circle cx={traps[1].x} cy={traps[1].y} r={0.6} fill={colors.outline} opacity={0.8} />}
    </>
  )
}

const SunflowerStem = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  if (tier === 0) return null
  const top = canopyTop(tier)
  const parts: ReactNode[] = [<StemPath key="stem" tier={tier} color={colors.stem} width={3.2} />]
  if (tier >= 2) parts.push(<ellipse key="leaf-l" cx={14.5} cy={38} rx={3.4} ry={2.2} fill={colors.leaf} stroke={colors.outline} strokeWidth={1.3} transform="rotate(-25 14.5 38)" />)
  if (tier >= 4) parts.push(<ellipse key="leaf-r" cx={25.5} cy={32} rx={3.6} ry={2.3} fill={colors.leaf} stroke={colors.outline} strokeWidth={1.3} transform="rotate(25 25.5 32)" />)
  if (hasFlower) {
    const petals: ReactNode[] = []
    for (let a = 0; a < 360; a += 30) {
      const rad = (a * Math.PI) / 180
      const px = 20 + Math.sin(rad) * 5.4
      const py = top - Math.cos(rad) * 5.4
      petals.push(<ellipse key={`petal-${a}`} cx={px} cy={py} rx={2.6} ry={1.1} fill={colors.flower} stroke={colors.outline} strokeWidth={0.8} transform={`rotate(${a} ${px.toFixed(1)} ${py.toFixed(1)})`} />)
    }
    parts.push(<g key="head">{petals}</g>)
    parts.push(<circle key="disc" cx={20} cy={top} r={3.2} fill={colors.fruit} stroke={colors.outline} strokeWidth={1.1} />)
    if (hasFruit) {
      parts.push(
        <g key="seeds">
          {[-1.3, 0, 1.3].map((dx, i) => (
            <circle key={i} cx={20 + dx} cy={top + (i % 2 === 0 ? -0.8 : 0.9)} r={0.4} fill={colors.outline} opacity={0.6} />
          ))}
        </g>
      )
    }
  } else {
    parts.push(<circle key="bud" cx={20} cy={top} r={1.8} fill={colors.leaf} stroke={colors.outline} strokeWidth={1} />)
  }
  return <>{parts}</>
}

const PomPomTopiary = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  if (tier === 0) return null
  const top = canopyTop(tier)
  const ballR = 3 + tier * 0.85
  const accents = [
    { x: -ballR * 0.4, y: -ballR * 0.3 }, { x: ballR * 0.35, y: ballR * 0.1 }, { x: 0, y: ballR * 0.4 },
    { x: -ballR * 0.5, y: ballR * 0.35 }, { x: ballR * 0.45, y: -ballR * 0.35 },
  ]
  return (
    <>
      <StemPath tier={tier} color={colors.stem} width={2.4} />
      <circle cx={20} cy={top} r={ballR} fill={colors.leaf} stroke={colors.outline} strokeWidth={1.6} />
      {hasFlower && accents.slice(0, 3).map((a, i) => <circle key={`bloom-${i}`} cx={20 + a.x} cy={top + a.y} r={1.2} fill={colors.flower} stroke={colors.outline} strokeWidth={0.7} />)}
      {hasFruit && accents.map((a, i) => <circle key={`fruit-${i}`} cx={20 + a.x} cy={top + a.y} r={1} fill={colors.fruit} stroke={colors.outline} strokeWidth={0.7} />)}
    </>
  )
}

const HEART_PATH = (x: number, y: number) =>
  `M${x} ${(y + 1.6).toFixed(1)} C${(x - 2.6).toFixed(1)} ${(y - 0.6).toFixed(1)} ${(x - 1.1).toFixed(1)} ${(y - 2.6).toFixed(1)} ${x} ${(y - 0.9).toFixed(1)} C${(x + 1.1).toFixed(1)} ${(y - 2.6).toFixed(1)} ${(x + 2.6).toFixed(1)} ${(y - 0.6).toFixed(1)} ${x} ${(y + 1.6).toFixed(1)} Z`

const StrawberryPatch = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  const count = Math.min(3 + tier, 8)
  const baseY = 41
  const spread = 6 + Math.min(tier, 7)
  const parts: ReactNode[] = []
  let tallest: { x: number; y: number } | null = null
  const positions: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const x = 20 + (t - 0.5) * 2 * spread
    const riseFactor = 1 - Math.abs(t - 0.5) * 2
    const y = baseY - (1 + riseFactor * 1.8)
    positions.push({ x, y })
    parts.push(<line key={`stem-${i}`} x1={x} y1={baseY} x2={x} y2={y + 1.5} stroke={colors.stem} strokeWidth={0.8} strokeLinecap="round" />)
    parts.push(<path key={`heart-${i}`} d={HEART_PATH(x, y)} fill={colors.leaf} stroke={colors.outline} strokeWidth={0.9} />)
    if (!tallest || y < tallest.y) tallest = { x, y }
  }
  return (
    <>
      {parts}
      {hasFlower && tallest && <BloomCluster x={tallest.x} y={tallest.y - 2.4} color={colors.flower} glow={colors.glow} outline={colors.outline} scale={0.45} />}
      {hasFruit &&
        positions.slice(0, 2).map((p, i) => (
          <g key={`berry-${i}`} transform={`translate(${p.x + (i === 0 ? -1.5 : 1.8)}, ${p.y + 3})`}>
            <path d="M0 0 L-1.6 2.6 Q0 4.4 1.6 2.6 Z" fill={colors.fruit} stroke={colors.outline} strokeWidth={0.7} />
            <ellipse cx={0} cy={-0.3} rx={1.3} ry={0.6} fill={colors.leaf} stroke={colors.outline} strokeWidth={0.5} />
            <circle cx={-0.5} cy={1.6} r={0.25} fill={colors.outline} opacity={0.6} />
            <circle cx={0.6} cy={2.3} r={0.25} fill={colors.outline} opacity={0.6} />
          </g>
        ))}
    </>
  )
}

const TulipCluster = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  if (tier === 0) return null
  const count = Math.min(1 + Math.floor(tier / 2.5), 4)
  const baseY = 42
  const parts: ReactNode[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const x = 20 + (t - 0.5) * 10
    const stemLen = Math.min(6 + tier * 1.8, 24)
    const topY = baseY - stemLen
    parts.push(<line key={`stem-${i}`} x1={x} y1={baseY} x2={x} y2={topY} stroke={colors.stem} strokeWidth={1.8} strokeLinecap="round" />)
    if (i === 0) parts.push(<ellipse key="base-leaf" cx={x - 2} cy={baseY - 1} rx={1.6} ry={4} fill={colors.leaf} stroke={colors.outline} strokeWidth={1} transform={`rotate(-15 ${x - 2} ${baseY - 1})`} />)
    if (hasFlower) {
      const cup = `M${(x - 2.2).toFixed(1)} ${(topY + 3).toFixed(1)} Q${(x - 2.6).toFixed(1)} ${(topY - 1).toFixed(1)} ${(x - 0.8).toFixed(1)} ${(topY - 3).toFixed(1)} Q${x.toFixed(1)} ${(topY - 3.6).toFixed(1)} ${(x + 0.8).toFixed(1)} ${(topY - 3).toFixed(1)} Q${(x + 2.6).toFixed(1)} ${(topY - 1).toFixed(1)} ${(x + 2.2).toFixed(1)} ${(topY + 3).toFixed(1)} Q${x.toFixed(1)} ${(topY + 1.5).toFixed(1)} ${(x - 2.2).toFixed(1)} ${(topY + 3).toFixed(1)} Z`
      parts.push(<path key={`cup-${i}`} d={cup} fill={colors.flower} stroke={colors.outline} strokeWidth={1} />)
    } else {
      parts.push(<ellipse key={`bud-${i}`} cx={x} cy={topY} rx={1.6} ry={2} fill={colors.leaf} stroke={colors.outline} strokeWidth={1} />)
    }
  }
  return (
    <>
      {parts}
      {hasFruit && <ellipse cx={20 + (count - 1) * 2.5 + 2} cy={baseY - 2} rx={1} ry={1.6} fill={colors.fruit} stroke={colors.outline} strokeWidth={0.7} />}
    </>
  )
}

const PumpkinVine = ({ tier, colors, hasFlower, hasFruit }: { tier: PlantTier; colors: CanopyColors; hasFlower: boolean; hasFruit: boolean }) => {
  if (tier === 0) return null
  const reach = Math.min(4 + tier * 1.1, 13)
  const baseY = 42
  const leftX = 20 - reach
  const rightX = 20 + reach
  const bow = baseY - 2
  const count = Math.min(2 + Math.floor(tier / 1.5), 6)
  const leaves: ReactNode[] = []
  for (let i = 0; i < count; i++) {
    const lt = count === 1 ? 0.5 : i / (count - 1)
    const { x: lx, y: ly } = quadPoint({ x: leftX, y: baseY }, { x: 20, y: bow }, { x: rightX, y: baseY }, lt)
    const side = i % 2 === 0 ? -1 : 1
    leaves.push(<ellipse key={`leaf-${i}`} cx={lx} cy={ly + side * 1.6} rx={2.6} ry={2} fill={colors.leaf} stroke={colors.outline} strokeWidth={0.9} transform={`rotate(${side * 20} ${lx.toFixed(1)} ${(ly + side * 1.6).toFixed(1)})`} />)
  }
  return (
    <>
      <path d={`M${leftX} ${baseY} Q20 ${bow} ${rightX} ${baseY}`} stroke={colors.stem} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      {leaves}
      {hasFlower && (
        <>
          <BloomCluster x={leftX + 2} y={baseY - 1} color={colors.flower} glow={colors.glow} outline={colors.outline} scale={0.4} />
          <BloomCluster x={rightX - 2} y={baseY - 1} color={colors.flower} glow={colors.glow} outline={colors.outline} scale={0.4} />
        </>
      )}
      {hasFruit && (
        <>
          <circle cx={leftX + 3} cy={baseY + 1.5} r={2.6} fill={colors.fruit} stroke={colors.outline} strokeWidth={1} />
          <rect x={leftX + 2.6} y={baseY - 1.6} width={0.8} height={1.4} fill={colors.leaf} stroke={colors.outline} strokeWidth={0.5} />
        </>
      )}
    </>
  )
}

const SpeciesCanopy = ({
  species,
  tier,
  colors,
  hasFlower,
  hasFruit,
}: {
  species: PlantSpecies
  tier: PlantTier
  colors: CanopyColors
  hasFlower: boolean
  hasFruit: boolean
}) => {
  switch (species) {
    case "tree":
      return <TreeCanopy tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "cactus":
      return <CactusBody tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "succulent":
      return <SucculentRosette tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "fern":
      return <FernFronds tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "vine":
      return <VineDrape tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "bamboo":
      return <BambooStalk tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "palm":
      return <PalmCrown tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "mushroom":
      return <MushroomCluster tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "pine":
      return <PineTiers tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "clover":
      return <CloverMound tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "orchid":
      return <OrchidStem tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "coral":
      return <CoralFronds tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "grass":
      return <GrassTuft tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "lotus":
      return <LotusPads tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "bonsai":
      return <BonsaiPads tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "flytrap":
      return <FlytrapJaws tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "sunflower":
      return <SunflowerStem tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "topiary":
      return <PomPomTopiary tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "strawberry":
      return <StrawberryPatch tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "tulip":
      return <TulipCluster tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "pumpkin-vine":
      return <PumpkinVine tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
    case "flower":
    default:
      return <FlowerCanopy tier={tier} colors={colors} hasFlower={hasFlower} hasFruit={hasFruit} />
  }
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

/* ─── Special reward pot decorations ───
   Fixed, palette-independent decoration for each admin-only reward pot — the whole point
   is that these don't recolor with the learner's palette like the 4 basic pots do. */

const TrophyDecoration = () => (
  <>
    <path d="M7 44 L33 44 L31 41 L9 41 Z" fill="none" stroke="#d4af37" strokeWidth={1.4} />
    <path d="M7.5 42.5 C4.5 42.5 4.5 46.5 7.5 46.5" fill="none" stroke="#d4af37" strokeWidth={1.3} />
    <path d="M32.5 42.5 C35.5 42.5 35.5 46.5 32.5 46.5" fill="none" stroke="#d4af37" strokeWidth={1.3} />
    <ellipse cx={16} cy={47.5} rx={3.5} ry={1} fill="#d4af37" opacity={0.35} />
  </>
)

const StarlightDecoration = () => (
  <>
    <path d="M8 42 L32 42 L30 39 L10 39 Z" fill="none" stroke="#cfd8ff" strokeWidth={1} opacity={0.8} />
    {[[14, 47], [24, 45.5], [19, 49], [27, 48]].map(([x, y], i) => (
      <path
        key={i}
        d={`M${x} ${y - 0.9} L${x + 0.3} ${y - 0.2} L${x + 0.9} ${y} L${x + 0.3} ${y + 0.2} L${x} ${y + 0.9} L${x - 0.3} ${y + 0.2} L${x - 0.9} ${y} L${x - 0.3} ${y - 0.2} Z`}
        fill="#f4e9c1"
      />
    ))}
  </>
)

const RainbowDecoration = () => (
  <>
    {["#e05252", "#e8974a", "#e8c34d", "#5aa469", "#4a7fc9", "#7a5ac9"].map((c, i) => (
      <path key={c} d={`M${6 + i} ${46 + i * 1.05} L${34 - i} ${46 + i * 1.05}`} stroke={c} strokeWidth={1.15} opacity={0.9} />
    ))}
    <path d="M5 46 L35 46 L32 43 L8 43 Z" fill="none" stroke="#3d3d3d" strokeWidth={1.8} />
  </>
)

const CrystalDecoration = () => (
  <>
    {[[9, 44, 20, 47], [20, 47, 31, 44], [9, 44, 15, 50], [31, 44, 25, 50], [15, 50, 25, 50]].map(([x1, y1, x2, y2], i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff" strokeWidth={0.6} opacity={0.7} />
    ))}
    <path d="M11 45.5 L15 44 L13 48 Z" fill="#ffffff" opacity={0.55} />
  </>
)

const SweetheartDecoration = () => (
  <>
    {[8, 12, 16, 20, 24, 28, 32].map((x) => (
      <circle key={x} cx={x} cy={41} r={2} fill="#f3c8d6" stroke="#3d3d3d" strokeWidth={1} />
    ))}
    {[[13, 47], [27, 47.5]].map(([x, y], i) => (
      <path
        key={i}
        d={`M${x} ${y - 1} C${x - 1.3} ${y - 1.9} ${x - 2} ${y - 0.4} ${x} ${y + 1} C${x + 2} ${y - 0.4} ${x + 1.3} ${y - 1.9} ${x} ${y - 1} Z`}
        fill="#e0678e"
        opacity={0.85}
      />
    ))}
  </>
)

const LaurelDecoration = () => (
  <>
    {[-1, 1].map((side) =>
      Array.from({ length: 4 }, (_, i) => {
        const x = 20 + side * (2.5 + i * 1.6)
        const y = 40.5 + i * 0.35
        return (
          <ellipse
            key={`${side}-${i}`}
            cx={x}
            cy={y}
            rx={1.4}
            ry={0.7}
            fill="#4a7c3f"
            stroke="#3d3d3d"
            strokeWidth={0.5}
            transform={`rotate(${side * 35} ${x} ${y})`}
          />
        )
      })
    )}
    <path d="M18.5 40.5 L18.2 44 L20 43 L21.8 44 L21.5 40.5" fill="#c9394a" stroke="#3d3d3d" strokeWidth={0.6} />
  </>
)

const ConstellationDecoration = () => {
  const pts: [number, number][] = [[13, 46], [18, 44], [24, 45], [28, 48], [16, 49]]
  return (
    <>
      {pts.slice(0, -1).map(([x1, y1], i) => {
        const [x2, y2] = pts[i + 1]
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8ea8e8" strokeWidth={0.4} opacity={0.7} />
      })}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 1 ? 1.1 : 0.6} fill="#f4e9c1" />
      ))}
    </>
  )
}

const MosaicDecoration = () => {
  const colors = ["#e05252", "#4a7fc9", "#e8c34d", "#5aa469", "#7a5ac9"]
  const tiles: ReactNode[] = []
  let i = 0
  for (let y = 45; y <= 49; y += 2) {
    for (let x = 9; x <= 31; x += 3) {
      tiles.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={1.8} height={1.8} fill={colors[i % colors.length]} opacity={0.85} transform={`rotate(45 ${x + 0.9} ${y + 0.9})`} />
      )
      i++
    }
  }
  return (
    <>
      {tiles}
      <path d="M5 46 L35 46 L32 43 L8 43 Z" fill="none" stroke="#3d3d3d" strokeWidth={1.8} />
    </>
  )
}

const RoyalDecoration = () => (
  <>
    <path
      d="M7 41 L9.5 43.5 L12 41 L14.5 43.5 L17 41 L19.5 43.5 L20.5 43.5 L23 41 L25.5 43.5 L28 41 L30.5 43.5 L33 41"
      fill="none"
      stroke="#d4af37"
      strokeWidth={1.3}
      strokeLinejoin="round"
    />
    {[[10, 42.3, "#c9394a"], [16, 42.3, "#4a7fc9"], [24, 42.3, "#4a7fc9"], [30, 42.3, "#c9394a"]].map(([x, y, c], i) => (
      <circle key={i} cx={x as number} cy={y as number} r={0.7} fill={c as string} />
    ))}
  </>
)

const FireworkDecoration = () => {
  const rays: ReactNode[] = []
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180
    const x1 = 20 + Math.cos(rad) * 2, y1 = 46 + Math.sin(rad) * 2
    const x2 = 20 + Math.cos(rad) * 5.5, y2 = 46 + Math.sin(rad) * 5.5
    rays.push(<line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f4c542" strokeWidth={0.7} strokeLinecap="round" />)
  }
  return (
    <>
      {rays}
      {[[13, 43, "#e05252"], [27, 44, "#4a7fc9"], [16, 48.5, "#5aa469"]].map(([x, y, c], i) => (
        <circle key={i} cx={x as number} cy={y as number} r={0.6} fill={c as string} />
      ))}
    </>
  )
}

const SpecialPotDecoration = ({ style }: { style: SpecialPotStyle }) => {
  switch (style) {
    case "trophy":
      return <TrophyDecoration />
    case "starlight":
      return <StarlightDecoration />
    case "rainbow":
      return <RainbowDecoration />
    case "crystal":
      return <CrystalDecoration />
    case "sweetheart":
      return <SweetheartDecoration />
    case "laurel":
      return <LaurelDecoration />
    case "constellation":
      return <ConstellationDecoration />
    case "mosaic":
      return <MosaicDecoration />
    case "royal":
      return <RoyalDecoration />
    case "firework":
      return <FireworkDecoration />
    default:
      return null
  }
}

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
  const specialPot = variant && isSpecialPotStyle(variant.pot) ? variant.pot : null
  const potColor = active ? (specialPot ? getSpecialPotColor(specialPot) : (variant?.palette.pot ?? config.potColor)) : "#9c8b7e"
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
              {/* Special reward pot decoration — admin-granted only, never random */}
              {active && specialPot && <SpecialPotDecoration style={specialPot} />}
              {/* Cute pot face — a small constant of charm on every species, not tier-gated */}
              {active && (
                <>
                  <circle cx="17" cy="47" r="0.75" fill={outlineColor} />
                  <circle cx="23" cy="47" r="0.75" fill={outlineColor} />
                  <path d="M17.5 48.6 Q20 50 22.5 48.6" stroke={outlineColor} strokeWidth="0.7" strokeLinecap="round" fill="none" />
                  <circle cx="14.5" cy="48" r="1.3" fill="#f4a6c1" opacity={0.4} />
                  <circle cx="25.5" cy="48" r="1.3" fill="#f4a6c1" opacity={0.4} />
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
              {/* Tier 0: Dormant — plump seed in soil, shared by every species */}
              {tier === 0 && (
                <g>
                  <ellipse cx="20" cy="42" rx="3" ry="2.2" fill={stemColor} stroke={outlineColor} strokeWidth="1" />
                  <line x1="20" y1="42" x2="20" y2="40.5" stroke={outlineColor} strokeWidth="0.8" strokeLinecap="round" />
                </g>
              )}

              {tier >= 1 && (
                <SpeciesCanopy
                  species={variant?.species ?? "flower"}
                  tier={tier}
                  colors={{ stem: stemColor, leaf: leafColor, flower: flowerColor, fruit: fruitColor, glow: config.glowColor, outline: outlineColor }}
                  hasFlower={config.hasFlower}
                  hasFruit={config.hasFruit}
                />
              )}

              {/* Sparkle crown — top tier only, floats clear above the canopy */}
              {tier >= 9 && (
                <>
                  <path
                    d={`M20 ${canopyTop(tier) - 13} L20.7 ${canopyTop(tier) - 10.9} L22.8 ${canopyTop(tier) - 10.2} L20.7 ${canopyTop(tier) - 9.5} L20 ${canopyTop(tier) - 7.4} L19.3 ${canopyTop(tier) - 9.5} L17.2 ${canopyTop(tier) - 10.2} L19.3 ${canopyTop(tier) - 10.9} Z`}
                    fill={config.glowColor}
                    stroke={outlineColor}
                    strokeWidth="0.6"
                    opacity={0.95}
                  />
                  <circle cx="25" cy={canopyTop(tier) - 8.2} r="0.9" fill={config.glowColor} opacity={0.8} />
                  <circle cx="15" cy={canopyTop(tier) - 7.2} r="0.6" fill={config.glowColor} opacity={0.7} />
                </>
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
  const tier = getPlantTier(getEffectivePlantDays(displayStreak, growthPoints));
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
