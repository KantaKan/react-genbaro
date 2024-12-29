"use client"

import React from 'react'
import { ResponsiveHeatMap } from '@nivo/heatmap'

// This is a simplified version. You'll need to process your actual data.
const data = [
  {
    "user": "User 1",
    "2024-01-01": 2,
    "2024-01-02": 3,
    // ... more dates
  },
  // ... more users
]

export function EngagementHeatmap() {
  return (
    <div style={{ height: '400px', width: '100%' }}>
      <ResponsiveHeatMap
        data={data}
        margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
        valueFormat=">-.2s"
        axisTop={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -90,
          legend: '',
          legendOffset: 46
        }}
        axisRight={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'user',
          legendPosition: 'middle',
          legendOffset: 70
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'user',
          legendPosition: 'middle',
          legendOffset: -72
        }}
        colors={{
          type: 'sequential',
          scheme: 'blues'
        }}
        emptyColor="#555555"
        legends={[
          {
            anchor: 'bottom',
            translateX: 0,
            translateY: 30,
            length: 400,
            thickness: 8,
            direction: 'row',
            tickPosition: 'after',
            tickSize: 3,
            tickSpacing: 4,
            tickOverlap: false,
            tickFormat: '>-.2s',
            title: 'Engagement Level →',
            titleAlign: 'start',
            titleOffset: 4
          }
        ]}
      />
    </div>
  )
}

