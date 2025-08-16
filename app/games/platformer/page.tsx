"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { GameLayout } from "@/components/game-layout"
import { GameModal } from "@/components/game-modal"
import { GameStats } from "@/components/game-stats"
import { GameTimer } from "@/components/game-timer"
import { useGameState } from "@/hooks/use-game-state"
import { useKeyboard } from "@/hooks/use-keyboard"
import { GameStorage } from "@/lib/game-storage"
import { GameAudio } from "@/lib/game-audio"
import { saveHighScore } from "@/lib/high-scores"

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 400
const PLAYER_WIDTH = 20
const PLAYER_HEIGHT = 30
const GRAVITY = 0.5
const JUMP_FORCE = -12
const MOVE_SPEED = 5

interface Position {
  x: number
  y: number
}

interface Velocity {
  x: number
  y: number
}

interface Platform {
  x: number
  y: number
  width: number
  height: number
}

interface Coin {
  x: number
  y: number
  collected: boolean
}

interface Spike {
  x: number
  y: number
  width: number
  height: number
}

const staticPlatforms: Platform[] = [
  { x: 0, y: 350, width: 200, height: 50 }, // Starting platform
  { x: 250, y: 300, width: 100, height: 20 },
  { x: 400, y: 250, width: 100, height: 20 },
  { x: 550, y: 200, width: 100, height: 20 },
  { x: 700, y: 150, width: 100, height: 20 },
  { x: 850, y: 200, width: 100, height: 20 },
  { x: 1000, y: 250, width: 100, height: 20 },
  { x: 1150, y: 200, width: 100, height: 20 },
  { x: 1300, y: 150, width: 100, height: 20 },
  { x: 1450, y: 250, width: 150, height: 20 }, // Final platform
]

const staticSpikes: Spike[] = [
  { x: 300, y: 380, width: 30, height: 20 },
  { x: 500, y: 380, width: 30, height: 20 },
  { x: 800, y: 380, width: 30, height: 20 },
  { x: 1100, y: 380, width: 30, height: 20 },
]

