"use client"

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

const EMOJIS = [
  "🎮",
  "🎯",
  "🎲",
  "🎪",
  "🎨",
  "🎭",
  "🎸",
  "🎺",
  "🎻",
  "🎹",
  "🎤",
  "🎧",
  "🎬",
  "🎥",
  "📱",
  "💻",
  "⌚",
  "📷",
  "🔋",
  "💡",
  "🔮",
  "💎",
  "🏆",
  "🎁",
]

interface Card {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

export default function MemoryMatchPage() {
  const router = useRouter()
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [gameStarted, setGameStarted] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const [showModal, setShowModal] = useState(false)

  const { status, time, startGame, endGame, resetGame, updateTime, isPlaying, isGameOver, hasWon } = useGameState({
    onGameEnd: (won, score) => {
      if (won && typeof score === "string") {
        saveHighScore("memory-match", score, "Anonymous")
      }
      setShowModal(true)
    },
  })

  const getDifficultySettings = (diff: Difficulty) => {
    switch (diff) {
      case "easy":
        return { pairs: 6, cols: 4, mcols:3 }
      case "medium":
        return { pairs: 8, cols: 4, mcols:4 }
      case "hard":
        return { pairs: 12, cols: 6, mcols: 4  }
    }
  }

  const initializeGame = useCallback(() => {
    const { pairs } = getDifficultySettings(difficulty)
    const selectedEmojis = EMOJIS.slice(0, pairs)
    const gameEmojis = [...selectedEmojis, ...selectedEmojis]

    // Shuffle the cards
    for (let i = gameEmojis.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[gameEmojis[i], gameEmojis[j]] = [gameEmojis[j], gameEmojis[i]]
    }

    const newCards: Card[] = gameEmojis.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
    }))

    setCards(newCards)
    setFlippedCards([])
    setMatches(0)
  }, [difficulty])

  const handleCardClick = (cardId: number) => {
    if (!isPlaying || flippedCards.length >= 2) return

    const card = cards.find((c) => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched) return

    GameAudio.playClick()
    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)))

    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards
      const firstCard = cards.find((c) => c.id === firstId)
      const secondCard = cards.find((c) => c.id === secondId)

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found
        GameAudio.playMatch()
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c)))
          setMatches((prev) => prev + 1)
          setFlippedCards([])

          // Check if game is won
          const { pairs } = getDifficultySettings(difficulty)
          if (matches + 1 === pairs) {
            const timeScore = `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, "0")}`
            endGame(true, timeScore)
          }
        }, 500)
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c)))
          setFlippedCards([])
        }, 1000)
      }
    }
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

  const goBack = () => {
    setGameStarted(false)
  }

  const handleHome = () => {
    router.push("/")
  }

  useEffect(() => {
    if (!gameStarted) {
      initializeGame()
    }
  }, [difficulty, gameStarted, initializeGame])

  const { pairs, cols, mcols } = getDifficultySettings(difficulty)

  if (!gameStarted) {
    return (
      <GameLayout title="Emoji Memory Match" started={gameStarted}>
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-md w-full mx-4 space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">🧠</div>
              <h2 className="font-serif text-3xl text-foreground">Memory Match</h2>
              <p className="text-muted-foreground">
                Flip cards to find matching pairs. Complete all matches as quickly as possible!
              </p>
            </div>

            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />

            <button
              onClick={handleStart}
              className="w-full cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-6 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Game
            </button>
          </div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout title="Emoji Memory Match" started={gameStarted} goBack={goBack} onRestart={handleRestart}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Game Stats */}
        <div className="flex items-center justify-between mb-8">
          <GameStats
            stats={[
              { label: "Matches", value: `${matches}/${pairs}`, highlight: true },
              { label: "Flipped", value: flippedCards.length },
            ]}
          />
          <GameTimer isRunning={isPlaying} onTimeUpdate={updateTime} />
        </div>

        {/* Game Grid */}
        <div className={`grid gap-4 mx-auto max-h-screen max-w-4xl`} style={{ gridTemplateColumns: `repeat(${window.innerWidth > 768 ? cols : mcols}, 1fr)` }}>
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`
                aspect-square ${cols === 4 && window.innerWidth > 768 ? "w-36 mx-auto" : ""} rounded-lg border-2 cursor-pointer transition-all duration-300 flex items-center justify-center text-4xl
                ${
                  card.isMatched
                    ? "bg-accent/20 border-accent"
                    : card.isFlipped
                      ? "bg-primary/20 border-primary"
                      : "bg-card border-primary/20 hover:border-primary/40 hover:bg-card/80"
                }
              `}
            >
              {card.isFlipped || card.isMatched ? card.emoji : "?"}
            </div>
          ))}
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
        {hasWon && (
          <div className="space-y-4">
            <div className="text-4xl">🎉</div>
            <p className="text-card-foreground">
              You matched all pairs in{" "}
              <span className="text-secondary font-bold">
                {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
              </span>
              !
            </p>
            <p className="text-sm text-muted-foreground">Difficulty: {difficulty}</p>
          </div>
        )}
      </GameModal>
    </GameLayout>
  )
}
