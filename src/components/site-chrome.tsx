"use client";

import { usePathname } from "next/navigation";
import { AsciiBackground } from "./ascii-background";
import { Footer } from "./footer";
import { LyingCharacter } from "./lying-character";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAbout = pathname === "/about";
  const isFinds = pathname.startsWith("/finds");
  const showFooterExtras = !isAbout && !isFinds;
  const isProjects = pathname === "/projects";

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      {!isAbout && <AsciiBackground />}
      <main
        className="relative z-10 mx-auto flex-1 flex flex-col max-w-4xl px-6 bg-transparent"
      >
        {children}
      </main>
      {showFooterExtras && <LyingCharacter className={isProjects ? "hidden sm:flex" : ""} />}
      <Footer light={isAbout} showAscii={showFooterExtras} />
    </div>
  );
}
