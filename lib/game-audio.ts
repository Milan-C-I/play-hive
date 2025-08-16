"use client"

export class GameAudio {
  private static audioContext: AudioContext | null = null
  private static isMuted = true

  static init(): void {
    if (typeof window === "undefined") return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.isMuted = localStorage.getItem("neon-gaming-muted") === "true"
    } catch (error) {
      console.warn("Audio context not supported:", error)
    }
  }

  static setMuted(muted: boolean): void {
    this.isMuted = muted
    if (typeof window !== "undefined") {
      localStorage.setItem("neon-gaming-muted", muted.toString())
    }
  }

  static getMuted(): boolean {
    return this.isMuted
  }

  static playTone(frequency: number, duration: number, type: OscillatorType = "sine"): void {
    if (this.isMuted || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
      oscillator.type = type

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration)
    } catch (error) {
      console.warn("Failed to play tone:", error)
    }
  }

  static playClick(): void {
    this.playTone(800, 0.1, "square")
  }

  static playSuccess(): void {
    this.playTone(523, 0.2) // C5
    setTimeout(() => this.playTone(659, 0.2), 100) // E5
    setTimeout(() => this.playTone(784, 0.3), 200) // G5
  }

  static playError(): void {
    this.playTone(200, 0.3, "sawtooth")
  }

  static playMatch(): void {
    this.playTone(440, 0.15) // A4
    setTimeout(() => this.playTone(554, 0.15), 75) // C#5
  }

  static playGameOver(): void {
    this.playTone(330, 0.2) // E4
    setTimeout(() => this.playTone(294, 0.2), 150) // D4
    setTimeout(() => this.playTone(262, 0.4), 300) // C4
  }
}
