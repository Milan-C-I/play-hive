export interface HighScore {
  game: string
  score: number | string
  timestamp: number
  playerName?: string
}

export interface GameScoreConfig {
  name: string
  icon: string
  scoreType: "number" | "time" | "custom" | "string"
  higherIsBetter: boolean
}

export const GAME_CONFIGS: Record<string, GameScoreConfig> = {
  "memory-match": { name: "Memory Match", icon: "🧠", scoreType: "string", higherIsBetter: false },
  wordle: { name: "Wordle", icon: "📝", scoreType: "custom", higherIsBetter: false },
  "typing-test": { name: "Typing Test", icon: "⌨️", scoreType: "number", higherIsBetter: true },
  simon: { name: "Simon Memory", icon: "🎵", scoreType: "number", higherIsBetter: true },
  snake: { name: "Snake", icon: "🐍", scoreType: "number", higherIsBetter: true },
  breakout: { name: "Breakout", icon: "🧱", scoreType: "number", higherIsBetter: true },
  platformer: { name: "Platformer", icon: "🏃", scoreType: "string", higherIsBetter: false },
  "2048": { name: "2048", icon: "🔢", scoreType: "number", higherIsBetter: true },
  minesweeper: { name: "Minesweeper", icon: "💣", scoreType: "string", higherIsBetter: false },
  "tower-blocks": { name: "Tower Blocks", icon: "🏗️", scoreType: "number", higherIsBetter: true },
}

export function saveHighScore(gameId: string, score: number | string, playerName?: string) {
  const highScore: HighScore = {
    game: gameId,
    score,
    timestamp: Date.now(),
    playerName: playerName || "Anonymous",
  }

  const existingScores = getHighScores()
  const gameScores = existingScores.filter((s) => s.game === gameId)
  const config = GAME_CONFIGS[gameId]

  if (!config) return

  // Check if this is a new high score
  let isNewHighScore = false
  if (gameScores.length === 0) {
    isNewHighScore = true
  } else {
    const bestScore = gameScores[0]
    if (config.scoreType === "number") {
      const currentScore = typeof score === "number" ? score : Number.parseInt(score.toString())
      const bestScoreNum =
        typeof bestScore.score === "number" ? bestScore.score : Number.parseInt(bestScore.score.toString())
      isNewHighScore = config.higherIsBetter ? currentScore > bestScoreNum : currentScore < bestScoreNum
    } else if (config.scoreType === "time") {
      const currentTime = typeof score === "number" ? score : Number.parseFloat(score.toString())
      const bestTime =
        typeof bestScore.score === "number" ? bestScore.score : Number.parseFloat(bestScore.score.toString())
      isNewHighScore = currentTime < bestTime
    }
  }

  if (isNewHighScore || gameScores.length < 3) {
    const updatedScores = [...existingScores.filter((s) => s.game !== gameId), highScore]
    localStorage.setItem("gameHighScores", JSON.stringify(updatedScores))
  }
}

export function getHighScores(): HighScore[] {
  if (typeof window === "undefined") return []

  try {
    const scores = localStorage.getItem("gameHighScores")
    return scores ? JSON.parse(scores) : []
  } catch {
    return []
  }
}

export function getGameHighScore(gameId: string): HighScore | null {
  const scores = getHighScores()
  const gameScores = scores.filter((s) => s.game === gameId)

  if (gameScores.length === 0) return null

  const config = GAME_CONFIGS[gameId]
  if (!config) return gameScores[0]

  return gameScores.sort((a, b) => {
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
}

export function formatScore(score: number | string, scoreType: string): string {
  if (scoreType === "time") {
    const timeNum = typeof score === "number" ? score : Number.parseFloat(score.toString())
    if (timeNum < 60) {
      return `${timeNum.toFixed(1)}s`
    } else {
      const minutes = Math.floor(timeNum / 60)
      const seconds = (timeNum % 60).toFixed(1)
      return `${minutes}:${seconds.padStart(4, "0")}`
    }
  }
  return score.toString()
}
