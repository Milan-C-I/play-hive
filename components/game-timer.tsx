"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface GameTimerProps {
  isRunning: boolean
  onTimeUpdate?: (time: number) => void
  initialTime?: number
  className?: string
}

export function GameTimer({ isRunning, onTimeUpdate, initialTime = 0, className = "" }: GameTimerProps) {
  const [time, setTime] = useState(initialTime)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  useEffect(() => {
    if (time > initialTime) {
      onTimeUpdate?.(time)
    }
  }, [time, onTimeUpdate, initialTime])

  useEffect(() => {
    setTime(initialTime)
  }, [initialTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="w-4 h-4 text-primary" />
      <span className="text-lg font-mono text-foreground">{formatTime(time)}</span>
    </div>
  )
}
