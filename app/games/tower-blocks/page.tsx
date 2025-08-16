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

const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 600
const BLOCK_HEIGHT = 30
const INITIAL_BLOCK_WIDTH = 100

interface Block {
  x: number
  y: number
  width: number
  height: number
  color: string
}

export default function TowerBlocksPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)

  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [gameStarted, setGameStarted] = useState(false)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null)
  const [movingDirection, setMovingDirection] = useState(1)
  const [score, setScore] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [gameSpeed, setGameSpeed] = useState(2)

  const { status, startGame, endGame, resetGame, isPlaying, isGameOver, hasWon } = useGameState({
    onGameEnd: (won, finalScore) => {
      if (typeof finalScore === "number") {
        GameStorage.saveScore("tower-blocks", finalScore, difficulty)
        saveHighScore("tower-blocks", finalScore, "Anonymous")
      }
      setShowModal(true)
    },
  })

  const getDifficultySettings = (diff: Difficulty) => {
    switch (diff) {
      case "easy":
        return { speed: 1.5, target: 15 }
      case "medium":
        return { speed: 2, target: 25 }
      case "hard":
        return { speed: 3, target: 35 }
    }
  }

  const getRandomColor = (): string => {
    const colors = [
      "#6366f1",
      "#d97706",
      "#10b981",
      "#e02424",
      "#8b5cf6",
      "#06b6d4",
      "#84cc16",
      "#f59e0b",
      "#ef4444",
      "#3b82f6",
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const initializeGame = useCallback(() => {
    const { speed } = getDifficultySettings(difficulty)

    // Base block
    const baseBlock: Block = {
      x: CANVAS_WIDTH / 2 - INITIAL_BLOCK_WIDTH / 2,
      y: CANVAS_HEIGHT - BLOCK_HEIGHT,
      width: INITIAL_BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      color: "#6366f1",
    }

    setBlocks([baseBlock])
    setScore(0)
    setGameSpeed(speed)
    setMovingDirection(1)

    // Create first moving block
    const firstBlock: Block = {
      x: 0,
      y: CANVAS_HEIGHT - BLOCK_HEIGHT * 2,
      width: INITIAL_BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      color: getRandomColor(),
    }

    setCurrentBlock(firstBlock)
  }, [difficulty])

  const createNextBlock = useCallback((lastBlock: Block) => {
    const newBlock: Block = {
      x: 0,
      y: lastBlock.y - BLOCK_HEIGHT,
      width: lastBlock.width,
      height: BLOCK_HEIGHT,
      color: getRandomColor(),
    }
    setCurrentBlock(newBlock)
    setMovingDirection(1)
  }, [])

  const dropBlock = useCallback(() => {
    if (!currentBlock || !isPlaying) return

    const lastBlock = blocks[blocks.length - 1]

    // Calculate overlap
    const leftEdge = Math.max(currentBlock.x, lastBlock.x)
    const rightEdge = Math.min(currentBlock.x + currentBlock.width, lastBlock.x + lastBlock.width)
    const overlapWidth = rightEdge - leftEdge

    if (overlapWidth <= 0) {
      // No overlap - game over
      GameAudio.playGameOver()
      endGame(false, score)
      return
    }

    // Create new block with trimmed width
    const newBlock: Block = {
      x: leftEdge,
      y: currentBlock.y,
      width: overlapWidth,
      height: BLOCK_HEIGHT,
      color: currentBlock.color,
    }

    const newBlocks = [...blocks, newBlock]
    setBlocks(newBlocks)
    setScore(newBlocks.length - 1)

    GameAudio.playMatch()

    // Check win condition
    const { target } = getDifficultySettings(difficulty)
    if (newBlocks.length - 1 >= target) {
      GameAudio.playSuccess()
      endGame(true, newBlocks.length - 1)
      return
    }

    // Increase speed slightly
    setGameSpeed((prev) => prev + 0.1)

    // Create next block
    if (newBlock.y > BLOCK_HEIGHT) {
      createNextBlock(newBlock)
    } else {
      // Tower too high - game over
      GameAudio.playGameOver()
      endGame(false, score)
    }
  }, [currentBlock, blocks, score, isPlaying, endGame, difficulty, createNextBlock])

  const gameLoop = useCallback(() => {
    if (!currentBlock || !isPlaying) return

    setCurrentBlock((prev) => {
      if (!prev) return null

      let newX = prev.x + gameSpeed * movingDirection

      // Bounce off walls
      if (newX <= 0) {
        newX = 0
        setMovingDirection(1)
      } else if (newX + prev.width >= CANVAS_WIDTH) {
        newX = CANVAS_WIDTH - prev.width
        setMovingDirection(-1)
      }

      return { ...prev, x: newX }
    })
  }, [currentBlock, isPlaying, gameSpeed, movingDirection])

  const handleKeyPress = (key: string) => {
    if (key === " " || key === "Enter") {
      dropBlock()
    }
  }

  const handleClick = () => {
    dropBlock()
  }

  useKeyboard({
    onKeyDown: handleKeyPress,
    enabled: isPlaying,
  })

  // Game loop
  useEffect(() => {
    if (isPlaying && currentBlock) {
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
  }, [isPlaying, currentBlock, gameLoop])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#1f2937"
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw blocks
    blocks.forEach((block) => {
      ctx.fillStyle = block.color
      ctx.fillRect(block.x, block.y, block.width, block.height)
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.strokeRect(block.x, block.y, block.width, block.height)
    })

    // Draw current moving block
    if (currentBlock) {
      ctx.fillStyle = currentBlock.color
      ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.width, currentBlock.height)
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.strokeRect(currentBlock.x, currentBlock.y, currentBlock.width, currentBlock.height)
    }

    // Draw center line
    ctx.strokeStyle = "#374151"
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 0)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
    ctx.stroke()
    ctx.setLineDash([])
  }, [blocks, currentBlock])

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
      <GameLayout title="Tower Blocks">
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-md w-full mx-4 space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">🏗️</div>
              <h2 className="font-serif text-3xl text-foreground">Tower Blocks</h2>
              <p className="text-muted-foreground">
                Stack moving blocks as high as you can! Time your drops perfectly to keep your tower stable.
              </p>
            </div>

            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>Target Height: {target} blocks</p>
              <p>Press Space or click to drop blocks</p>
              <p>Perfect alignment keeps full width!</p>
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
    <GameLayout title="Tower Blocks" onRestart={handleRestart}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Game Stats */}
        <GameStats
          stats={[
            { label: "Height", value: score, highlight: true },
            { label: "Target", value: target },
            { label: "Speed", value: gameSpeed.toFixed(1) },
          ]}
          className="mb-8"
        />

        {/* Game Canvas */}
        <div className="flex justify-center mb-6">
          <div className="border-2 border-primary/20 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="block cursor-pointer"
              onClick={handleClick}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Press Space, Enter, or click to drop the moving block</p>
          <p>Stack blocks precisely to maintain width and build higher!</p>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <span className="flex items-center">
              <span className="inline-block w-4 h-4 bg-primary rounded mr-2"></span>
              Perfect Drop
            </span>
            <span className="flex items-center">
              <span className="inline-block w-4 h-4 bg-secondary rounded mr-2"></span>
              Good Drop
            </span>
            <span className="flex items-center">
              <span className="inline-block w-4 h-4 bg-destructive rounded mr-2"></span>
              Miss = Game Over
            </span>
          </div>
        </div>
      </div>

      <GameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={hasWon ? "Tower Complete!" : "Tower Collapsed"}
        onRestart={handleRestart}
        onHome={handleHome}
        isWin={hasWon}
      >
        <div className="space-y-4">
          <div className="text-4xl">{hasWon ? "🎉" : "🏗️"}</div>
          <p className="text-card-foreground">
            {hasWon ? `You built a tower ${target} blocks high!` : "Your tower collapsed!"}
          </p>
          <p className="text-secondary font-bold text-xl">Final Height: {score} blocks</p>
          <p className="text-sm text-muted-foreground">Difficulty: {difficulty}</p>
        </div>
      </GameModal>
    </GameLayout>
  )
}
