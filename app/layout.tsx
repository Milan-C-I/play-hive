import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import LightRays from "./LightRays"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Play Hive - Gaming Platform",
  description: "Experience 10 classic games with modern design and professional polish",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="font-sans antialiased">
        <div style={{ width: '100%', height: '600px', position: 'fixed', zIndex: '-1' }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#cccccc"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.3}
          distortion={0.05}
          className="custom-rays"
        />
      </div>
        {children}
        </body>
    </html>
  )
}
