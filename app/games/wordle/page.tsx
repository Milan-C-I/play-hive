"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { GameLayout } from "@/components/game-layout"
import { GameModal } from "@/components/game-modal"
import { GameTimer } from "@/components/game-timer"
import { useGameState } from "@/hooks/use-game-state"
import { useKeyboard } from "@/hooks/use-keyboard"
import { saveHighScore } from "@/lib/high-scores"
import { GameAudio } from "@/lib/game-audio"

const WORDS = [
  "REACT",
  "GAMES",
  "NEON",
  "CODE",
  "PLAY",
  "WORD",
  "GUESS",
  "LIGHT",
  "POWER",
  "MAGIC",
  "PIXEL",
  "SOUND",
  "MUSIC",
  "DANCE",
  "PARTY",
  "HAPPY",
  "SMILE",
  "LAUGH",
  "DREAM",
  "SHINE",
  "BRAVE",
  "SMART",
  "QUICK",
  "FRESH",
  "CLEAN",
  "SWEET",
  "SHARP",
  "BRIGHT",
  "CLEAR",
  "SOLID",
]

type LetterState = "correct" | "present" | "absent" | "empty"

interface Letter {
  char: string
  state: LetterState
}

export default function WordlePage() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = useState(false)
  const [targetWord, setTargetWord] = useState("")
  const [guesses, setGuesses] = useState<Letter[][]>([])
  const [currentGuess, setCurrentGuess] = useState("")
  const [currentRow, setCurrentRow] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [usedLetters, setUsedLetters] = useState<Map<string, LetterState>>(new Map())
  const [gameTime, setGameTime] = useState(0)

  const { status, startGame, endGame, resetGame, isPlaying, isGameOver, hasWon } = useGameState({
    onGameEnd: (won, score) => {
      if (won) {
        saveHighScore("wordle", gameTime, "Anonymous")
      }
      setShowModal(true)
    },
  })

  const initializeGame = useCallback(() => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)]
    setTargetWord(word)
    setGuesses(
      Array(6)
        .fill(null)
        .map(() => Array(5).fill({ char: "", state: "empty" })),
    )
    setCurrentGuess("")
    setCurrentRow(0)
    setUsedLetters(new Map())
  }, [])

  const checkGuess = (guess: string): Letter[] => {
    const result: Letter[] = []
    const targetLetters = targetWord.split("")
    const guessLetters = guess.split("")

    const tempResult: Letter[] = new Array(5).fill(null)
    const remainingTarget = [...targetLetters]
    const remainingGuess = [...guessLetters]

    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        tempResult[i] = { char: guessLetters[i], state: "correct" }
        remainingTarget[i] = ""
        remainingGuess[i] = ""
      }
    }

    for (let i = 0; i < 5; i++) {
      if (tempResult[i]) continue

      const guessChar = guessLetters[i]
      const targetIndex = remainingTarget.findIndex((char) => char === guessChar)

      if (targetIndex !== -1) {
        tempResult[i] = { char: guessChar, state: "present" }
        remainingTarget[targetIndex] = ""
      } else {
        tempResult[i] = { char: guessChar, state: "absent" }
      }
    }

    return tempResult
  }

  const submitGuess = () => {
    if (currentGuess.length !== 5 || !isPlaying) return

    const guessResult = checkGuess(currentGuess)
    const newGuesses = [...guesses]
    newGuesses[currentRow] = guessResult

    const newUsedLetters = new Map(usedLetters)
    guessResult.forEach((letter) => {
      const currentState = newUsedLetters.get(letter.char)
      if (
        !currentState ||
        (currentState === "absent" && letter.state !== "absent") ||
        (currentState === "present" && letter.state === "correct")
      ) {
        newUsedLetters.set(letter.char, letter.state)
      }
    })

    setGuesses(newGuesses)
    setUsedLetters(newUsedLetters)
    setCurrentGuess("")

    if (currentGuess === targetWord) {
      GameAudio.playSuccess()
      endGame(true, gameTime)
    } else if (currentRow === 5) {
      GameAudio.playGameOver()
      endGame(false, 0)
    } else {
      setCurrentRow(currentRow + 1)
      GameAudio.playClick()
    }
  }

  const handleKeyPress = (key: string) => {
    if (!isPlaying) return

    if (key === "Enter") {
      submitGuess()
    } else if (key === "Backspace") {
      setCurrentGuess((prev) => prev.slice(0, -1))
    } else if (key.match(/^[A-Za-z]$/) && currentGuess.length < 5) {
      setCurrentGuess((prev) => prev + key.toUpperCase())
    }
  }

  useKeyboard({
    onKeyDown: handleKeyPress,
    enabled: isPlaying,
  })

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

  const getLetterStyle = (state: LetterState) => {
    switch (state) {
      case "correct":
        return "bg-green-500 border-accent text-accent-foreground"
      case "present":
        return "bg-orange-400 border-secondary text-secondary-foreground"
      case "absent":
        return "bg-muted border-muted text-muted-foreground"
      default:
        return "bg-card border-primary/20 text-card-foreground"
    }
  }

  if (!gameStarted) {
    return (
      <GameLayout title="Wordle Clone">
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-md w-full mx-4 space-y-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">📝</div>
              <h2 className="font-serif text-3xl text-foreground">Wordle</h2>
              <p className="text-muted-foreground">
                Guess the 5-letter word in 6 tries. Letters will change color to give you clues!
              </p>
            </div>

            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-accent-foreground font-bold">
                  A
                </div>
                <span>Green: Letter is in the word and in the correct position</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-400 rounded flex items-center justify-center text-secondary-foreground font-bold">
                  B
                </div>
                <span>Orange: Letter is in the word but in the wrong position</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-muted-foreground font-bold">
                  C
                </div>
                <span>Gray: Letter is not in the word</span>
              </div>
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
    <GameLayout title="Wordle Clone" onRestart={handleRestart}>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex justify-center mb-4">
          <GameTimer isRunning={isPlaying} onTimeUpdate={setGameTime} />
        </div>

        <div className="grid grid-rows-6 gap-1 mb-6">
          {guesses.map((guess, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-1">
              {Array(5)
                .fill(null)
                .map((_, colIndex) => {
                  const letter = guess[colIndex]
                  const isCurrentRow = rowIndex === currentRow
                  const currentChar = isCurrentRow && currentGuess[colIndex]

                  return (
                    <div
                      key={colIndex}
                      className={`
                      w-12 h-12 border-2 rounded flex items-center justify-center font-bold text-lg
                      ${letter.state !== "empty" ? getLetterStyle(letter.state) : getLetterStyle("empty")}
                      ${isCurrentRow && currentChar ? "border-primary" : ""}
                    `}
                    >
                      {letter.char || currentChar || ""}
                    </div>
                  )
                })}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {[
            ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
            ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
            ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
          ].map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1">
              {row.map((key) => {
                const letterState = usedLetters.get(key)
                const isSpecial = key === "ENTER" || key === "⌫"

                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === "ENTER") {
                        submitGuess()
                      } else if (key === "⌫") {
                        handleKeyPress("Backspace")
                      } else {
                        handleKeyPress(key)
                      }
                    }}
                    className={`
                      px-2 py-2 rounded font-semibold text-xs transition-colors cursor-pointer
                      ${isSpecial ? "px-3" : ""}
                      ${letterState ? getLetterStyle(letterState) : "bg-card border border-primary/20 text-card-foreground hover:bg-card/80"}
                    `}
                  >
                    {key}
                  </button>
                )
              })}
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
        <div className="space-y-4">
          <div className="text-4xl">{hasWon ? "🎉" : "😔"}</div>
          <p className="text-card-foreground">{hasWon ? "You guessed the word!" : `The word was: ${targetWord}`}</p>
          <p className="text-secondary font-bold">{currentRow + (hasWon ? 1 : 0)}/6 guesses</p>
          <p className="text-secondary font-bold">
            Time: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, "0")}
          </p>
        </div>
      </GameModal>
    </GameLayout>
  )
}
