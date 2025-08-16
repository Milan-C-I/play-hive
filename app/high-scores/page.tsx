"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Award } from "lucide-react"
import { getHighScores, GAME_CONFIGS, formatScore, type HighScore } from "@/lib/high-scores"
import SplitText from "../splittext"

export default function HighScoresPage() {
  const [gameScores, setGameScores] = useState<{ [key: string]: HighScore | null }>({})

  useEffect(() => {
    const scores = getHighScores()
    const gameScoreMap: { [key: string]: HighScore | null } = {}

    // Initialize all games with null (will show 0)
    Object.keys(GAME_CONFIGS).forEach((gameId) => {
      gameScoreMap[gameId] = null
    })

    // Get the best score for each game that has been played
    Object.keys(GAME_CONFIGS).forEach((gameId) => {
      const gameScores = scores.filter((s) => s.game === gameId)
      if (gameScores.length > 0) {
        const config = GAME_CONFIGS[gameId]
        const bestScore = gameScores.sort((a, b) => {
          if (config.scoreType === "number") {
            const scoreA = typeof a.score === "number" ? a.score : Number.parseInt(a.score.toString())
            const scoreB = typeof b.score === "number" ? b.score : Number.parseInt(b.score.toString())
            return config.higherIsBetter ? scoreB - scoreA : scoreA - scoreB
          } else if (config.scoreType === "time") {
            const timeA = typeof a.score === "number" ? a.score : Number.parseFloat(a.score.toString())
            const timeB = typeof b.score === "number" ? b.score : Number.parseFloat(b.score.toString())
            return timeA - timeB
          }
          return 0
        })[0]
        gameScoreMap[gameId] = bestScore
      }
    })

    setGameScores(gameScoreMap)
  }, [])

  return (
    <div className="min-h-screen bg-transparent">
      <Navigation />

      <main className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-serif font-bold text-4xl md:text-5xl text-foreground -mb-6">
              <Trophy className="inline-block w-8 h-8 md:w-12 md:h-12 text-primary mr-4 mb-14" />
              <SplitText
              text="High Scores"
              className="font-bold text-4xl md:text-6xl text-foreground pb-4"
              delay={100}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">Your best performances across all games</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(GAME_CONFIGS).map(([gameId, config], index) => {
              const scoreEntry = gameScores[gameId]
              const hasScore = scoreEntry !== null

              return (
                <Card
                  key={gameId}
                  className={`bg-card border-2 transition-colors ${
                    hasScore ? "border-primary/40 hover:border-primary/60" : "border-muted/40 hover:border-muted/60"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <span className="text-2xl">{config.icon}</span>
                        <span className="font-serif text-lg">{config.name}</span>
                      </span>
                      {hasScore && index < 3 && (
                        <div className="flex items-center">
                          {index === 0 && <Trophy className="w-5 h-5 text-primary" />}
                          {index === 1 && <Medal className="w-5 h-5 text-muted-foreground" />}
                          {index === 2 && <Award className="w-5 h-5 text-accent" />}
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${hasScore ? "text-card-foreground" : "text-muted-foreground"}`}>
                        {hasScore ? scoreEntry?.playerName || "Anonymous" : "Not played yet"}
                      </span>
                      <span className={`font-bold text-lg ${hasScore ? "text-primary" : "text-muted-foreground"}`}>
                        {hasScore
                          ? formatScore(scoreEntry?.score ?? 0, config.scoreType)
                          : config.scoreType === "time"
                            ? "0:00"
                            : "0"}
                      </span>
                    </div>
                    {hasScore && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {scoreEntry?.timestamp ? new Date(scoreEntry.timestamp).toLocaleDateString() : ""}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
