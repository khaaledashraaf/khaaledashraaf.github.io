"use client";

import { usePathname } from "next/navigation";
import { AsciiBackground } from "./ascii-background";
import { Footer } from "./footer";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAbout = pathname === "/about";

  return (
    <>
      {!isAbout && <AsciiBackground />}
      <main
        className={`relative z-10 mx-auto min-h-[calc(100vh-3.5rem)] max-w-4xl px-6 ${
          isAbout ? "bg-transparent" : "bg-white/40 dark:bg-transparent"
        }`}
      >
        {children}
      </main>
      {isAbout ? <Footer showArt={false} light /> : <Footer />}
    </>
  );
}
