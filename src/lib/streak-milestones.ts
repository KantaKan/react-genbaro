export interface StreakMilestone {
  days: number
  message: string
  emoji: string
  growthStage: "dormant" | "sprout" | "seedling" | "growing" | "blooming" | "fruitful"
}

export const streakMilestones: StreakMilestone[] = [
  { days: 1, message: "{days} day! A tiny sprout appears!", emoji: "🌱", growthStage: "sprout" },
  { days: 3, message: "{days} days strong! Growing steady!", emoji: "🌱", growthStage: "sprout" },
  { days: 5, message: "{days} days! Your plant is putting out new leaves!", emoji: "🌿", growthStage: "seedling" },
  { days: 7, message: "{days} days! A whole week of growth!", emoji: "🌿", growthStage: "seedling" },
  { days: 14, message: "{days} days! A real garden is forming!", emoji: "🌳", growthStage: "growing" },
  { days: 21, message: "{days} days = habit blossoming!", emoji: "🌸", growthStage: "blooming" },
  { days: 30, message: "{days} days! In full bloom!", emoji: "🌸", growthStage: "blooming" },
  { days: 50, message: "{days} days! Bearing fruit!", emoji: "🍊", growthStage: "fruitful" },
  { days: 100, message: "{days} days! A magnificent harvest!", emoji: "🍊", growthStage: "fruitful" },
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
    "Even gardens need fallow seasons. 🐱",
    "Let the soil rest before the next planting. 🐱",
  ],
  comeback: [
    "Welcome back! Every new day is a chance to grow. 🐱",
    "You're back! Let's make today count. 🐱",
    "Fresh start! Your comfort zone missed you. 🐱",
    "New season, new growth. Let's go! 🐱",
    "The seed is still there. Water it today. 🐱",
  ],
  gentle: [
    "No pressure. We all have off days. 🐱",
    "Be kind to yourself. Growth isn't linear. 🐱",
    "Your comfort zone is here when you need it. 🐱",
    "Some days are for resting the soil. 🐱",
    "Even perennials go dormant. You'll bloom again. 🐱",
  ],
}

export function getRandomComfortMessage(type: keyof typeof comfortZoneMessages): string {
  const messages = comfortZoneMessages[type]
  return messages[Math.floor(Math.random() * messages.length)]
}

export type PlantTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type GrowthGlowStyle = "none" | "glow" | "radiant" | "bloom" | "bloom-ring" | "aurora"

export interface PlantTierConfig {
  name: string
  stemColor: string
  leafColor: string
  flowerColor: string
  fruitColor: string
  glowColor: string
  soilColor: string
  potColor: string
  particleCount: number
  particleTypes: Array<"petal" | "pollen" | "leaf" | "light">
  glowScale: number
  hasFlower: boolean
  hasFruit: boolean
  growthGlow: GrowthGlowStyle
}

const PLANT_TIER_CONFIGS: Record<PlantTier, PlantTierConfig> = {
  0: {
    name: "dormant",
    stemColor: "#a1a1aa",
    leafColor: "#d4d4d8",
    flowerColor: "#71717a",
    fruitColor: "#71717a",
    glowColor: "#a1a1aa",
    soilColor: "#6b5b4e",
    potColor: "#9c8b7e",
    particleCount: 0,
    particleTypes: [],
    glowScale: 1,
    hasFlower: false,
    hasFruit: false,
    growthGlow: "none",
  },
  1: {
    name: "sprout",
    stemColor: "#b9dab9",
    leafColor: "#d3ecd4",
    flowerColor: "#e8f5e9",
    fruitColor: "#b9dab9",
    glowColor: "#a5d6a7",
    soilColor: "#5c4033",
    potColor: "#c77d61",
    particleCount: 2,
    particleTypes: ["pollen"],
    glowScale: 1,
    hasFlower: false,
    hasFruit: false,
    growthGlow: "glow",
  },
  2: {
    name: "sprouting",
    stemColor: "#a5d6a7",
    leafColor: "#c8e6c9",
    flowerColor: "#e8f5e9",
    fruitColor: "#a5d6a7",
    glowColor: "#8fd08f",
    soilColor: "#5c4033",
    potColor: "#c77d61",
    particleCount: 3,
    particleTypes: ["pollen"],
    glowScale: 1.05,
    hasFlower: false,
    hasFruit: false,
    growthGlow: "glow",
  },
  3: {
    name: "seedling",
    stemColor: "#8bc98f",
    leafColor: "#b7ddb9",
    flowerColor: "#dcedc8",
    fruitColor: "#8bc98f",
    glowColor: "#7cc97f",
    soilColor: "#5c4033",
    potColor: "#c77d61",
    particleCount: 5,
    particleTypes: ["pollen", "leaf"],
    glowScale: 1.1,
    hasFlower: false,
    hasFruit: false,
    growthGlow: "glow",
  },
  4: {
    name: "budding",
    stemColor: "#74bc79",
    leafColor: "#9ed3a1",
    flowerColor: "#dcedc8",
    fruitColor: "#74bc79",
    glowColor: "#66bb6a",
    soilColor: "#5c4033",
    potColor: "#c77d61",
    particleCount: 6,
    particleTypes: ["pollen", "leaf"],
    glowScale: 1.15,
    hasFlower: false,
    hasFruit: false,
    growthGlow: "radiant",
  },
  5: {
    name: "growing",
    stemColor: "#66bb6a",
    leafColor: "#8fc793",
    flowerColor: "#c8e6c9",
    fruitColor: "#66bb6a",
    glowColor: "#57b25c",
    soilColor: "#5c4033",
    potColor: "#c77d61",
    particleCount: 8,
    particleTypes: ["pollen", "leaf"],
    glowScale: 1.2,
    hasFlower: false,
    hasFruit: false,
    growthGlow: "radiant",
  },
  6: {
    name: "flourishing",
    stemColor: "#52a855",
    leafColor: "#7cba80",
    flowerColor: "#f8bbd0",
    fruitColor: "#52a855",
    glowColor: "#4caf50",
    soilColor: "#5c4033",
    potColor: "#c77d61",
    particleCount: 9,
    particleTypes: ["pollen", "leaf", "petal"],
    glowScale: 1.3,
    hasFlower: true,
    hasFruit: false,
    growthGlow: "radiant",
  },
  7: {
    name: "blooming",
    stemColor: "#43a047",
    leafColor: "#66bb6a",
    flowerColor: "#f48fb1",
    fruitColor: "#66bb6a",
    glowColor: "#43a047",
    soilColor: "#5c4033",
    potColor: "#b56a4e",
    particleCount: 11,
    particleTypes: ["pollen", "leaf", "petal"],
    glowScale: 1.4,
    hasFlower: true,
    hasFruit: false,
    growthGlow: "bloom",
  },
  8: {
    name: "fruitful",
    stemColor: "#2e7d32",
    leafColor: "#43a047",
    flowerColor: "#f48fb1",
    fruitColor: "#e9c46a",
    glowColor: "#e9c46a",
    soilColor: "#5c4033",
    potColor: "#b56a4e",
    particleCount: 13,
    particleTypes: ["pollen", "leaf", "petal", "light"],
    glowScale: 1.5,
    hasFlower: true,
    hasFruit: true,
    growthGlow: "bloom",
  },
  9: {
    name: "bountiful",
    stemColor: "#1b5e20",
    leafColor: "#2e7d32",
    flowerColor: "#f06292",
    fruitColor: "#ffd700",
    glowColor: "#ffd700",
    soilColor: "#5c4033",
    potColor: "#b56a4e",
    particleCount: 16,
    particleTypes: ["pollen", "leaf", "petal", "light"],
    glowScale: 1.65,
    hasFlower: true,
    hasFruit: true,
    growthGlow: "aurora",
  },
}

