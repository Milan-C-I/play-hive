"use client"

interface GameStatsProps {
  stats: Array<{
    label: string
    value: string | number
    highlight?: boolean
  }>
  className?: string
}

export function GameStats({ stats, className = "" }: GameStatsProps) {
  return (
    <div className={`flex items-center justify-center space-x-6 ${className}`}>
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className={`text-2xl font-bold ${stat.highlight ? "text-secondary" : "text-primary"}`}>{stat.value}</div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
