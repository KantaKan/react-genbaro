"use client"

import { useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import type { ReflectionZone } from "./reflection-zones"

const pulseAnimation = {
  "0%": { boxShadow: "0 0 0 0 rgba(var(--primary), 0.7)" },
  "70%": { boxShadow: "0 0 0 10px rgba(var(--primary), 0)" },
  "100%": { boxShadow: "0 0 0 0 rgba(var(--primary), 0)" },
}

interface BarometerVisualProps {
  zone: ReflectionZone
  isCurrent?: boolean
}

export const BarometerVisual = ({ zone, isCurrent = false }: BarometerVisualProps) => {
  const controls = useAnimation()

  useEffect(() => {
    controls.start({
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      },
    })
  }, [controls])

  return (
    <motion.div
      className={`flex items-center gap-2 p-2 rounded-md ${zone.bgColor} bg-opacity-20 transition-all duration-300 ${
        isCurrent ? "ring-2 ring-primary ring-opacity-50" : ""
      }`}
      animate={controls}
      whileHover={{
        scale: 1.1,
        backgroundColor: `var(--${zone.bgColor.replace("bg-", "")})`,
        backgroundOpacity: 0.3,
      }}
      style={isCurrent ? { animation: `${pulseAnimation} 2s infinite` } : {}}
    >
      <motion.span
        className="text-xl"
        animate={{
          rotate: [0, 10, 0, -10, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
        }}
      >
        {zone.emoji}
      </motion.span>
      <span className="font-medium text-sm">{zone.label}</span>
    </motion.div>
  )
}