export default function PlatformerPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>(0)
  const keysRef = useRef<Set<string>>(new Set())

  const [gameStarted, setGameStarted] = useState(false)
  const [player, setPlayer] = useState<Position>({ x: 50, y: 300 })
  const [velocity, setVelocity] = useState<Velocity>({ x: 0, y: 0 })
  const [isGrounded, setIsGrounded] = useState(false)
  const [coins, setCoins] = useState<Coin[]>([])
  const [coinsCollected, setCoinsCollected] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [cameraX, setCameraX] = useState(0)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [spikes, setSpikes] = useState<Spike[]>([])
  const [totalCoins, setTotalCoins] = useState(10)

  const { status, time, startGame, endGame, resetGame, updateTime, isPlaying, isGameOver, hasWon } = useGameState({
    onGameEnd: (won, score) => {
      if (won && typeof score === "string") {
        saveHighScore("platformer", score, "Anonymous")
      }
      setShowModal(true)
    },
  })

  const initializeCoins = useCallback(() => {
    return [
      { x: 320, y: 250, collected: false },
      { x: 520, y: 150, collected: false },
      { x: 670, y: 100, collected: false },
      { x: 820, y: 150, collected: false },
      { x: 1020, y: 200, collected: false },
      { x: 1220, y: 150, collected: false },
      { x: 420, y: 200, collected: false },
      { x: 920, y: 100, collected: false },
      { x: 1370, y: 100, collected: false },
      { x: 1520, y: 200, collected: false }, // Final coin
    ]
  }, [])

  const initializeGame = useCallback(() => {
    setPlatforms(staticPlatforms)
    setSpikes(staticSpikes)
    const newCoins = initializeCoins()
    setCoins(newCoins)
    setTotalCoins(newCoins.length)

    setPlayer({ x: 50, y: 300 })
    setVelocity({ x: 0, y: 0 })
    setIsGrounded(false)
    setCoinsCollected(0)
    setCameraX(0)
  }, [initializeCoins])

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

    setPlayer((currentPlayer) => {
      setVelocity((currentVelocity) => {
        let newVelX = currentVelocity.x
        let newVelY = currentVelocity.y

        // Handle horizontal input - Fixed movement to work when grounded
        if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a")) {
          newVelX = -MOVE_SPEED
        } else if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) {
          newVelX = MOVE_SPEED
        } else {
          newVelX = 0
        }

        // Handle jumping - only when grounded
        if ((keysRef.current.has("ArrowUp") || keysRef.current.has("w") || keysRef.current.has(" ")) && isGrounded) {
          newVelY = JUMP_FORCE
          GameAudio.playClick()
        }

        // Apply gravity
        if (!isGrounded) {
          newVelY += GRAVITY
        }

        // Calculate new position
        const newX = currentPlayer.x + newVelX
        const newY = currentPlayer.y + newVelY

        // Platform collision detection
        let onGround = false
        let finalX = newX
        let finalY = newY

        // Check platform collisions
        const playerRect = { x: finalX, y: finalY, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }

        platforms.forEach((platform) => {
          if (checkCollision(playerRect, platform)) {
            // Landing on top of platform
            if (currentVelocity.y >= 0 && currentPlayer.y + PLAYER_HEIGHT <= platform.y + 10) {
              finalY = platform.y - PLAYER_HEIGHT
              newVelY = 0
              onGround = true
            }
            // Hitting platform from below
            else if (currentVelocity.y < 0 && currentPlayer.y >= platform.y + platform.height - 10) {
              finalY = platform.y + platform.height
              newVelY = 0
            }
            // Hitting platform from the side
            else {
              if (newVelX > 0) {
                finalX = platform.x - PLAYER_WIDTH
              } else if (newVelX < 0) {
                finalX = platform.x + platform.width
              }
            }
          }
        })

        setIsGrounded(onGround)

        // Boundary checks
        if (finalX < 0) finalX = 0
        if (finalY > CANVAS_HEIGHT) {
          // Player fell off - restart
          GameAudio.playError()
          finalX = 50
          finalY = 300
          newVelX = 0
          newVelY = 0
          setCameraX(0)
        }

        // Spike collisions
        const finalPlayerRect = { x: finalX, y: finalY, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }
        spikes.forEach((spike) => {
          if (checkCollision(finalPlayerRect, spike)) {
            GameAudio.playError()
            finalX = 50
            finalY = 300
            newVelX = 0
            newVelY = 0
            setCameraX(0)
          }
        })

        // Coin collection
        setCoins((currentCoins) => {
          const newCoins = [...currentCoins]
          let coinsFound = 0

          newCoins.forEach((coin) => {
            if (!coin.collected) {
              const coinRect = { x: coin.x, y: coin.y, width: 15, height: 15 }
              if (checkCollision(finalPlayerRect, coinRect)) {
                coin.collected = true
                coinsFound++
                GameAudio.playMatch()
              }
            }
          })

          if (coinsFound > 0) {
            setCoinsCollected((prev) => {
              const newCount = prev + coinsFound
              // Check win condition
              if (newCount >= totalCoins) {
                const timeScore = `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, "0")}`
                GameAudio.playSuccess()
                endGame(true, timeScore)
              }
              return newCount
            })
          }

          return newCoins
        })

        // Update camera to follow player
        setCameraX((currentCameraX) => {
          const targetCameraX = finalX - CANVAS_WIDTH / 2
          return Math.max(0, Math.min(targetCameraX, 1400 - CANVAS_WIDTH))
        })

        setPlayer({ x: finalX, y: finalY })
        return { x: newVelX, y: newVelY }
      })

      return currentPlayer
    })
  }, [isPlaying, isGrounded, time, endGame, totalCoins])

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

    // Save context for camera transform
    ctx.save()
    ctx.translate(-cameraX, 0)

    // Draw platforms
    ctx.fillStyle = "#6366f1"
    platforms.forEach((platform) => {
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
    })

    // Draw spikes
    ctx.fillStyle = "#e02424"
    spikes.forEach((spike) => {
      ctx.fillRect(spike.x, spike.y, spike.width, spike.height)
    })

    // Draw coins
    coins.forEach((coin) => {
      if (!coin.collected) {
        ctx.fillStyle = "#d97706"
        ctx.fillRect(coin.x, coin.y, 15, 15)
      }
    })

    // Draw player
    ctx.fillStyle = "#10b981"
    ctx.fillRect(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT)

    // Restore context
    ctx.restore()
  }, [platforms, spikes, coins, player, cameraX])

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

  if (!gameStarted) {
    return (
      <GameLayout title="Mini Platformer">
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-md w-full mx-4 space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">🏃</div>
              <h2 className="font-serif text-3xl text-foreground">Mini Platformer</h2>
              <p className="text-muted-foreground">
                Run, jump, and collect all {totalCoins} coins! Avoid spikes and don't fall off the platforms.
              </p>
            </div>

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>Collect all {totalCoins} coins to win!</p>
              <p>Use WASD or Arrow Keys to move and jump</p>
              <p>Space bar also jumps</p>
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
    <GameLayout title="Mini Platformer" onRestart={handleRestart}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Game Stats */}
        <div className="flex items-center justify-between mb-8">
          <GameStats
            stats={[
              { label: "Coins", value: `${coinsCollected}/${totalCoins}`, highlight: true },
              { label: "Position", value: Math.floor(player.x) },
            ]}
          />
          <GameTimer isRunning={isPlaying} onTimeUpdate={updateTime} />
        </div>

        {/* Game Canvas */}
        <div className="flex justify-center mb-6">
          <div className="border-2 border-primary/20 rounded-lg overflow-hidden">
            <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block" />
          </div>
        </div>

        {/* Controls and Legend */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Use WASD, Arrow Keys, or Space to move and jump</p>
          <p className="flex items-center justify-center space-x-4">
            <span className="flex items-center">
              <span className="inline-block w-4 h-4 bg-accent rounded mr-2"></span>
              Player
            </span>
            <span className="flex items-center">
              <span className="inline-block w-4 h-4 bg-primary rounded mr-2"></span>
              Platforms
            </span>
            <span className="flex items-center">
              <span className="inline-block w-4 h-4 bg-secondary rounded mr-2"></span>
              Coins
            </span>
            <span className="flex items-center">
              <span className="inline-block w-4 h-4 bg-destructive rounded mr-2"></span>
              Spikes
            </span>
          </p>
        </div>
      </div>

      <GameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={hasWon ? "Level Complete!" : "Try Again"}
        onRestart={handleRestart}
        onHome={handleHome}
        isWin={hasWon}
      >
        <div className="space-y-4">
          <div className="text-4xl">{hasWon ? "🎉" : "🔄"}</div>
          <p className="text-card-foreground">
            {hasWon ? "You collected all the coins!" : "Keep trying to collect all coins!"}
          </p>
          <p className="text-secondary font-bold text-xl">
            Coins: {coinsCollected}/{totalCoins}
          </p>
          {hasWon && (
            <p className="text-accent font-bold">
              Time: {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
            </p>
          )}
        </div>
      </GameModal>
    </GameLayout>
  )
}
