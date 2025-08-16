"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { GameLayout } from "@/components/game-layout"
import { GameModal } from "@/components/game-modal"
import { GameStats } from "@/components/game-stats"
import { DifficultySelector, type Difficulty } from "@/components/difficulty-selector"
import { useGameState } from "@/hooks/use-game-state"
import { useKeyboard } from "@/hooks/use-keyboard"
import { saveHighScore } from "@/lib/high-scores"
import { GameAudio } from "@/lib/game-audio"

const GRID_SIZE = 20
const CANVAS_SIZE = 400

interface Position {
  x: number
  y: number
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

export default function SnakePage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)

  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [gameStarted, setGameStarted] = useState(false)
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Position>({ x: 15, y: 15 })
  const [direction, setDirection] = useState<Direction>("RIGHT")
  const [nextDirection, setNextDirection] = useState<Direction>("RIGHT")
  const [score, setScore] = useState(0)
  const [showModal, setShowModal] = useState(false)

  const { status, startGame, endGame, resetGame, isPlaying, isGameOver, hasWon } = useGameState({
    onGameEnd: (won, finalScore) => {
      if (typeof finalScore === "number") {
        saveHighScore("snake", finalScore, "Player")
      }
      setShowModal(true)
    },
  })

  const getDifficultySettings = (diff: Difficulty) => {
    switch (diff) {
      case "easy":
        return { speed: 200, target: 50 }
      case "medium":
        return { speed: 150, target: 100 }
      case "hard":
        return { speed: 100, target: 150 }
    }
  }

  const generateFood = useCallback((snakeBody: Position[]) => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      }
    } while (snakeBody.some((segment) => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [])

  const initializeGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }]
    setSnake(initialSnake)
    setFood(generateFood(initialSnake))
    setDirection("RIGHT")
    setNextDirection("RIGHT")
    setScore(0)
  }, [generateFood])

  const checkCollision = (head: Position, snakeBody: Position[]) => {
    // Wall collision
    if (head.x < 0 || head.x >= CANVAS_SIZE / GRID_SIZE || head.y < 0 || head.y >= CANVAS_SIZE / GRID_SIZE) {
      return true
    }
    // Self collision
    return snakeBody.some((segment) => segment.x === head.x && segment.y === head.y)
  }

  const gameLoop = useCallback(() => {
    if (!isPlaying) return

    setSnake((currentSnake) => {
      const head = { ...currentSnake[0] }
      const currentDirection = nextDirection

      // Move head
      switch (currentDirection) {
        case "UP":
          head.y -= 1
          break
        case "DOWN":
          head.y += 1
          break
        case "LEFT":
          head.x -= 1
          break
        case "RIGHT":
          head.x += 1
          break
      }

      // Check collision
      if (checkCollision(head, currentSnake)) {
        GameAudio.playGameOver()
        endGame(false, score)
        return currentSnake
      }

      const newSnake = [head, ...currentSnake]

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        GameAudio.playMatch()
        const newScore = score + 10
        setScore(newScore)
        setFood(generateFood(newSnake))

        // Check win condition
        const { target } = getDifficultySettings(difficulty)
        if (newScore >= target) {
          GameAudio.playSuccess()
          endGame(true, newScore)
        }

        return newSnake
      } else {
        return newSnake.slice(0, -1)
      }
    })

    setDirection(nextDirection)
  }, [isPlaying, nextDirection, food, score, endGame, generateFood, difficulty])

  const handleKeyPress = (key: string) => {
    if (!isPlaying) return

    switch (key.toLowerCase()) {
      case "arrowup":
      case "w":
        if (direction !== "DOWN") setNextDirection("UP")
        break
      case "arrowdown":
      case "s":
        if (direction !== "UP") setNextDirection("DOWN")
        break
      case "arrowleft":
      case "a":
        if (direction !== "RIGHT") setNextDirection("LEFT")
        break
      case "arrowright":
      case "d":
        if (direction !== "LEFT") setNextDirection("RIGHT")
        break
    }
  }

  useKeyboard({
    onKeyDown: handleKeyPress,
    enabled: isPlaying,
  })

  // Game loop
  useEffect(() => {
    if (isPlaying) {
      const { speed } = getDifficultySettings(difficulty)
      gameLoopRef.current = window.setInterval(gameLoop, speed)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [isPlaying, gameLoop, difficulty])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#1f2937"
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw grid
    ctx.strokeStyle = "#374151"
    ctx.lineWidth = 1
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, CANVAS_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(CANVAS_SIZE, i)
      ctx.stroke()
    }

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "#6366f1" : "#10b981"
      ctx.fillRect(segment.x * GRID_SIZE + 1, segment.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2)
    })

    // Draw food
    ctx.fillStyle = "#d97706"
    ctx.fillRect(food.x * GRID_SIZE + 1, food.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2)
  }, [snake, food])

  const handleStart = () => {
    setGameStarted(true)
    initializeGame()
    startGame()
    GameAudio.init()
  }

  const handleRestart = () => {
    resetGame()
    setShowModal(false)
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

  const { target } = getDifficultySettings(difficulty)

  if (!gameStarted) {
    return (
      <GameLayout title="Snake Game">
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-md w-full mx-4 space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">🐍</div>
              <h2 className="font-serif text-3xl text-foreground">Snake Game</h2>
              <p className="text-muted-foreground">
                Control the snake to eat food and grow longer. Avoid hitting walls or yourself!
              </p>
            </div>

            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>Target Score: {target} points</p>
              <p>Use WASD or Arrow Keys to move</p>
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
    <GameLayout title="Snake Game" onRestart={handleRestart}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Game Stats */}
        <GameStats
          stats={[
            { label: "Score", value: score, highlight: true },
            { label: "Length", value: snake.length },
            { label: "Target", value: target },
          ]}
          className="mb-8"
        />

        {/* Game Canvas */}
        <div className="flex justify-center mb-6">
          <div className="border-2 border-primary/20 rounded-lg overflow-hidden">
            <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="block" />
          </div>
        </div>

        {/* Controls */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Use WASD or Arrow Keys to control the snake</p>
          <p className="mt-2">
            <span className="inline-block w-4 h-4 bg-primary rounded mr-2"></span>
            Snake Head
            <span className="inline-block w-4 h-4 bg-accent rounded mx-2 ml-4"></span>
            Snake Body
            <span className="inline-block w-4 h-4 bg-secondary rounded mx-2 ml-4"></span>
            Food
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
          <div className="text-4xl">{hasWon ? "🎉" : "💀"}</div>
          <p className="text-card-foreground">{hasWon ? `You reached the target score!` : "The snake crashed!"}</p>
          <p className="text-secondary font-bold text-xl">Final Score: {score}</p>
          <p className="text-card-foreground">Snake Length: {snake.length}</p>
          <p className="text-sm text-muted-foreground">Difficulty: {difficulty}</p>
        </div>
      </GameModal>
    </GameLayout>
  )
}
