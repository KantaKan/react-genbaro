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

export type PlantTier = 0 | 1 | 2 | 3 | 4 | 5

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
    stemColor: "#a5d6a7",
    leafColor: "#c8e6c9",
    flowerColor: "#e8f5e9",
    fruitColor: "#a5d6a7",
    glowColor: "#a5d6a7",
    soilColor: "#5c4033",
    potColor: "#c77d61",
    particleCount: 3,
    particleTypes: ["pollen"],
    glowScale: 1,
    hasFlower: false,
    hasFruit: false,
    growthGlow: "glow",
  },
  2: {
    name: "seedling",
    stemColor: "#66bb6a",
    leafColor: "#81c784",
    flowerColor: "#a5d6a7",
    fruitColor: "#66bb6a",
    glowColor: "#66bb6a",
    soilColor: "#5c4033",
    potColor: "#c77d61",
    particleCount: 5,
    particleTypes: ["pollen", "leaf"],
    glowScale: 1.15,
    hasFlower: false,
    hasFruit: false,
    growthGlow: "glow",
  },
  3: {
    name: "growing",
    stemColor: "#43a047",
    leafColor: "#66bb6a",
    flowerColor: "#f8bbd0",
    fruitColor: "#66bb6a",
    glowColor: "#43a047",
    soilColor: "#5c4033",
    potColor: "#c77d61",
    particleCount: 7,
    particleTypes: ["pollen", "leaf", "petal"],
    glowScale: 1.3,
    hasFlower: true,
    hasFruit: false,
    growthGlow: "radiant",
  },
  4: {
    name: "blooming",
    stemColor: "#2e7d32",
    leafColor: "#43a047",
    flowerColor: "#f48fb1",
    fruitColor: "#43a047",
    glowColor: "#2e7d32",
    soilColor: "#5c4033",
    potColor: "#b56a4e",
    particleCount: 9,
    particleTypes: ["pollen", "leaf", "petal", "light"],
    glowScale: 1.45,
    hasFlower: true,
    hasFruit: false,
    growthGlow: "bloom",
  },
  5: {
    name: "fruitful",
    stemColor: "#1b5e20",
    leafColor: "#2e7d32",
    flowerColor: "#f48fb1",
    fruitColor: "#e9c46a",
    glowColor: "#e9c46a",
    soilColor: "#5c4033",
    potColor: "#b56a4e",
    particleCount: 12,
    particleTypes: ["pollen", "leaf", "petal", "light"],
    glowScale: 1.6,
    hasFlower: true,
    hasFruit: true,
    growthGlow: "aurora",
  },
}

export function getPlantTier(streak: number): PlantTier {
  if (streak >= 50) return 5
  if (streak >= 30) return 4
  if (streak >= 20) return 3
  if (streak >= 10) return 2
  if (streak >= 1) return 1
  return 0
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
