export interface StreakMilestone {
  days: number
  message: string
  emoji: string
  fireIntensity: "low" | "medium" | "high"
}

export const streakMilestones: StreakMilestone[] = [
  { days: 1, message: "{days} day! You've started your streak!", emoji: "🔥", fireIntensity: "low" },
  { days: 3, message: "{days} days strong! You're warming up!", emoji: "🔥", fireIntensity: "low" },
  { days: 5, message: "{days} days! The fire is growing!", emoji: "🔥🔥", fireIntensity: "medium" },
  { days: 7, message: "{days} days! You're on fire!", emoji: "🔥🔥", fireIntensity: "medium" },
  { days: 14, message: "{days} days! You're unstoppable!", emoji: "🔥🔥🔥", fireIntensity: "high" },
  { days: 21, message: "{days} days = habit formed!", emoji: "🔥🔥🔥", fireIntensity: "high" },
  { days: 30, message: "{days} days! Legendary streak!", emoji: "🔥🔥🔥", fireIntensity: "high" },
  { days: 50, message: "{days} days! You're a reflection master!", emoji: "🔥🔥🔥", fireIntensity: "high" },
  { days: 100, message: "{days} days! Incredible dedication!", emoji: "🔥🔥🔥", fireIntensity: "high" },
]

export function getMilestoneForStreak(streak: number): StreakMilestone | null {
  for (let i = streakMilestones.length - 1; i >= 0; i--) {
    if (streak >= streakMilestones[i].days) {
      return {
        ...streakMilestones[i],
        message: streakMilestones[i].message.replace("{days}", String(streak)),
      }
    }
  }
  return null
}

export function getPreviousMilestone(streak: number): StreakMilestone | null {
  const currentMilestone = getMilestoneForStreak(streak)
  const currentIndex = streakMilestones.findIndex(m => m.days === currentMilestone?.days)
  
  if (currentIndex > 0) {
    return streakMilestones[currentIndex - 1]
  }
  return null
}

export function isMilestoneReached(currentStreak: number, previousStreak: number): boolean {
  const currentMilestone = getMilestoneForStreak(currentStreak)
  const previousMilestone = getMilestoneForStreak(previousStreak)
  
  return currentMilestone?.days !== previousMilestone?.days
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

export type GlowStyle = "none" | "candle" | "ember" | "inferno" | "inferno-ring" | "cosmic"

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
  glowStyle: GlowStyle
}

const FLAME_TIER_CONFIGS: Record<FlameTier, FlameTierConfig> = {
  0: {
    name: "inactive",
    flameColor: "#a1a1aa",
    innerColor: "#d4d4d8",
    tipColor: "#71717a",
    glowColor: "#a1a1aa",
    strokeColor: "#52525b",
    glowStyle: "none",
    particleCount: 0,
    particleTypes: [],
    glowScale: 1,
    hasCrownTips: false,
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
    glowStyle: "candle",
  },
  2: {
    name: "ember",
    flameColor: "#ea580c",
    innerColor: "#fb923c",
    tipColor: "#dc2626",
    glowColor: "#ea580c",
    strokeColor: "#1e1e1e",
    particleCount: 5,
    particleTypes: ["star", "heart"],
    glowScale: 1.15,
    hasCrownTips: false,
    glowStyle: "ember",
  },
  3: {
    name: "blaze",
    flameColor: "#dc2626",
    innerColor: "#f87171",
    tipColor: "#b91c1c",
    glowColor: "#dc2626",
    strokeColor: "#1e1e1e",
    particleCount: 7,
    particleTypes: ["star", "heart", "swirl"],
    glowScale: 1.3,
    hasCrownTips: false,
    glowStyle: "inferno",
  },
  4: {
    name: "inferno",
    flameColor: "#be185d",
    innerColor: "#f472b6",
    tipColor: "#9d174d",
    glowColor: "#be185d",
    strokeColor: "#1e1e1e",
    particleCount: 9,
    particleTypes: ["star", "heart", "swirl", "diamond"],
    glowScale: 1.45,
    hasCrownTips: true,
    glowStyle: "inferno-ring",
  },
  5: {
    name: "legendary",
    flameColor: "#c084fc",
    innerColor: "#e9d5ff",
    tipColor: "#9333ea",
    glowColor: "#a855f7",
    strokeColor: "#1e1e1e",
    particleCount: 12,
    particleTypes: ["star", "heart", "swirl", "diamond"],
    glowScale: 1.6,
    hasCrownTips: true,
    glowStyle: "cosmic",
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

/**
 * Retrieve the visual configuration for a given flame tier.
 *
 * @param tier - Flame tier (0–5) indicating intensity level
 * @returns The FlameTierConfig associated with `tier`
 */
export function getFlameTierConfig(tier: FlameTier): FlameTierConfig {
  return FLAME_TIER_CONFIGS[tier]
}

export const streakQuotes: string[] = [
  "You showed up. That's half the battle.",
  "Consistency is quiet genius.",
  "Still going? Absolute legend.",
  "Discipline is choosing what you want most over what you want now.",
  "Growth is silent. The results are loud.",
  "You don't have to be great to start, but you have to start to be great.",
  "The secret of getting ahead is getting started. — Mark Twain",
  "Small daily improvements lead to staggering long-term results.",
  "Every reflection is a step forward.",
  "You're building something most people only talk about.",
  "Progress, not perfection.",
  "The body achieves what the mind believes.",
  "One more day in the books.",
  "We are what we repeatedly do. Excellence is not an act, but a habit. — Aristotle",
  "The unexamined life is not worth living. — Socrates",
  "It is not that we have a short time to live, but that we waste a great deal of it. — Seneca",
  "He who fears he shall suffer, already suffers what he fears. — Montaigne",
  "The only true wisdom is in knowing you know nothing. — Socrates",
  "What we do now echoes in eternity. — Marcus Aurelius",
  "Waste no more time arguing about what a good person should be. Be one. — Marcus Aurelius",
  "First say to yourself what you would be; and then do what you have to do. — Epictetus",
  "Hey, you're back! Let's keep this going.",
  "Look at you, still showing up.",
  "Another day, another win.",
  "This streak is getting impressive.",
  "Future you will be grateful.",
  "Day by day. Nothing can stop you.",
  "You're on a roll. Don't stop now.",
  "Proud of you for sticking with this.",
]

/**
 * Selects a random motivational streak quote.
 *
 * @returns A randomly chosen string from `streakQuotes`.
 */
export function getRandomStreakQuote(): string {
  return streakQuotes[Math.floor(Math.random() * streakQuotes.length)]
}
