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
      className="mb-8"
    >
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="h-7 w-7 text-amber-600" />
            </motion.div>
            <div className="flex-1">
              <h3 
                className="font-semibold text-amber-800 dark:text-amber-200 text-lg"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Reflection Completed
              </h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-amber-600 dark:text-amber-400">
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
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              className="text-3xl"
            >
              ✦
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
