"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { GameLayout } from "@/components/game-layout"
import { GameModal } from "@/components/game-modal"
import { GameStats } from "@/components/game-stats"
import { DifficultySelector, type Difficulty } from "@/components/difficulty-selector"
import { useGameState } from "@/hooks/use-game-state"
import { GameStorage } from "@/lib/game-storage"
import { GameAudio } from "@/lib/game-audio"
import { saveHighScore } from "@/lib/high-scores"

const COLORS = [
  { id: 0, name: "red", bg: "bg-red-500", active: "bg-red-300", sound: 261.63 },
  { id: 1, name: "blue", bg: "bg-blue-500", active: "bg-blue-300", sound: 329.63 },
  { id: 2, name: "green", bg: "bg-green-500", active: "bg-green-300", sound: 392.0 },
  { id: 3, name: "yellow", bg: "bg-yellow-500", active: "bg-yellow-300", sound: 523.25 },
]

type GamePhase = "showing" | "waiting" | "playing"

export default function SimonPage() {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [gameStarted, setGameStarted] = useState(false)
  const [sequence, setSequence] = useState<number[]>([])
  const [playerSequence, setPlayerSequence] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [phase, setPhase] = useState<GamePhase>("waiting")
  const [activeButton, setActiveButton] = useState<number | null>(null)
  const [round, setRound] = useState(1)
  const [showModal, setShowModal] = useState(false)

  const { status, startGame, endGame, resetGame, isPlaying, isGameOver, hasWon } = useGameState({
    onGameEnd: (won, score) => {
      if (typeof score === "number") {
        // GameStorage.saveScore("simon", score, difficulty)
        saveHighScore("simon", score, "Anonymous")
      }
      setShowModal(true)
    },
  })

  const getDifficultySettings = (diff: Difficulty) => {
    switch (diff) {
      case "easy":
        return { speed: 800, target: 8 }
      case "medium":
        return { speed: 600, target: 12 }
      case "hard":
        return { speed: 400, target: 16 }
    }
  }

  const initializeGame = useCallback(() => {
    setSequence([])
    setPlayerSequence([])
    setCurrentStep(0)
    setPhase("waiting")
    setActiveButton(null)
    setRound(1)
  }, [])

  const addToSequence = useCallback(() => {
    const newColor = Math.floor(Math.random() * 4)
    setSequence((prev) => [...prev, newColor])
  }, [])

  const playSequence = useCallback(async () => {
    setPhase("showing")
    const { speed } = getDifficultySettings(difficulty)

    for (let i = 0; i < sequence.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, speed / 2))
      setActiveButton(sequence[i])
      GameAudio.playTone(COLORS[sequence[i]].sound, 0.3)

      await new Promise((resolve) => setTimeout(resolve, speed / 2))
      setActiveButton(null)
    }

    setPhase("playing")
    setPlayerSequence([])
    setCurrentStep(0)
  }, [sequence, difficulty])

  const handleButtonClick = (colorId: number) => {
    if (phase !== "playing" || !isPlaying) return

    GameAudio.playTone(COLORS[colorId].sound, 0.2)
    setActiveButton(colorId)
    setTimeout(() => setActiveButton(null), 200)

    const newPlayerSequence = [...playerSequence, colorId]
    setPlayerSequence(newPlayerSequence)

    if (colorId !== sequence[currentStep]) {
      // Wrong color - game over
      GameAudio.playGameOver()
      endGame(false, round - 1)
      return
    }

    if (newPlayerSequence.length === sequence.length) {
      // Round completed
      const { target } = getDifficultySettings(difficulty)
      if (round >= target) {
        // Game won!
        GameAudio.playSuccess()
        endGame(true, round)
      } else {
        // Next round
        setRound((prev) => prev + 1)
        setPhase("waiting")
        setTimeout(() => {
          addToSequence()
        }, 1000)
      }
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleStart = () => {
    setGameStarted(true)
    initializeGame()
    startGame()
    GameAudio.init()
    addToSequence()
  }

  const handleRestart = () => {
    resetGame()
    setShowModal(false)
    initializeGame()
    startGame()
    addToSequence()
  }

  const handleHome = () => {
    router.push("/")
  }

  useEffect(() => {
    if (sequence.length > 0 && phase === "waiting") {
      const timer = setTimeout(() => {
        playSequence()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [sequence, phase, playSequence])

  const { target } = getDifficultySettings(difficulty)

  if (!gameStarted) {
    return (
      <GameLayout title="Simon Memory Game">
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-md w-full mx-4 space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">🎵</div>
              <h2 className="font-serif text-3xl text-foreground">Simon Says</h2>
              <p className="text-muted-foreground">
                Watch the sequence of colors and sounds, then repeat it back. Each round adds one more step!
              </p>
            </div>

            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />

            <div className="text-center text-sm text-muted-foreground">
              <p>Target: {target} rounds</p>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-6 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Game
            </button>
          </div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout title="Simon Memory Game" onRestart={handleRestart}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Game Stats */}
        <GameStats
          stats={[
            { label: "Round", value: round, highlight: true },
            { label: "Target", value: target },
            { label: "Step", value: `${currentStep + 1}/${sequence.length}` },
          ]}
          className="mb-8"
        />

        {/* Phase Indicator */}
        <div className="text-center mb-8">
          <div className="text-lg font-semibold text-foreground">
            {phase === "showing" && "Watch the sequence..."}
            {phase === "playing" && "Repeat the sequence!"}
            {phase === "waiting" && "Get ready..."}
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => handleButtonClick(color.id)}
              disabled={phase !== "playing"}
              className={`
                aspect-square rounded-lg border-4 border-white/20 transition-all duration-150 transform
                ${activeButton === color.id ? color.active : color.bg}
                ${phase === "playing" ? "hover:scale-105 cursor-pointer" : "cursor-not-allowed"}
                ${activeButton === color.id ? "scale-110 shadow-lg" : ""}
              `}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            {phase === "showing" && "Memorize the sequence of colors"}
            {phase === "playing" && "Click the colors in the same order"}
            {phase === "waiting" && "Next round starting..."}
          </p>
        </div>
      </div>

      <GameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={hasWon ? "Congratulations!" : "Game Over"}
        onRestart={handleRestart}
        onHome={handleHome}
        isWin={hasWon}
      >
        <div className="space-y-4">
          <div className="text-4xl">{hasWon ? "🎉" : "😔"}</div>
          <p className="text-card-foreground">
            {hasWon ? `You completed all ${target} rounds!` : `You reached round ${round - 1}`}
          </p>
          <p className="text-secondary font-bold text-xl">Score: {hasWon ? round : round - 1}</p>
          <p className="text-sm text-muted-foreground">Difficulty: {difficulty}</p>
        </div>
      </GameModal>
    </GameLayout>
  )
}
