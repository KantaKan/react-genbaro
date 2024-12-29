import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateMockLearners } from '@/lib/utils'
import LearnerProgressChart from './LearnerProgressChart'

export default function CohortProgress() {
  const learners = generateMockLearners(40)

  return (
    <div className="space-y-6">
      <LearnerProgressChart />
      <Card>
        <CardHeader>
          <CardTitle>Cohort Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {learners.map((learner) => (
              <div key={learner.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{learner.name}</h3>
                <p>Progress: {learner.progress}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

