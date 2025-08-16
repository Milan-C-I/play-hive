import { Navigation } from "@/components/navigation"
import SplitText from "../splittext"
import ShinyText from "../ShinyText"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <Navigation />

      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SplitText
              text="About Play Hive"
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
            <ShinyText text="A modern take on classic arcade gaming!" disabled={false} speed={2} className='custom-class text-xl' />
          </div>

          <div className="prose prose-lg max-w-none text-card-foreground">
            <div className="bg-card rounded-lg p-8 border border-primary/20">
              <h2 className="font-serif text-2xl text-primary mb-4">Our Mission</h2>
              <p className="mb-6 text-sm md:text-lg text-gray-400">
                Play Hive brings together 10 beloved classic games in a sleek, modern interface. We've reimagined
                these timeless arcade experiences with vibrant neon aesthetics, smooth animations, and responsive design
                that works perfectly on any device.
              </p>

              <h2 className="font-serif text-2xl text-primary mb-4">Features</h2>
              <ul className="list-disc list-inside text-gray-400 text-sm md:text-lg space-y-2 mb-6">
                <li>10 fully playable classic games</li>
                <li>Local high score tracking</li>
                <li>Responsive design for all devices</li>
                <li>Dark neon theme with smooth animations</li>
                <li>Touch and keyboard controls</li>
                <li>No ads, no tracking, just pure gaming fun</li>
              </ul>

              <h2 className="font-serif text-2xl text-primary mb-4">Technology</h2>
              <p className="text-sm md:text-lg text-gray-400">
                Built with Next.js, TypeScript, and Tailwind CSS for optimal performance and modern web standards. All
                games run entirely in your browser with no external dependencies.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
