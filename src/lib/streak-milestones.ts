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
