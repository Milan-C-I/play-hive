"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, RotateCcw } from "lucide-react"

interface GameLayoutProps {
  title: string
  started: boolean
  children: ReactNode
  goBack?: () => void
  onRestart?: () => void
  showRestart?: boolean
  className?: string
}

export function GameLayout({ title, children,goBack, started, onRestart, showRestart = true, className = "" }: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-transparent mb-6">
      {/* Game Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-primary/20 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {
              started && <Button onClick={goBack} className="cursor-pointer">
                <ArrowLeft className="w-4 h-4"></ArrowLeft>
              </Button>
              }
              <h1 className="font-serif font-bold text-sm md:text-2xl text-foreground">{title}</h1>
            </div>

            <div className="flex items-center space-x-2">
              {showRestart && onRestart && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRestart}
                  className="border-primary/20 cursor-pointer hover:border-primary bg-transparent"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restart
                </Button>
              )}
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-foreground cursor-pointer hover:text-primary">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Game Content */}
      <main className={`flex-1 ${className}`}>{children}</main>
    </div>
  )
}
