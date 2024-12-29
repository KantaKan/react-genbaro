import { subDays, format } from 'date-fns'

export interface DailyReflection {
  day: string
  user_id: string
  date: string
  reflection: {
    tech_sessions: {
      session_name: string[]
      happy: string
      improve: string
    }
    non_tech_sessions: {
      session_name: string[]
      happy: string
      improve: string
    }
    barometer: string
  }
}

const barometerLevels = [
  'Comfort Zone',
  'Stretch zone- enjoying the challenges',
  'Stretch zone- overwhelmed',
  'Panic Zone'
]

export function generateMockData(days: number): DailyReflection[] {
  const today = new Date()
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(today, i)
    return {
      day: format(date, 'yyyy-MM-dd'),
      user_id: '6770d8371d8497fe79a2332c',
      date: date.toISOString(),
      reflection: {
        tech_sessions: {
          session_name: ['Mock Tech Session 1', 'Mock Tech Session 2'],
          happy: 'Mock tech happy reflection',
          improve: 'Mock tech improve reflection'
        },
        non_tech_sessions: {
          session_name: ['Mock Non-Tech Session 1', 'Mock Non-Tech Session 2'],
          happy: 'Mock non-tech happy reflection',
          improve: 'Mock non-tech improve reflection'
        },
        barometer: barometerLevels[Math.floor(Math.random() * barometerLevels.length)]
      }
    }
  })
}

