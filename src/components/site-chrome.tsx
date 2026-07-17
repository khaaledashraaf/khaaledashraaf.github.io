"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { AsciiBackground } from "./ascii-background";
import { Footer } from "./footer";
import { LyingCharacter } from "./lying-character";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAbout = pathname === "/about";
  const isFinds = pathname.startsWith("/finds");
  const isAdmin = pathname.startsWith("/admin");
  const isHome = pathname === "/";
  const showFooterExtras = !isAbout && !isFinds;
  const isProjects = pathname === "/projects";
  const isBlog = pathname.startsWith("/blog");
  const isTraining = pathname.startsWith("/training");

  // Training runs as a standalone PWA — render it bare, full-height, no chrome.
  if (isTraining) {
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      {!isAbout && <AsciiBackground />}
      <main
        className="relative z-10 mx-auto flex-1 flex flex-col w-full max-w-4xl px-6 bg-transparent"
      >
        {children}
      </main>
      <div className={`relative ${isAdmin ? "hidden" : ""}`}>
        {showFooterExtras && <LyingCharacter className={isProjects || isBlog ? "hidden sm:flex" : ""} />}
        {isFinds && (
          <div className="flex justify-center sm:absolute sm:bottom-0 sm:left-1/2 sm:-translate-x-1/2">
            <Image
              src="/me_fascinated.png"
              alt=""
              width={220}
              height={220}
              className="opacity-80 dark:invert"
            />
          </div>
        )}
        {isHome && (
          <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none hidden md:block">
            <Image
              src="/ascii/footer.svg"
              alt=""
              width={1920}
              height={400}
              className="w-full h-auto opacity-80 dark:opacity-80 dark:invert"
              priority={false}
            />
          </div>
        )}
        <Footer light={isAbout} />
      </div>
    </div>
  );
}
