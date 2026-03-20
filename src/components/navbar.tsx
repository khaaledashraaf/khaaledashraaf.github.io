"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/finds", label: "Finds" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b", pathname === "/about" ? "border-transparent bg-transparent" : "border-border/40 bg-background/80 backdrop-blur-sm")}>
      <nav className="mx-auto flex h-14 max-w-4xl items-center justify-center px-6">
        <div className="flex items-center gap-6">
          <ul className="flex items-center gap-6">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "text-sm transition-colors",
                    pathname === "/about"
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
          <ThemeToggle className={pathname === "/about" ? "text-white hover:text-white hover:bg-white/10" : ""} />
        </div>
      </nav>
    </header>
  );
}
