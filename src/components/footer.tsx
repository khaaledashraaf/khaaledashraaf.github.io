import Image from "next/image";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="relative md:-mt-40">
      {/* ASCII art - positioned behind with negative margin overlap */}
      <div className="relative z-0 -mt-32 pointer-events-none hidden md:block">
        <Image
          src="/ascii/footer.svg"
          alt=""
          width={1920}
          height={400}
          className="w-full h-auto opacity-60 dark:opacity-60 dark:invert pb-6"
          priority={false}
        />
      </div>

      {/* Footer content overlaid on top of ASCII art */}
      <div className="relative md:absolute md:bottom-25 md:left-0 md:right-0 z-10 py-8 md:py-0">
        <div className="mx-auto w-full max-w-4xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-foreground/80 sm:flex-row">
            <p>Khaled Ashraf</p>
            <div className="flex gap-4">
              <a
                href="https://github.com/khaaledashraaf"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/khaledaelmaleh/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
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