// Denser early tiers (streaks under 30 days flip stages every few days) plus
// extended late tiers (up to 100 days) so long streaks keep visibly evolving.
const TIER_DAY_BOUNDARIES: Record<PlantTier, number> = { 0: 0, 1: 1, 2: 3, 3: 7, 4: 14, 5: 21, 6: 30, 7: 50, 8: 75, 9: 100 }

export function getPlantTier(streak: number): PlantTier {
  const tiers: PlantTier[] = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  for (const tier of tiers) {
    if (streak >= TIER_DAY_BOUNDARIES[tier]) return tier
  }
  return 0
}

// ponytail: mirrors backend FeedPointsPerFertilizer (fertilizer_service.go) — keep in sync
const GROWTH_POINTS_PER_DAY = 10

// Feeding the plant adds growth points; every GROWTH_POINTS_PER_DAY counts as one
// extra "day" toward the same tier thresholds streak days use.
export function getEffectivePlantDays(streak: number, growthPoints: number): number {
  return streak + Math.floor(growthPoints / GROWTH_POINTS_PER_DAY)
}

export function getTierDayThreshold(tier: PlantTier): number {
  return TIER_DAY_BOUNDARIES[tier]
}

export type FlourishTier = 0 | 1 | 2 | 3

const FLOURISH_THRESHOLDS: Record<FlourishTier, number> = { 0: 0, 1: 50, 2: 150, 3: 300 }
export const flourishAccentColors: Record<FlourishTier, string> = {
  0: "",
  1: "#CD7F32", // bronze
  2: "#C0C0C0", // silver
  3: "#FFD700", // gold
}

export function getFlourishTier(growthPoints: number): FlourishTier {
  if (growthPoints >= FLOURISH_THRESHOLDS[3]) return 3
  if (growthPoints >= FLOURISH_THRESHOLDS[2]) return 2
  if (growthPoints >= FLOURISH_THRESHOLDS[1]) return 1
  return 0
}

export function getNextTierProgress(streak: number, growthPoints = 0): { current: number; max: number; isMaxTier: boolean } {
  const days = getEffectivePlantDays(streak, growthPoints)
  const tier = getPlantTier(days)
  if (tier === 9) return { current: days, max: days, isMaxTier: true }
  const next = TIER_DAY_BOUNDARIES[(tier + 1) as PlantTier]
  const prev = TIER_DAY_BOUNDARIES[tier]
  return { current: days - prev, max: next - prev, isMaxTier: false }
}

export function getPlantTierConfig(tier: PlantTier): PlantTierConfig {
  return PLANT_TIER_CONFIGS[tier]
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
  "Keep watering that garden.",
  "Growth takes time. You're doing it.",
  "Nurture your practice like a garden.",
]

export function getRandomStreakQuote(): string {
  return streakQuotes[Math.floor(Math.random() * streakQuotes.length)]
}
