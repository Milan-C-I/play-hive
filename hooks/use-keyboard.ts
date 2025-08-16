"use client"

import { useEffect, useCallback } from "react"

interface UseKeyboardProps {
  onKeyPress?: (key: string, event: KeyboardEvent) => void
  onKeyDown?: (key: string, event: KeyboardEvent) => void
  onKeyUp?: (key: string, event: KeyboardEvent) => void
  enabled?: boolean
  preventDefault?: boolean
}

export function useKeyboard({
  onKeyPress,
  onKeyDown,
  onKeyUp,
  enabled = true,
  preventDefault = true,
}: UseKeyboardProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      if (preventDefault) {
        event.preventDefault()
      }

      onKeyDown?.(event.key, event)
    },
    [enabled, preventDefault, onKeyDown],
  )

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      if (preventDefault) {
        event.preventDefault()
      }

      onKeyPress?.(event.key, event)
    },
    [enabled, preventDefault, onKeyPress],
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      if (preventDefault) {
        event.preventDefault()
      }

      onKeyUp?.(event.key, event)
    },
    [enabled, preventDefault, onKeyUp],
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keypress", handleKeyPress)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keypress", handleKeyPress)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [enabled, handleKeyDown, handleKeyPress, handleKeyUp])
}
