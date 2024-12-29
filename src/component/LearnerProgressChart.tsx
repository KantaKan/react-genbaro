import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { generateMockData, DailyReflection } from '@/lib/mockData'
import { format, parseISO } from 'date-fns'

const VIEW_OPTIONS = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

const BAROMETER_LEVELS = [
  'Comfort Zone',
  'Stretch zone- enjoying the challenges',
  'Stretch zone- overwhelmed',
  'Panic Zone',
]

interface ChartData {
  date: string
  barometerLevel: number
}

const processData = (data: DailyReflection[]): ChartData[] => {
  return data.map(item => ({
    date: format(parseISO(item.date), 'MMM dd'),
    barometerLevel: BAROMETER_LEVELS.indexOf(item.reflection.barometer) + 1,
  }))
}

export default function LearnerProgressChart() {
  const [viewOption, setViewOption] = useState<'week' | 'month'>('week')
  
  const chartData = useMemo(() => {
    const days = viewOption === 'week' ? 7 : 30
    const mockData = generateMockData(days)
    return processData(mockData.reverse())
  }, [viewOption])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Learner Progress</CardTitle>
          <Select value={viewOption} onValueChange={(value: 'week' | 'month') => setViewOption(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              {VIEW_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[1, 4]} ticks={[1, 2, 3, 4]} tickFormatter={(value) => BAROMETER_LEVELS[value - 1]} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border p-2 rounded-md shadow-md">
                        <p className="font-bold">{label}</p>
                        <p>{BAROMETER_LEVELS[payload[0].value - 1]}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line type="monotone" dataKey="barometerLevel" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

