"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { GameLayout } from "@/components/game-layout"
import { GameModal } from "@/components/game-modal"
import { GameStats } from "@/components/game-stats"
import { GameTimer } from "@/components/game-timer"
import { useGameState } from "@/hooks/use-game-state"
import { saveHighScore } from "@/lib/high-scores"
import { GameAudio } from "@/lib/game-audio"

const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once.",
  "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole filled with the ends of worms and an oozy smell.",
  "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
  "To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune.",
  "All happy families are alike; each unhappy family is unhappy in its own way. Everything was in confusion in the Oblonskys' house.",
]

export default function TypingTestPage() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = useState(false)
  const [targetText, setTargetText] = useState("")
  const [userInput, setUserInput] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [errors, setErrors] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [showModal, setShowModal] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [gameTime, setGameTime] = useState(0)

  const { status, startGame, endGame, resetGame, isPlaying, isGameOver, hasWon } = useGameState({

    onGameEnd: (won, score) => {
      const finalScore = Math.round((accuracy * wpm) / (gameTime / 60 + 1))
      saveHighScore("typing-test", finalScore, "Anonymous")
      setShowModal(true)
    },
  })

  const initializeGame = useCallback(() => {
    const text = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)]
    setTargetText(text)
    setUserInput("")
    setCurrentIndex(0)
    setErrors(0)
    setWpm(0)
    setAccuracy(100)
    setStartTime(null)
    setGameTime(0)
  }, [])

  const calculateStats = useCallback(
    (input: string, timeElapsed: number) => {
      const wordsTyped = input.length / 5
      const minutes = timeElapsed / 60000
      const currentWpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0

      const totalChars = input.length
      const correctChars = totalChars - errors
      const currentAccuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100

      setWpm(currentWpm)
      setAccuracy(currentAccuracy)
    },
    [errors],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isPlaying) return

    const input = e.target.value
    const now = Date.now()

    if (!startTime) {
      setStartTime(now)
    }

    if (input.length > targetText.length) return

    setUserInput(input)
    setCurrentIndex(input.length)

    let errorCount = 0
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== targetText[i]) {
        errorCount++
      }
    }
    setErrors(errorCount)

    const timeElapsed = now - (startTime || 0)
    calculateStats(input, timeElapsed)

    if (input === targetText) {
      const finalWpm = wpm
      const finalAccuracy = accuracy
      GameAudio.playSuccess()
      endGame(true, Math.round((accuracy * wpm) / (gameTime / 60 + 1)))
    } else if (input.length === targetText.length && input !== targetText) {
      GameAudio.playError()
      endGame(false, 0)
    }
  }

  const handleStart = () => {
    setGameStarted(true)
    setGameTime(0)
    initializeGame()
    startGame()
    GameAudio.init()
  }

  const handleRestart = () => {
    resetGame()
    setShowModal(false)
    setGameTime(0)
    initializeGame()
    startGame()
  }

  const handleHome = () => {
    router.push("/")
  }

  useEffect(() => {
    if (!gameStarted) {
      initializeGame()
    }
  }, [gameStarted, initializeGame])

  const renderText = () => {
    return targetText.split("").map((char, index) => {
      let className = "text-muted-foreground"

      if (index < userInput.length) {
        if (userInput[index] === char) {
          className = "text-accent bg-accent/20"
        } else {
          className = "text-destructive bg-destructive/20"
        }
      } else if (index === currentIndex) {
        className = "text-foreground bg-primary/20 animate-pulse"
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      )
    })
  }

  if (!gameStarted) {
    return (
      <GameLayout title="Typing Speed Test">
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-md w-full mx-4 space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">⌨️</div>
              <h2 className="font-serif text-3xl text-foreground">Typing Speed Test</h2>
              <p className="text-muted-foreground">
                Type the given text as fast and accurately as you can. Your WPM and accuracy will be calculated in
                real-time!
              </p>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Words Per Minute (WPM)</span>
                <span className="text-primary">Speed measurement</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Accuracy</span>
                <span className="text-accent">Correct characters %</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Errors</span>
                <span className="text-destructive">Incorrect keystrokes</span>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-6 rounded-lg font-semibold text-lg transition-colors cursor-pointer"
            >
              Start Test
            </button>
          </div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout title="Typing Speed Test" onRestart={handleRestart}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <GameStats
            stats={[
              { label: "WPM", value: wpm, highlight: true },
              { label: "Accuracy", value: `${accuracy}%` },
              { label: "Errors", value: errors },
            ]}
          />
          <GameTimer isRunning={isPlaying} onTimeUpdate={setGameTime} />
        </div>

        <div className="bg-card rounded-lg p-6 mb-6 border border-primary/20">
          <div className="font-mono text-lg leading-relaxed">{renderText()}</div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">Type the text above:</label>
          <textarea
            value={userInput}
            onChange={handleInputChange}
            disabled={!isPlaying}
            placeholder="Start typing here..."
            className="w-full h-32 p-4 bg-input border border-primary/20 rounded-lg text-foreground font-mono text-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            autoFocus
          />
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round((userInput.length / targetText.length) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(userInput.length / targetText.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <GameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={hasWon ? "Test Complete!" : "Test Finished"}
        onRestart={handleRestart}
        onHome={handleHome}
        isWin={hasWon}
      >
        <div className="space-y-4">
          <div className="text-4xl">{hasWon ? "🎉" : "📊"}</div>
          <div className="space-y-2">
            <p className="text-card-foreground">
              <span className="text-secondary font-bold text-2xl">{wpm} WPM</span>
            </p>
            <p className="text-card-foreground">
              Accuracy: <span className="text-accent font-bold">{accuracy}%</span>
            </p>
            <p className="text-card-foreground">
              Errors: <span className="text-destructive font-bold">{errors}</span>
            </p>
            <p className="text-card-foreground">
              Time:{" "}
              <span className="text-primary font-bold">
                {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, "0")}
              </span>
            </p>
            <p className="text-card-foreground">
              Score:{" "}
              <span className="text-secondary font-bold">{Math.round((accuracy * wpm) / (gameTime / 60 + 1))}</span>
            </p>
          </div>
        </div>
      </GameModal>
    </GameLayout>
  )
}
