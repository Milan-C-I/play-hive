"use client"

import type { ReactNode } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, RotateCcw, Home } from "lucide-react"

interface GameModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  onRestart?: () => void
  onHome?: () => void
  showRestart?: boolean
  showHome?: boolean
  isWin?: boolean
}

export function GameModal({
  isOpen,
  onClose,
  title,
  children,
  onRestart,
  onHome,
  showRestart = true,
  showHome = true,
  isWin = false,
}: GameModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-2 border-primary/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center space-x-2 text-2xl font-serif">
            {isWin && <Trophy className="w-6 h-6 text-secondary" />}
            <span className={isWin ? "text-secondary" : "text-foreground"}>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 text-center space-y-4">{children}</div>

        <div className="flex items-center justify-center space-x-3">
          {showRestart && onRestart && (
            <Button onClick={onRestart} className="bg-primary hover:bg-primary/90">
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          )}
          {showHome && onHome && (
            <Button
              variant="outline"
              onClick={onHome}
              className="border-primary/20 hover:border-primary bg-transparent"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
