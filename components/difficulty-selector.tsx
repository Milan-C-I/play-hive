"use client"
import { Card, CardContent } from "@/components/ui/card"

export type Difficulty = "easy" | "medium" | "hard"

interface DifficultySelectorProps {
  selected: Difficulty
  onSelect: (difficulty: Difficulty) => void
  className?: string
}

const difficulties = [
  { value: "easy" as const, label: "Easy", color: "text-green-400", description: "Relaxed pace" },
  { value: "medium" as const, label: "Medium", color: "text-orange-400", description: "Balanced challenge" },
  { value: "hard" as const, label: "Hard", color: "text-red-600", description: "Expert level" },
]

export function DifficultySelector({ selected, onSelect, className = "" }: DifficultySelectorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-serif text-lg text-center text-foreground">Choose Difficulty</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {difficulties.map((difficulty) => (
          <Card
            key={difficulty.value}
            className={`cursor-pointer transition-all duration-200 ${
              selected === difficulty.value
                ? "border-primary bg-primary/10"
                : "border-primary/20 hover:border-primary/40"
            }`}
            onClick={() => onSelect(difficulty.value)}
          >
            <CardContent className="p-4 text-center">
              <div className={`font-bold text-lg ${difficulty.color}`}>{difficulty.label}</div>
              <div className="text-sm text-muted-foreground mt-1">{difficulty.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
