"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { GameLayout } from "@/components/game-layout"
import { GameModal } from "@/components/game-modal"
import { GameStats } from "@/components/game-stats"
import { useGameState } from "@/hooks/use-game-state"
import { useKeyboard } from "@/hooks/use-keyboard"
import { GameStorage } from "@/lib/game-storage"
import { GameAudio } from "@/lib/game-audio"
import { saveHighScore } from "@/lib/high-scores"

type Grid = number[][]
type Direction = "up" | "down" | "left" | "right"

export default function Game2048Page() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = useState(false)
  const [grid, setGrid] = useState<Grid>([])
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [hasWon2048, setHasWon2048] = useState(false)

  const { status, startGame, endGame, resetGame, isPlaying, isGameOver, hasWon } = useGameState({
    onGameEnd: (won, finalScore) => {
      if (typeof finalScore === "number") {
        saveHighScore("2048", finalScore, "Anonymous")
      }
      setShowModal(true)
    },
  })

  const createEmptyGrid = (): Grid => {
    return Array(4)
      .fill(null)
      .map(() => Array(4).fill(0))
  }

  const addRandomTile = (currentGrid: Grid): Grid => {
    const emptyCells: Array<[number, number]> = []

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (currentGrid[i][j] === 0) {
          emptyCells.push([i, j])
        }
      }
    }

    if (emptyCells.length === 0) return currentGrid

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    const newGrid = currentGrid.map((row) => [...row])
    newGrid[randomCell[0]][randomCell[1]] = Math.random() < 0.9 ? 2 : 4

    return newGrid
  }

  const initializeGame = useCallback(() => {
    let newGrid = createEmptyGrid()
    newGrid = addRandomTile(newGrid)
    newGrid = addRandomTile(newGrid)
    setGrid(newGrid)
    setScore(0)
    setHasWon2048(false)

    // Load best score
    const saved = GameStorage.getBestScore("2048")
    setBestScore(saved ? Number(saved.score) : 0)
  }, [])

  const slideArray = (arr: number[]): { newArray: number[]; scoreGained: number } => {
    const filtered = arr.filter((val) => val !== 0)
    const missing = 4 - filtered.length
    const zeros = Array(missing).fill(0)
    let scoreGained = 0

    // Merge tiles
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2
        scoreGained += filtered[i]
        filtered[i + 1] = 0
      }
    }

    const finalFiltered = filtered.filter((val) => val !== 0)
    const finalMissing = 4 - finalFiltered.length
    const finalZeros = Array(finalMissing).fill(0)

    return {
      newArray: [...finalFiltered, ...finalZeros],
      scoreGained,
    }
  }

  const moveGrid = (
    currentGrid: Grid,
    direction: Direction,
  ): { newGrid: Grid; moved: boolean; scoreGained: number } => {
    let newGrid: Grid = []
    let totalScoreGained = 0
    let moved = false

    switch (direction) {
      case "left":
        newGrid = currentGrid.map((row) => {
          const result = slideArray(row)
          totalScoreGained += result.scoreGained
          if (JSON.stringify(result.newArray) !== JSON.stringify(row)) {
            moved = true
          }
          return result.newArray
        })
        break

      case "right":
        newGrid = currentGrid.map((row) => {
          const reversed = [...row].reverse()
          const result = slideArray(reversed)
          totalScoreGained += result.scoreGained
          const final = result.newArray.reverse()
          if (JSON.stringify(final) !== JSON.stringify(row)) {
            moved = true
          }
          return final
        })
        break

      case "up":
        newGrid = createEmptyGrid()
        for (let col = 0; col < 4; col++) {
          const column = currentGrid.map((row) => row[col])
          const result = slideArray(column)
          totalScoreGained += result.scoreGained
          if (JSON.stringify(result.newArray) !== JSON.stringify(column)) {
            moved = true
          }
          for (let row = 0; row < 4; row++) {
            newGrid[row][col] = result.newArray[row]
          }
        }
        break

      case "down":
        newGrid = createEmptyGrid()
        for (let col = 0; col < 4; col++) {
          const column = currentGrid.map((row) => row[col]).reverse()
          const result = slideArray(column)
          totalScoreGained += result.scoreGained
          const final = result.newArray.reverse()
          if (JSON.stringify(final) !== JSON.stringify(currentGrid.map((row) => row[col]))) {
            moved = true
          }
          for (let row = 0; row < 4; row++) {
            newGrid[row][col] = final[row]
          }
        }
        break
    }

    return { newGrid, moved, scoreGained: totalScoreGained }
  }

  const isGameOverCheck = (currentGrid: Grid): boolean => {
    // Check for empty cells
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (currentGrid[i][j] === 0) return false
      }
    }

    // Check for possible merges
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const current = currentGrid[i][j]
        if ((i < 3 && currentGrid[i + 1][j] === current) || (j < 3 && currentGrid[i][j + 1] === current)) {
          return false
        }
      }
    }

    return true
  }

  const handleMove = (direction: Direction) => {
    if (!isPlaying) return

    const result = moveGrid(grid, direction)

    if (!result.moved) return

    GameAudio.playClick()

    const newScore = score + result.scoreGained
    setScore(newScore)

    if (result.scoreGained > 0) {
      GameAudio.playMatch()
    }

    // Check for 2048 tile (win condition)
    const has2048 = result.newGrid.some((row) => row.some((cell) => cell === 2048))
    if (has2048 && !hasWon2048) {
      setHasWon2048(true)
      GameAudio.playSuccess()
      endGame(true, newScore)
      return
    }

    const gridWithNewTile = addRandomTile(result.newGrid)
    setGrid(gridWithNewTile)

    // Check game over
    if (isGameOverCheck(gridWithNewTile)) {
      GameAudio.playGameOver()
      endGame(false, newScore)
    }
  }

  const handleKeyPress = (key: string) => {
    switch (key) {
      case "ArrowLeft":
      case "a":
        handleMove("left")
        break
      case "ArrowRight":
      case "d":
        handleMove("right")
        break
      case "ArrowUp":
      case "w":
        handleMove("up")
        break
      case "ArrowDown":
      case "s":
        handleMove("down")
        break
    }
  }

  useKeyboard({
    onKeyDown: handleKeyPress,
    enabled: isPlaying,
  })

  const getTileColor = (value: number): string => {
    const colors: { [key: number]: string } = {
      2: "bg-gray-200 text-gray-800",
      4: "bg-gray-300 text-gray-800",
      8: "bg-orange-300 text-white",
      16: "bg-orange-400 text-white",
      32: "bg-orange-500 text-white",
      64: "bg-red-400 text-white",
      128: "bg-yellow-400 text-white",
      256: "bg-yellow-500 text-white",
      512: "bg-yellow-600 text-white",
      1024: "bg-yellow-700 text-white",
      2048: "bg-primary text-primary-foreground",
    }
    return colors[value] || "bg-secondary text-secondary-foreground"
  }

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
      <GameLayout title="2048">
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-md w-full mx-4 space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">🔢</div>
              <h2 className="font-serif text-3xl text-foreground">2048</h2>
              <p className="text-muted-foreground">
                Slide tiles to combine numbers and reach the 2048 tile! Use arrow keys or WASD to move.
              </p>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Goal</span>
                <span className="text-primary">Reach 2048</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Controls</span>
                <span className="text-accent">Arrow Keys or WASD</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Strategy</span>
                <span className="text-secondary">Keep largest tiles in corners</span>
              </div>
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
    <GameLayout title="2048" onRestart={handleRestart}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Game Stats */}
        <GameStats
          stats={[
            { label: "Score", value: score, highlight: true },
            { label: "Best", value: bestScore },
          ]}
          className="mb-8"
        />

        {/* Game Grid */}
        <div className="bg-card rounded-lg p-4 mb-6 border border-primary/20">
          <div className="grid grid-cols-4 gap-2">
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-200
                    ${cell === 0 ? "bg-muted" : getTileColor(cell)}
                  `}
                >
                  {cell !== 0 && cell}
                </div>
              )),
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Use Arrow Keys or WASD to slide tiles</p>
          <p>Combine tiles with the same number to create larger ones!</p>
        </div>
      </div>

      <GameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={hasWon ? "You Win!" : "Game Over"}
        onRestart={handleRestart}
        onHome={handleHome}
        isWin={hasWon}
      >
        <div className="space-y-4">
          <div className="text-4xl">{hasWon ? "🎉" : "😔"}</div>
          <p className="text-card-foreground">{hasWon ? "You reached 2048!" : "No more moves available!"}</p>
          <p className="text-secondary font-bold text-xl">Final Score: {score}</p>
          {score > bestScore && <p className="text-accent font-bold">New Best Score!</p>}
        </div>
      </GameModal>
    </GameLayout>
  )
}
