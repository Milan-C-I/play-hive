"use client"

import { useEffect, useState } from "react"

interface LoadingScreenProps {
  isLoading: boolean
  gameName: string
}

export function LoadingScreen({ isLoading, gameName }: LoadingScreenProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-foreground">Loading {gameName}</h2>
          <p className="text-muted-foreground font-mono">
            Initializing game{dots}
            <span className="opacity-0">{".".repeat(3 - dots.length)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
