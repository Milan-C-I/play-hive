"use client"

import type React from "react"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Brain, Hash, Type, Keyboard, Zap, Bomb, Building2, Square, Music, User } from "lucide-react"

interface GameCardProps {
  title: string
  description: string
  href: string
  icon: string
  difficulty?: "Easy" | "Medium" | "Hard"
  bestScore?: string
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "🧠": Brain,
  "🔢": Hash,
  "📝": Type,
  "⌨️": Keyboard,
  "🐍": Zap,
  "💣": Bomb,
  "🏗️": Building2,
  "🧱": Square,
  "🎵": Music,
  "🏃": User,
}

export function GameCard({ title, description, href, icon,}: GameCardProps) {
  const IconComponent = iconMap[icon] || Play

  return (
    <Card className="game-card group cursor-pointer h-full">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <IconComponent className="w-8 h-8 text-primary" />
          </div>

          <h3 className="font-bold text-xl text-card-foreground group-hover:text-primary transition-colors">{title}</h3>

          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

          <div className="flex items-center justify-between w-full text-xs">
          </div>

          <Link href={href} className="w-full cursor-pointer">
            <Button className="w-full bg-primary hover:bg-green-400 text-primary-foreground transition-colors cursor-pointer">
              <Play className="w-4 h-4 mr-2" />
              Play Now
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
