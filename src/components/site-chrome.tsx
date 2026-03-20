"use client";

import { usePathname } from "next/navigation";
import { AsciiBackground } from "./ascii-background";
import { Footer } from "./footer";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAbout = pathname === "/about";
  const isFinds = pathname.startsWith("/finds");
  const showFooterArt = !isAbout && !isFinds;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      {!isAbout && <AsciiBackground />}
      <main
        className="relative z-10 mx-auto flex-1 flex flex-col max-w-4xl px-6 bg-transparent"
      >
        {children}
      </main>
      <Footer showArt={showFooterArt} light={isAbout} />
    </div>
  );
}
