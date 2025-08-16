"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { GameLayout } from "@/components/game-layout"
import { GameModal } from "@/components/game-modal"
import { GameStats } from "@/components/game-stats"
import { GameTimer } from "@/components/game-timer"
import { DifficultySelector, type Difficulty } from "@/components/difficulty-selector"
import { useGameState } from "@/hooks/use-game-state"
import { GameStorage } from "@/lib/game-storage"
import { GameAudio } from "@/lib/game-audio"
import { saveHighScore } from "@/lib/high-scores"

interface Cell {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  neighborMines: number
}

type Grid = Cell[][]

export default function MinesweeperPage() {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [gameStarted, setGameStarted] = useState(false)
  const [grid, setGrid] = useState<Grid>([])
  const [mineCount, setMineCount] = useState(0)
  const [flagCount, setFlagCount] = useState(0)
  const [firstClick, setFirstClick] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const { status, time, startGame, endGame, resetGame, updateTime, isPlaying, isGameOver, hasWon } = useGameState({
    onGameEnd: (won, score) => {
      if (won && typeof score === "string") {
        saveHighScore("minesweeper", score, "Anonymous")
      }
      setShowModal(true)
    },
  })

  const getDifficultySettings = (diff: Difficulty) => {
    switch (diff) {
      case "easy":
        return { rows: 9, cols: 9, mines: 10 }
      case "medium":
        return { rows: 16, cols: 16, mines: 40 }
      case "hard":
        return { rows: 16, cols: 30, mines: 99 }
    }
  }

  const createEmptyGrid = (rows: number, cols: number): Grid => {
    return Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0,
          })),
      )
  }

  const placeMines = (grid: Grid, mineCount: number, firstClickRow: number, firstClickCol: number): Grid => {
    const { rows, cols } = getDifficultySettings(difficulty)
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })))
    let minesPlaced = 0

    while (minesPlaced < mineCount) {
      const row = Math.floor(Math.random() * rows)
      const col = Math.floor(Math.random() * cols)

      // Don't place mine on first click or if already has mine
      if (!newGrid[row][col].isMine && !(row === firstClickRow && col === firstClickCol)) {
        newGrid[row][col].isMine = true
        minesPlaced++
      }
    }

    return newGrid
  }

  const calculateNeighborMines = (grid: Grid): Grid => {
    const { rows, cols } = getDifficultySettings(difficulty)
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })))

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!newGrid[row][col].isMine) {
          let count = 0
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              const newRow = row + i
              const newCol = col + j
              if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && newGrid[newRow][newCol].isMine) {
                count++
              }
            }
          }
          newGrid[row][col].neighborMines = count
        }
      }
    }

    return newGrid
  }

  const initializeGame = useCallback(() => {
    const { rows, cols, mines } = getDifficultySettings(difficulty)
    const newGrid = createEmptyGrid(rows, cols)
    setGrid(newGrid)
    setMineCount(mines)
    setFlagCount(0)
    setFirstClick(true)
  }, [difficulty])

  const revealCell = (row: number, col: number) => {
    if (!isPlaying) return

    setGrid((currentGrid) => {
      const newGrid = currentGrid.map((r) => r.map((c) => ({ ...c })))
      const { rows, cols } = getDifficultySettings(difficulty)

      // Handle first click
      if (firstClick) {
        setFirstClick(false)
        const gridWithMines = placeMines(newGrid, mineCount, row, col)
        const finalGrid = calculateNeighborMines(gridWithMines)

        // Reveal the clicked cell and empty neighbors
        const reveal = (r: number, c: number) => {
          if (r < 0 || r >= rows || c < 0 || c >= cols || finalGrid[r][c].isRevealed || finalGrid[r][c].isFlagged)
            return

          finalGrid[r][c].isRevealed = true

          if (finalGrid[r][c].neighborMines === 0 && !finalGrid[r][c].isMine) {
            for (let i = -1; i <= 1; i++) {
              for (let j = -1; j <= 1; j++) {
                reveal(r + i, c + j)
              }
            }
          }
        }

        reveal(row, col)
        GameAudio.playClick()
        return finalGrid
      }

      // Normal click
      if (newGrid[row][col].isRevealed || newGrid[row][col].isFlagged) return currentGrid

      if (newGrid[row][col].isMine) {
        // Game over - reveal all mines
        newGrid.forEach((r) =>
          r.forEach((c) => {
            if (c.isMine) c.isRevealed = true
          }),
        )
        GameAudio.playGameOver()
        endGame(false, `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, "0")}`)
        return newGrid
      }

      // Reveal cell and empty neighbors
      const reveal = (r: number, c: number) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols || newGrid[r][c].isRevealed || newGrid[r][c].isFlagged) return

        newGrid[r][c].isRevealed = true

        if (newGrid[r][c].neighborMines === 0) {
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              reveal(r + i, c + j)
            }
          }
        }
      }

      reveal(row, col)
      GameAudio.playClick()

      // Check win condition
      const unrevealedNonMines = newGrid.flat().filter((cell) => !cell.isRevealed && !cell.isMine).length
      if (unrevealedNonMines === 0) {
        GameAudio.playSuccess()
        endGame(true, `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, "0")}`)
      }

      return newGrid
    })
  }

  const toggleFlag = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault()
    if (!isPlaying) return

    setGrid((currentGrid) => {
      const newGrid = currentGrid.map((r) => r.map((c) => ({ ...c })))

      if (newGrid[row][col].isRevealed) return currentGrid

      if (newGrid[row][col].isFlagged) {
        newGrid[row][col].isFlagged = false
        setFlagCount((prev) => prev - 1)
      } else {
        newGrid[row][col].isFlagged = true
        setFlagCount((prev) => prev + 1)
      }

      GameAudio.playClick()
      return newGrid
    })
  }

  const getCellContent = (cell: Cell): string => {
    if (cell.isFlagged) return "🚩"
    if (!cell.isRevealed) return ""
    if (cell.isMine) return "💣"
    if (cell.neighborMines === 0) return ""
    return cell.neighborMines.toString()
  }

  const getCellStyle = (cell: Cell): string => {
    if (cell.isFlagged) return "bg-secondary text-secondary-foreground"
    if (!cell.isRevealed) return "bg-card hover:bg-card/80 cursor-pointer"
    if (cell.isMine) return "bg-destructive text-destructive-foreground"

    const colors = [
      "",
      "text-blue-600",
      "text-green-600",
      "text-red-600",
      "text-purple-600",
      "text-yellow-600",
      "text-pink-600",
      "text-gray-600",
      "text-black",
    ]

    return `bg-muted ${colors[cell.neighborMines] || ""}`
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

  const { rows, cols, mines } = getDifficultySettings(difficulty)

  if (!gameStarted) {
    return (
      <GameLayout title="Minesweeper">
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-md w-full mx-4 space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">💣</div>
              <h2 className="font-serif text-3xl text-foreground">Minesweeper</h2>
              <p className="text-muted-foreground">
                Reveal all safe cells without hitting a mine! Right-click to flag suspected mines.
              </p>
            </div>

            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>
                Grid: {rows}×{cols} with {mines} mines
              </p>
              <p>Left click to reveal, right click to flag</p>
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
    <GameLayout title="Minesweeper" onRestart={handleRestart}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Game Stats */}
        <div className="flex items-center justify-between mb-8">
          <GameStats
            stats={[
              { label: "Mines", value: `${flagCount}/${mines}`, highlight: true },
              { label: "Grid", value: `${rows}×${cols}` },
            ]}
          />
          <GameTimer isRunning={isPlaying} onTimeUpdate={updateTime} />
        </div>

        {/* Game Grid */}
        <div className="flex justify-center mb-6">
          <div
            className="grid gap-1 bg-card p-4 rounded-lg border border-primary/20"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <button
                  key={`${i}-${j}`}
                  onClick={() => revealCell(i, j)}
                  onContextMenu={(e) => toggleFlag(i, j, e)}
                  className={`
                    w-6 h-6 text-xs font-bold border border-primary/20 transition-colors
                    ${getCellStyle(cell)}
                  `}
                  disabled={!isPlaying}
                >
                  {getCellContent(cell)}
                </button>
              )),
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Left click to reveal cells, right click to flag mines</p>
          <p>Numbers show how many mines are adjacent to that cell</p>
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
          <div className="text-4xl">{hasWon ? "🎉" : "💥"}</div>
          <p className="text-card-foreground">{hasWon ? "You cleared all the mines!" : "You hit a mine!"}</p>
          <p className="text-secondary font-bold text-xl">
            Time: {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
          </p>
          <p className="text-card-foreground">
            Flags Used: {flagCount}/{mines}
          </p>
          <p className="text-sm text-muted-foreground">Difficulty: {difficulty}</p>
        </div>
      </GameModal>
    </GameLayout>
  )
}
