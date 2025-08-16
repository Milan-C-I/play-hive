import { Navigation } from "@/components/navigation"
import { GameCard } from "@/components/game-card"
import SplitText from "./splittext"
import ShinyText from "./ShinyText"

const games = [
  {
    title: "Emoji Memory Match",
    description: "Flip and match pairs of cute emojis before the timer runs out! Test your memory and speed.",
    href: "/games/memory-match",
    icon: "🧠",
    difficulty: "Easy" as const,
    bestScore: "45s",
  },
  {
    title: "2048 Clone",
    description: "Slide and merge number tiles to reach the magic 2048 tile. Simple rules, endless strategy.",
    href: "/games/2048",
    icon: "🔢",
    difficulty: "Medium" as const,
    bestScore: "2048",
  },
  {
    title: "Wordle Clone",
    description: "Guess the hidden word in 6 tries! Letters change color to give you clues.",
    href: "/games/wordle",
    icon: "📝",
    difficulty: "Medium" as const,
    bestScore: "3/6",
  },
  {
    title: "Typing Speed Test",
    description: "Type the given text as fast and accurately as you can. Beat your own record!",
    href: "/games/typing-test",
    icon: "⌨️",
    difficulty: "Easy" as const,
    bestScore: "85 WPM",
  },
  {
    title: "Snake Game",
    description: "Control the snake, eat the food, and grow longer. One wrong turn and it's game over!",
    href: "/games/snake",
    icon: "🐍",
    difficulty: "Medium" as const,
    bestScore: "127",
  },
  {
    title: "Minesweeper",
    description: "Reveal all safe tiles without triggering a mine. Use your logic to survive!",
    href: "/games/minesweeper",
    icon: "💣",
    difficulty: "Hard" as const,
    bestScore: "89s",
  },
  {
    title: "Tower Blocks",
    description: "Stack moving blocks as high as you can. Miss too much, and your tower will tumble!",
    href: "/games/tower-blocks",
    icon: "🏗️",
    difficulty: "Medium" as const,
    bestScore: "24",
  },
  {
    title: "Breakout",
    description: "Bounce the ball to smash all the bricks. Grab power-ups and clear the stage!",
    href: "/games/breakout",
    icon: "🧱",
    difficulty: "Medium" as const,
    bestScore: "Level 8",
  },
  {
    title: "Simon Memory",
    description: "Repeat the sequence of lights and sounds. Each round gets harder!",
    href: "/games/simon",
    icon: "🎵",
    difficulty: "Hard" as const,
    bestScore: "12",
  },
  {
    title: "Mini Platformer",
    description: "Run, jump, and collect coins in a tiny 2D world. Finish the level in record time!",
    href: "/games/platformer",
    icon: "🏃",
    difficulty: "Hard" as const,
    bestScore: "1:23",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-transparent">
      <Navigation />

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SplitText
              text="Play Hive!"
              className="font-bold text-4xl md:text-6xl text-foreground mb-4 p-4"
              delay={100}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />
            <div className="bg-card rounded-xl p-6 max-w-3xl mx-auto border border-border">
              <ShinyText text="Challenge yourself and Experience 10 classic arcade games" disabled={false} speed={2} className='custom-class text-sm md:text-xl' />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game, index) => (
              <div key={game.href} className="fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <GameCard
                  title={game.title}
                  description={game.description}
                  href={game.href}
                  icon={game.icon}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}
