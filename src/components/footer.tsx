import Image from "next/image";
import { Separator } from "@/components/ui/separator";

export function Footer({ showArt = true, light = false }: { showArt?: boolean; light?: boolean }) {
  return (
    <footer className="relative">
      {/* ASCII art - decorative, does not affect layout */}
      {showArt && (
        <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none hidden md:block">
          <Image
            src="/ascii/footer.svg"
            alt=""
            width={1920}
            height={400}
            className="w-full h-auto opacity-60 dark:opacity-60 dark:invert"
            priority={false}
          />
        </div>
      )}

      {/* Character animation - centered, decorative */}
      {showArt && (
        <div className="absolute inset-0 z-0 flex items-end justify-center pointer-events-none">
          <video
            src="/animations/character-lying-on-grass.webm"
            autoPlay
            loop
            muted
            playsInline
            className="w-64 md:w-80 dark:invert opacity-80"
          />
        </div>
      )}

      {/* Footer content */}
      <div className="relative z-10 py-8">
        <div className="mx-auto w-full max-w-4xl px-6">
          <div className={`flex flex-col items-center justify-between gap-4 text-sm sm:flex-row ${light ? "text-white/60" : "text-foreground/80"}`}>
            <p className={light ? "text-white/80" : ""}>Khaled Ashraf</p>
            <div className="flex gap-4">
              <a
                href="https://github.com/khaaledashraaf"
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors ${light ? "hover:text-white" : "hover:text-foreground"}`}
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/khaledaelmaleh/"
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors ${light ? "hover:text-white" : "hover:text-foreground"}`}
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
