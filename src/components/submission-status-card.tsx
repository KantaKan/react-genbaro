"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, Calendar } from "lucide-react"

interface SubmissionStatusCardProps {
  hasSubmitted: boolean
  submissionDate?: string | null
  todaysReflection?: any
}

export const SubmissionStatusCard = ({ hasSubmitted, submissionDate, todaysReflection }: SubmissionStatusCardProps) => {
  if (!hasSubmitted) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="h-6 w-6 text-green-600" />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800">Reflection Completed!</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-green-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Today</span>
                </div>
                {todaysReflection && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(todaysReflection.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              className="text-2xl"
            >
              🎉
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
