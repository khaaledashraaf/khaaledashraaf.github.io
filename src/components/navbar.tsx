"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/finds", label: "Finds" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAbout = pathname === "/about";

  // The training app runs as a standalone PWA — no portfolio chrome.
  if (pathname.startsWith("/training")) return null;

  return (
    <>
    <header className={cn("sticky top-0 z-50 w-full border-b", isAbout ? "border-transparent bg-transparent" : "border-border/40 bg-background/80 backdrop-blur-sm")}>
      <nav className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6 sm:justify-center">
        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          <ul className="flex items-center gap-6">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "text-sm transition-colors",
                    isAbout
                      ? pathname === href
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                      : pathname === href || (href !== "/" && pathname.startsWith(href))
                      ? "text-foreground hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <ThemeToggle className={isAbout ? "text-white hover:text-white hover:bg-white/10" : ""} />
        </div>

        {/* Mobile nav trigger */}
        <div className="flex sm:hidden items-center justify-between w-full">
          <ThemeToggle className={isAbout ? "text-white hover:text-white hover:bg-white/10" : ""} />
          <button
            onClick={() => setOpen(!open)}
            className={cn("h-8 w-8 flex items-center justify-center rounded-md transition-colors", isAbout ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted/50")}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

    </header>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn("sm:hidden fixed inset-0 top-14 z-[100] flex flex-col items-center justify-center", isAbout ? "bg-black" : "bg-background")}
          >
            <ul className="flex flex-col items-center gap-6">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block text-2xl font-medium transition-colors",
                      isAbout
                        ? pathname === href
                          ? "text-white"
                          : "text-white/60 hover:text-white"
                        : pathname === href || (href !== "/" && pathname.startsWith(href))
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
