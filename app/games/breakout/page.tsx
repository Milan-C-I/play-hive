"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { GameLayout } from "@/components/game-layout"
import { GameModal } from "@/components/game-modal"
import { GameStats } from "@/components/game-stats"
import { DifficultySelector, type Difficulty } from "@/components/difficulty-selector"
import { useGameState } from "@/hooks/use-game-state"
import { useKeyboard } from "@/hooks/use-keyboard"
import { GameStorage } from "@/lib/game-storage"
import { GameAudio } from "@/lib/game-audio"
import { saveHighScore } from "@/lib/high-scores"

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 400
const PADDLE_WIDTH = 80
const PADDLE_HEIGHT = 10
const BALL_SIZE = 8
const BRICK_WIDTH = 60
const BRICK_HEIGHT = 20
const BRICK_ROWS = 5
const BRICK_COLS = 9

interface Position {
  x: number
  y: number
}

interface Velocity {
  x: number
  y: number
}

interface Brick {
  x: number
  y: number
  width: number
  height: number
  destroyed: boolean
  color: string
}

export default function BreakoutPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)
  const keysRef = useRef<Set<string>>(new Set())

  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [gameStarted, setGameStarted] = useState(false)
  const [paddle, setPaddle] = useState<Position>({ x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 30 })
  const [ball, setBall] = useState<Position>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 })
  const [ballVelocity, setBallVelocity] = useState<Velocity>({ x: 3, y: -3 })
  const [bricks, setBricks] = useState<Brick[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [showModal, setShowModal] = useState(false)

  const { status, startGame, endGame, resetGame, isPlaying, isGameOver, hasWon } = useGameState({
    onGameEnd: (won, finalScore) => {
      if (typeof finalScore === "number") {
        saveHighScore("breakout", finalScore, "Anonymous")
      }
      setShowModal(true)
    },
  })

  const getDifficultySettings = (diff: Difficulty) => {
    switch (diff) {
      case "easy":
        return { ballSpeed: 2, paddleSpeed: 6 }
      case "medium":
        return { ballSpeed: 3, paddleSpeed: 8 }
      case "hard":
        return { ballSpeed: 4, paddleSpeed: 10 }
    }
  }

  const initializeBricks = useCallback(() => {
    const newBricks: Brick[] = []
    const colors = ["#e02424", "#d97706", "#10b981", "#6366f1", "#8b5cf6"]

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: col * (BRICK_WIDTH + 5) + 35,
          y: row * (BRICK_HEIGHT + 5) + 50,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          destroyed: false,
          color: colors[row],
        })
      }
    }
    return newBricks
  }, [])

  const initializeGame = useCallback(() => {
    setPaddle({ x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 30 })
    setBall({ x: CANVAS_WIDTH / 2 - BALL_SIZE / 2, y: CANVAS_HEIGHT - 50 }) // Start ball higher up
    const { ballSpeed } = getDifficultySettings(difficulty)
    setBallVelocity({ x: ballSpeed * (Math.random() > 0.5 ? 1 : -1), y: -ballSpeed })
    setBricks(initializeBricks())
    setScore(0)
    setLives(3)
  }, [initializeBricks, difficulty])

  const checkCollision = (rect1: any, rect2: any) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    )
  }

  const gameLoop = useCallback(() => {
    if (!isPlaying) return

    const { paddleSpeed } = getDifficultySettings(difficulty)

    // Update paddle position
    setPaddle((currentPaddle) => {
      let newX = currentPaddle.x

      if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a")) {
        newX = Math.max(0, newX - paddleSpeed)
      }
      if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) {
        newX = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, newX + paddleSpeed)
      }

      return { ...currentPaddle, x: newX }
    })

    // Update ball position
    setBall((currentBall) => {
      setBallVelocity((currentVelocity) => {
        let newVelX = currentVelocity.x
        let newVelY = currentVelocity.y
        let newX = currentBall.x + newVelX
        let newY = currentBall.y + newVelY

        // Wall collisions
        if (newX <= 0 || newX >= CANVAS_WIDTH - BALL_SIZE) {
          newVelX = -newVelX
          newX = currentBall.x + newVelX
          GameAudio.playClick()
        }
        if (newY <= 0) {
          newVelY = -newVelY
          newY = currentBall.y + newVelY
          GameAudio.playClick()
        }

        // Paddle collision
        const ballRect = { x: newX, y: newY, width: BALL_SIZE, height: BALL_SIZE }
        const paddleRect = { x: paddle.x, y: paddle.y, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }

        if (checkCollision(ballRect, paddleRect) && newVelY > 0) {
          newVelY = -Math.abs(newVelY)
          const hitPos = (newX - paddle.x) / PADDLE_WIDTH
          newVelX = (hitPos - 0.5) * 6
          GameAudio.playMatch()
        }

        // Brick collisions
        setBricks((currentBricks) => {
          const newBricks = [...currentBricks]
          let brickHit = false

          for (let i = 0; i < newBricks.length; i++) {
            if (newBricks[i].destroyed) continue

            const brickRect = {
              x: newBricks[i].x,
              y: newBricks[i].y,
              width: newBricks[i].width,
              height: newBricks[i].height,
            }

            if (checkCollision(ballRect, brickRect)) {
              newBricks[i].destroyed = true
              brickHit = true
              setScore((prev) => prev + 10)
              GameAudio.playMatch()

              // Determine collision side
              const ballCenterX = newX + BALL_SIZE / 2
              const ballCenterY = newY + BALL_SIZE / 2
              const brickCenterX = brickRect.x + brickRect.width / 2
              const brickCenterY = brickRect.y + brickRect.height / 2

              const deltaX = Math.abs(ballCenterX - brickCenterX)
              const deltaY = Math.abs(ballCenterY - brickCenterY)

              if (deltaX > deltaY) {
                newVelX = -newVelX
              } else {
                newVelY = -newVelY
              }
              break
            }
          }

          // Check win condition
          const remainingBricks = newBricks.filter((brick) => !brick.destroyed)
          if (remainingBricks.length === 0) {
            GameAudio.playSuccess()
            endGame(true, score + 10)
          }

          return newBricks
        })

        // Ball fell off screen
        if (newY > CANVAS_HEIGHT) {
          setLives((currentLives) => {
            const newLives = currentLives - 1
            if (newLives <= 0) {
              GameAudio.playGameOver()
              endGame(false, score)
            } else {
              GameAudio.playError()
              // Reset ball position
              setTimeout(() => {
                setBall({ x: CANVAS_WIDTH / 2 - BALL_SIZE / 2, y: CANVAS_HEIGHT - 50 })
                const { ballSpeed } = getDifficultySettings(difficulty)
                setBallVelocity({ x: ballSpeed * (Math.random() > 0.5 ? 1 : -1), y: -ballSpeed })
              }, 100)
            }
            return newLives
          })
          return currentBall
        }

        return { x: newX, y: newY }
      })

      return currentBall
    })
  }, [isPlaying, paddle, score, endGame, difficulty])

  const handleKeyDown = (key: string) => {
    keysRef.current.add(key)
  }

  const handleKeyUp = (key: string) => {
    keysRef.current.delete(key)
  }

  useKeyboard({
    onKeyDown: handleKeyDown,
    onKeyUp: handleKeyUp,
    enabled: isPlaying,
  })

  // Game loop
  useEffect(() => {
    if (isPlaying) {
      gameLoopRef.current = window.setInterval(gameLoop, 16) // ~60 FPS
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
  }, [isPlaying, gameLoop])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#1f2937"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw bricks
    bricks.forEach((brick) => {
      if (!brick.destroyed) {
        ctx.fillStyle = brick.color
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 1
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height)
      }
    })

    // Draw paddle
    ctx.fillStyle = "#6366f1"
    ctx.fillRect(paddle.x, paddle.y, PADDLE_WIDTH, PADDLE_HEIGHT)

    // Draw ball
    ctx.fillStyle = "#d97706"
    ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE)
  }, [bricks, paddle, ball])

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

  const remainingBricks = bricks.filter((brick) => !brick.destroyed).length

  if (!gameStarted) {
    return (
      <GameLayout title="Breakout">
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-md w-full mx-4 space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">🧱</div>
              <h2 className="font-serif text-3xl text-foreground">Breakout</h2>
              <p className="text-muted-foreground">
                Bounce the ball to break all the bricks! Don't let the ball fall off the screen.
              </p>
            </div>

            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>Break all {BRICK_ROWS * BRICK_COLS} bricks to win!</p>
              <p>Use A/D or Arrow Keys to move paddle</p>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-6 rounded-lg font-semibold text-lg transition-colors cursor-pointer"
            >
              Start Game
            </button>
          </div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout title="Breakout" onRestart={handleRestart}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Game Stats */}
        <GameStats
          stats={[
            { label: "Score", value: score, highlight: true },
            { label: "Lives", value: lives },
            { label: "Bricks Left", value: remainingBricks },
          ]}
          className="mb-8"
        />

        {/* Game Canvas */}
        <div className="flex justify-center mb-6">
          <div className="border-2 border-primary/20 rounded-lg overflow-hidden">
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block" />
          </div>
        </div>

        {/* Controls */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Use A/D or Arrow Keys to move the paddle</p>
          <p className="mt-2">Keep the ball in play and break all the bricks!</p>
        </div>
      </div>

      <GameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={hasWon ? "Level Complete!" : "Game Over"}
        onRestart={handleRestart}
        onHome={handleHome}
        isWin={hasWon}
      >
        <div className="space-y-4">
          <div className="text-4xl">{hasWon ? "🎉" : "💥"}</div>
          <p className="text-card-foreground">{hasWon ? "You broke all the bricks!" : "You ran out of lives!"}</p>
          <p className="text-secondary font-bold text-xl">Final Score: {score}</p>
          <p className="text-card-foreground">Bricks Destroyed: {BRICK_ROWS * BRICK_COLS - remainingBricks}</p>
          <p className="text-sm text-muted-foreground">Difficulty: {difficulty}</p>
        </div>
      </GameModal>
    </GameLayout>
  )
}
