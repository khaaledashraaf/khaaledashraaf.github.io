import Image from "next/image";

export function Footer({ light = false, showAscii = true }: { light?: boolean; showAscii?: boolean }) {
  return (
    <footer className="relative">
      {showAscii && (
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
