"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Plus, CheckCircle } from "lucide-react"

interface ReflectionButtonProps {
  hasSubmittedToday: boolean
  isSubmitting: boolean
  onClick: () => void
  submittedTime?: string
}

export function ReflectionButton({
  hasSubmittedToday,
  isSubmitting,
  onClick,
  submittedTime,
}: ReflectionButtonProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return "Good Morning"
    if (hour >= 12 && hour < 17) return "Good Afternoon"
    if (hour >= 17 && hour < 21) return "Good Evening"
    return "Good Night"
  }

  if (hasSubmittedToday) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="font-medium text-green-600 dark:text-green-400">
            Reflection Completed
          </span>
        </div>
        {submittedTime && (
          <span className="text-sm text-muted-foreground">
            Submitted at {submittedTime}
          </span>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        size="lg"
        onClick={onClick}
        disabled={isSubmitting}
        className="relative px-8 py-6 text-lg font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
      >
        {isSubmitting ? (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="h-5 w-5 rounded-full border-2 border-t-transparent border-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span>Submitting...</span>
          </motion.div>
        ) : (
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            <span>{getGreeting()}! Add Today's Reflection</span>
          </div>
        )}
      </Button>
    </motion.div>
  )
}
