export interface StreakMilestone {
  days: number
  message: string
  emoji: string
  fireIntensity: "low" | "medium" | "high"
}

export const streakMilestones: StreakMilestone[] = [
  { days: 1, message: "You've started your streak!", emoji: "🔥", fireIntensity: "low" },
  { days: 3, message: "3 days strong! You're warming up!", emoji: "🔥", fireIntensity: "low" },
  { days: 5, message: "5 days! The fire is growing!", emoji: "🔥🔥", fireIntensity: "medium" },
  { days: 7, message: "One week strong! You're on fire!", emoji: "🔥🔥", fireIntensity: "medium" },
  { days: 14, message: "Two weeks! You're unstoppable!", emoji: "🔥🔥🔥", fireIntensity: "high" },
  { days: 21, message: "21 days = habit formed!", emoji: "🔥🔥🔥", fireIntensity: "high" },
  { days: 30, message: "30 days! Legendary streak!", emoji: "🔥🔥🔥", fireIntensity: "high" },
  { days: 50, message: "50 days! You're a reflection master!", emoji: "🔥🔥🔥", fireIntensity: "high" },
  { days: 100, message: "100 days! Incredible dedication!", emoji: "🔥🔥🔥", fireIntensity: "high" },
]

export function getMilestoneForStreak(streak: number): StreakMilestone | null {
  for (let i = streakMilestones.length - 1; i >= 0; i--) {
    if (streak >= streakMilestones[i].days) {
      return streakMilestones[i]
    }
  }
  return null
}

export function getPreviousMilestone(streak: number): StreakMilestone | null {
  const currentMilestone = getMilestoneForStreak(streak)
  const currentIndex = streakMilestones.findIndex(m => m === currentMilestone)
  
  if (currentIndex > 0) {
    return streakMilestones[currentIndex - 1]
  }
  return null
}

export function isMilestoneReached(currentStreak: number, previousStreak: number): boolean {
  const currentMilestone = getMilestoneForStreak(currentStreak)
  const previousMilestone = getMilestoneForStreak(previousStreak)
  
  return currentMilestone !== previousMilestone
}

export const comfortZoneMessages = {
  rest: [
    "It's okay to rest. Your comfort zone is always here. 🐱",
    "Taking a break is part of the journey. 🐱",
    "Rest today, shine tomorrow. 🐱",
  ],
  comeback: [
    "Welcome back! Every new day is a chance to grow. 🐱",
    "You're back! Let's make today count. 🐱",
    "Fresh start! Your comfort zone missed you. 🐱",
  ],
  gentle: [
    "No pressure. We all have off days. 🐱",
    "Be kind to yourself. Growth isn't linear. 🐱",
    "Your comfort zone is here when you need it. 🐱",
  ],
}

export function getRandomComfortMessage(type: keyof typeof comfortZoneMessages): string {
  const messages = comfortZoneMessages[type]
  return messages[Math.floor(Math.random() * messages.length)]
}

export type FlameTier = 0 | 1 | 2 | 3 | 4 | 5

export interface FlameTierConfig {
  name: string
  flameColor: string
  innerColor: string
  tipColor: string
  glowColor: string
  strokeColor: string
  particleCount: number
  particleTypes: Array<"star" | "heart" | "swirl" | "diamond">
  glowScale: number
  hasCrownTips: boolean
  hasColorShift: boolean
  hasRing: boolean
}

const FLAME_TIER_CONFIGS: Record<FlameTier, FlameTierConfig> = {
  0: {
    name: "inactive",
    flameColor: "#a1a1aa",
    innerColor: "#d4d4d8",
    tipColor: "#71717a",
    glowColor: "#a1a1aa",
    strokeColor: "#52525b",
    particleCount: 0,
    particleTypes: [],
    glowScale: 1,
    hasCrownTips: false,
    hasColorShift: false,
    hasRing: false,
  },
  1: {
    name: "spark",
    flameColor: "#f97316",
    innerColor: "#fbbf24",
    tipColor: "#ef4444",
    glowColor: "#f97316",
    strokeColor: "#1e1e1e",
    particleCount: 3,
    particleTypes: ["star"],
    glowScale: 1,
    hasCrownTips: false,
    hasColorShift: false,
    hasRing: false,
  },
  2: {
    name: "ember",
    flameColor: "#10b981",
    innerColor: "#34d399",
    tipColor: "#06b6d4",
    glowColor: "#10b981",
    strokeColor: "#1e1e1e",
    particleCount: 4,
    particleTypes: ["star", "heart"],
    glowScale: 1.1,
    hasCrownTips: false,
    hasColorShift: false,
    hasRing: false,
  },
  3: {
    name: "blaze",
    flameColor: "#6366f1",
    innerColor: "#818cf8",
    tipColor: "#3b82f6",
    glowColor: "#6366f1",
    strokeColor: "#1e1e1e",
    particleCount: 5,
    particleTypes: ["star", "heart", "swirl"],
    glowScale: 1.2,
    hasCrownTips: false,
    hasColorShift: false,
    hasRing: false,
  },
  4: {
    name: "inferno",
    flameColor: "#a855f7",
    innerColor: "#c084fc",
    tipColor: "#ec4899",
    glowColor: "#a855f7",
    strokeColor: "#1e1e1e",
    particleCount: 7,
    particleTypes: ["star", "heart", "swirl", "diamond"],
    glowScale: 1.3,
    hasCrownTips: true,
    hasColorShift: false,
    hasRing: true,
  },
  5: {
    name: "legendary",
    flameColor: "#eab308",
    innerColor: "#fde047",
    tipColor: "#f59e0b",
    glowColor: "#eab308",
    strokeColor: "#1e1e1e",
    particleCount: 10,
    particleTypes: ["star", "heart", "swirl", "diamond"],
    glowScale: 1.5,
    hasCrownTips: true,
    hasColorShift: true,
    hasRing: true,
  },
}

export function getFlameTier(streak: number): FlameTier {
  if (streak >= 50) return 5
  if (streak >= 30) return 4
  if (streak >= 20) return 3
  if (streak >= 10) return 2
  if (streak >= 1) return 1
  return 0
}

export function getFlameTierConfig(tier: FlameTier): FlameTierConfig {
  return FLAME_TIER_CONFIGS[tier]
}
