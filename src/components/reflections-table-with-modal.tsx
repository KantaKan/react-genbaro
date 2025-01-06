'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import FeedbackForm from './feedback-form'

// Define the reflection zone colors
const reflectionZones = [
  {
    id: "comfort",
    label: "Comfort Zone",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  {
    id: "stretch-enjoying",
    label: "Stretch zone- enjoying the challenges",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  {
    id: "stretch-overwhelmed",
    label: "Stretch zone- overwhelmed",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    id: "panic",
    label: "Panic Zone",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
]

// Define the structure of a reflection
interface Reflection {
  genmateId: number
  date: string
  reflection: {
    tech_sessions: {
      happy: string
      improve: string
    }
    non_tech_sessions: {
      happy: string
      improve: string
    }
    barometer: string
  }
}

// Function to get color based on barometer reading
const getColorForBarometer = (barometer: string) => {
  const zone = reflectionZones.find(zone => zone.label === barometer)
  return zone ? `${zone.color} ${zone.bgColor}` : ''
}

// Sample data (you would replace this with your actual data)
const generateSampleData = (): Reflection[] => {
  const reflections: Reflection[] = []
  for (let i = 1; i <= 40; i++) {
    reflections.push({
      genmateId: i,
      date: new Date(2024, 0, i).toISOString(),
      reflection: {
        tech_sessions: {
          happy: `Tech happy ${i}`,
          improve: `Tech improve ${i}`
        },
        non_tech_sessions: {
          happy: `Non-tech happy ${i}`,
          improve: `Non-tech improve ${i}`
        },
        barometer: reflectionZones[Math.floor(Math.random() * reflectionZones.length)].label
      }
    })
  }
  return reflections
}

export default function ReflectionsTableWithModal() {
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<{ key: keyof Reflection, direction: 'ascending' | 'descending' }>({ key: 'date', direction: 'descending' })
  const [reflections, setReflections] = useState<Reflection[]>(generateSampleData())

  const toggleColumn = (columnId: string) => {
    setHiddenColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    )
  }

  const sortedReflections = useMemo(() => {
    const sortableReflections = [...reflections]
    sortableReflections.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1
      }
      return 0
    })
    return sortableReflections
  }, [reflections, sortConfig])

  const requestSort = (key: keyof Reflection) => {
    let direction: 'ascending' | 'descending' = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  const addReflection = (newReflection: Reflection) => {
    setReflections(prev => [...prev, newReflection])
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {['genmateId', 'Date', 'Tech Happy', 'Tech Improve', 'Non-Tech Happy', 'Non-Tech Improve', 'Barometer'].map((column) => (
              <DropdownMenuCheckboxItem
                key={column}
                className="capitalize"
                checked={!hiddenColumns.includes(column)}
                onCheckedChange={() => toggleColumn(column)}
              >
                {column}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Reflection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[70vw] w-[70vw] h-[70vh] overflow-y-auto" style={{ 
            position: 'fixed', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)' 
          }}>
            <FeedbackForm onSubmit={addReflection} />
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {!hiddenColumns.includes('genmateId') && (
              <TableHead className="w-[100px]">
                <Button variant="ghost" onClick={() => requestSort('genmateId')}>
                  Genmate ID
                  {sortConfig.key === 'genmateId' && (sortConfig.direction === 'ascending' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                </Button>
              </TableHead>
            )}
            {!hiddenColumns.includes('Date') && (
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('date')}>
                  Date
                  {sortConfig.key === 'date' && (sortConfig.direction === 'ascending' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />)}
                </Button>
              </TableHead>
            )}
            {!hiddenColumns.includes('Tech Happy') && <TableHead>Tech Happy</TableHead>}
            {!hiddenColumns.includes('Tech Improve') && <TableHead>Tech Improve</TableHead>}
            {!hiddenColumns.includes('Non-Tech Happy') && <TableHead>Non-Tech Happy</TableHead>}
            {!hiddenColumns.includes('Non-Tech Improve') && <TableHead>Non-Tech Improve</TableHead>}
            {!hiddenColumns.includes('Barometer') && <TableHead>Barometer</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReflections.map((reflection) => (
            <TableRow key={reflection.genmateId} className={getColorForBarometer(reflection.reflection.barometer)}>
              {!hiddenColumns.includes('genmateId') && <TableCell className="font-medium">{reflection.genmateId}</TableCell>}
              {!hiddenColumns.includes('Date') && <TableCell>{new Date(reflection.date).toLocaleDateString()}</TableCell>}
              {!hiddenColumns.includes('Tech Happy') && <TableCell>{reflection.reflection.tech_sessions.happy}</TableCell>}
              {!hiddenColumns.includes('Tech Improve') && <TableCell>{reflection.reflection.tech_sessions.improve}</TableCell>}
              {!hiddenColumns.includes('Non-Tech Happy') && <TableCell>{reflection.reflection.non_tech_sessions.happy}</TableCell>}
              {!hiddenColumns.includes('Non-Tech Improve') && <TableCell>{reflection.reflection.non_tech_sessions.improve}</TableCell>}
              {!hiddenColumns.includes('Barometer') && <TableCell>{reflection.reflection.barometer}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

