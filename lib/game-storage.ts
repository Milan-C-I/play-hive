"use client"

export interface GameScore {
  game: string
  score: number | string
  timestamp: number
  difficulty?: string
}

export class GameStorage {
  private static getStorageKey(game: string): string {
    return `play-hive-${game}`
  }

  private static getScoresKey(): string {
    return "play-hive-scores"
  }

  static saveScore(game: string, score: number | string, difficulty?: string): void {
    if (typeof window === "undefined") return

    try {
      const gameScore: GameScore = {
        game,
        score,
        timestamp: Date.now(),
        difficulty,
      }

      // Save individual game best score
      const currentBest = this.getBestScore(game)
      const isNewBest = this.isNewBest(score, currentBest)

      if (isNewBest) {
        localStorage.setItem(this.getStorageKey(game), JSON.stringify(gameScore))
      }

      // Save to all scores history
      const allScores = this.getAllScores()
      allScores.push(gameScore)

      // Keep only last 100 scores
      if (allScores.length > 100) {
        allScores.splice(0, allScores.length - 100)
      }

      localStorage.setItem(this.getScoresKey(), JSON.stringify(allScores))
    } catch (error) {
      console.error("Failed to save score:", error)
    }
  }

  static getBestScore(game: string): GameScore | null {
    if (typeof window === "undefined") return null

    try {
      const stored = localStorage.getItem(this.getStorageKey(game))
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error("Failed to get best score:", error)
      return null
    }
  }

  static getAllScores(): GameScore[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.getScoresKey())
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to get all scores:", error)
      return []
    }
  }

  static getGameScores(game: string): GameScore[] {
    return this.getAllScores().filter((score) => score.game === game)
  }

  static clearGameData(game: string): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(this.getStorageKey(game))
    } catch (error) {
      console.error("Failed to clear game data:", error)
    }
  }

  static clearAllData(): void {
    if (typeof window === "undefined") return

    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith("neon-gaming-"))
      keys.forEach((key) => localStorage.removeItem(key))
    } catch (error) {
      console.error("Failed to clear all data:", error)
    }
  }

  private static isNewBest(newScore: number | string, currentBest: GameScore | null): boolean {
    if (!currentBest) return true

    // For numeric scores (higher is better)
    if (typeof newScore === "number" && typeof currentBest.score === "number") {
      return newScore > currentBest.score
    }

    // For time-based scores (lower is better) - format: "1:23" or "45s"
    if (typeof newScore === "string" && typeof currentBest.score === "string") {
      const newTime = this.parseTimeScore(newScore)
      const bestTime = this.parseTimeScore(currentBest.score)
      if (newTime !== null && bestTime !== null) {
        return newTime < bestTime
      }
    }

    return false
  }

  private static parseTimeScore(timeStr: string): number | null {
    // Parse "1:23" format
    if (timeStr.includes(":")) {
      const [mins, secs] = timeStr.split(":").map(Number)
      return mins * 60 + secs
    }

    // Parse "45s" format
    if (timeStr.endsWith("s")) {
      return Number.parseInt(timeStr.slice(0, -1))
    }

    return null
  }
}
