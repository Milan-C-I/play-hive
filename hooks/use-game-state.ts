"use client"

import { useState, useCallback } from "react"

export type GameStatus = "idle" | "playing" | "paused" | "won" | "lost"

interface UseGameStateProps {
  onGameEnd?: (won: boolean, score?: number | string) => void
}

export function useGameState({ onGameEnd }: UseGameStateProps = {}) {
  const [status, setStatus] = useState<GameStatus>("idle")
  const [score, setScore] = useState<number | string>(0)
  const [moves, setMoves] = useState(0)
  const [time, setTime] = useState(0)

  const startGame = useCallback(() => {
    setStatus("playing")
    setScore(0)
    setMoves(0)
    setTime(0)
  }, [])

  const pauseGame = useCallback(() => {
    setStatus("paused")
  }, [])

  const resumeGame = useCallback(() => {
    setStatus("playing")
  }, [])

  const endGame = useCallback(
    (won: boolean, finalScore?: number | string) => {
      setStatus(won ? "won" : "lost")
      if (finalScore !== undefined) {
        setScore(finalScore)
      }
      onGameEnd?.(won, finalScore || score)
    },
    [onGameEnd, score],
  )

  const resetGame = useCallback(() => {
    setStatus("idle")
    setScore(0)
    setMoves(0)
    setTime(0)
  }, [])

  const updateScore = useCallback((newScore: number | string) => {
    setScore(newScore)
  }, [])

  const incrementMoves = useCallback(() => {
    setMoves((prev) => prev + 1)
  }, [])

  const updateTime = useCallback((newTime: number) => {
    setTime(newTime)
  }, [])

  return {
    status,
    score,
    moves,
    time,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    resetGame,
    updateScore,
    incrementMoves,
    updateTime,
    isPlaying: status === "playing",
    isPaused: status === "paused",
    isGameOver: status === "won" || status === "lost",
    hasWon: status === "won",
  }
}
